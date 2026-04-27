import { load } from "cheerio";

export type ScrapedVenue =
  | "carnegie_hall"
  | "met_opera"
  | "juilliard"
  | "msm"
  | "ny_phil"
  | "nycballet";

export interface ScrapedEvent {
  source: ScrapedVenue;
  title: string;
  genreHint?:
    | "orchestral"
    | "opera"
    | "chamber"
    | "solo_recital"
    | "choral"
    | "ballet"
    | "jazz";
  /** True when the venue feed marks the performance as cancelled (still stored for ops). */
  cancelled?: boolean;
  dateText?: string;
  venueName?: string;
  location?: string;
  eventUrl: string;
  buyUrl: string;
  posterImageUrl?: string;
}

/** Mimic a browser so fewer venues return 403 / empty shells to server-side fetch. */
const BROWSER_FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: { ...BROWSER_FETCH_HEADERS, ...init?.headers },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

async function fetchHtml(url: string): Promise<string> {
  return fetchText(url);
}

function toAbsoluteUrl(href: string, base: string): string {
  return href.startsWith("http") ? href : `${base}${href}`;
}

function isBlockedHtml(html: string): boolean {
  return /incapsula|just a moment|attention required/i.test(html);
}

async function fetchPageImage(url: string): Promise<string | undefined> {
  try {
    const html = await fetchHtml(url);
    if (isBlockedHtml(html)) return undefined;
    const $ = load(html);
    const og = $('meta[property="og:image"]').attr("content")?.trim();
    if (og) return og.startsWith("http") ? og : undefined;
    const tw = $('meta[name="twitter:image"]').attr("content")?.trim();
    if (tw) return tw.startsWith("http") ? tw : undefined;
    return undefined;
  } catch {
    return undefined;
  }
}

function slugToTitle(slug: string): string {
  try {
    slug = decodeURIComponent(slug);
  } catch {
    /* ignore */
  }
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function inferMsmVenueName(input: {
  title: string;
  imageUrl?: string;
  fallback: string;
}): string {
  const hay = `${input.title} ${input.imageUrl ?? ""}`.toLowerCase();
  if (hay.includes("miller")) return "Miller Recital Hall";
  if (hay.includes("greenfield")) return "Greenfield Hall";
  if (hay.includes("neidorff") || hay.includes("karpati"))
    return "Neidorff-Karpati Hall";
  if (hay.includes("borden")) return "Borden Auditorium";
  if (hay.includes("myers")) return "Myers Recital Hall";
  return input.fallback;
}

function valueToText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function pickText(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const text = valueToText(obj[key])?.trim();
    if (text) return text;
  }
  return undefined;
}

/** Try to map Carnegie JSON if the site returns `application/json` (often blocked by Incapsula). */
function mapCarnegieApiPayload(data: unknown): ScrapedEvent[] {
  const rows = Array.isArray(data)
    ? data
    : data &&
        typeof data === "object" &&
        "events" in data &&
        Array.isArray((data as { events: unknown }).events)
      ? (data as { events: unknown[] }).events
      : null;
  if (!rows) return [];

  const events: ScrapedEvent[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = pickText(o, "title", "name", "eventTitle") ?? "";
    const rawUrl = pickText(o, "url", "link", "uri", "eventUrl", "href") ?? "";
    if (!title || !rawUrl) continue;
    const eventUrl = rawUrl.startsWith("http")
      ? rawUrl
      : toAbsoluteUrl(rawUrl, "https://www.carnegiehall.org");
    const dateText = pickText(o, "date", "startDate", "dateText") ?? "";
    const ticketUrl = pickText(o, "ticketUrl", "buyUrl");
    events.push({
      source: "carnegie_hall",
      title,
      dateText: dateText || undefined,
      eventUrl,
      buyUrl: ticketUrl ?? eventUrl,
    });
  }
  return events;
}

/** SPARQL JSON (`results.bindings`) row from data.carnegiehall.org. */
interface CarnegieSparqlBinding {
  event?: { value: string };
  label?: { value: string };
  startDate?: { value: string };
  venueName?: { value: string };
}

async function enrichEventsWithPageImages(
  events: ScrapedEvent[],
): Promise<ScrapedEvent[]> {
  const enriched: ScrapedEvent[] = [];
  for (const ev of events) {
    if (ev.posterImageUrl) {
      enriched.push(ev);
      continue;
    }
    const pageImage = await fetchPageImage(ev.eventUrl);
    enriched.push({
      ...ev,
      posterImageUrl: pageImage ?? ev.posterImageUrl,
    });
  }
  return enriched;
}

/** Comparable `YYYY-MM-DDTHH:mm:ss` string in America/New_York (LOD uses NY wall times). */
function carnegieNyWallComparable(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(" ", "T");
}

/**
 * Upcoming performances from Carnegie Hall's **linked open data** SPARQL API.
 * This works from servers and cron jobs.
 *
 * `https://www.carnegiehall.org/Events` is protected by DataDome + Incapsula — a
 * normal `fetch` only sees a challenge page (not your browser session), so HTML
 * scraping reliably returns 0 rows. The public LOD endpoint is the supported path.
 *
 * The LOD dump often **lags** the live site (max `schema:startDate` can be days
 * before “now”), so we query a recent window, sort newest-first, then prefer
 * events at/after NY-local “now”, falling back to the newest rows in the dump.
 *
 * @see https://data.carnegiehall.org/sparql/
 */
async function scrapeCarnegieHallFromLinkedData(): Promise<ScrapedEvent[]> {
  const wide = new Date();
  wide.setUTCDate(wide.getUTCDate() - 400);
  const y = wide.getUTCFullYear();
  const mo = String(wide.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wide.getUTCDate()).padStart(2, "0");
  const sparqlCutoff = `${y}-${mo}-${day}T00:00:00`;

  const query = `PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT ?event ?label ?startDate ?venueName WHERE {
  ?event a schema:Event .
  ?event schema:startDate ?startDate .
  ?event rdfs:label ?label .
  OPTIONAL {
    ?event schema:location ?loc .
    ?loc rdfs:label ?venueName .
  }
  FILTER (?startDate > "${sparqlCutoff}"^^xsd:dateTime)
}
ORDER BY DESC(?startDate)
LIMIT 500`;

  const res = await fetch("https://data.carnegiehall.org/sparql/", {
    method: "POST",
    headers: {
      ...BROWSER_FETCH_HEADERS,
      Accept: "application/sparql-results+json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) {
    throw new Error(`Carnegie SPARQL HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    results?: { bindings?: CarnegieSparqlBinding[] };
  };
  const bindings = data.results?.bindings ?? [];

  interface Row {
    eventUrl: string;
    title: string;
    startComparable: string;
    startRaw: string;
    hall?: string;
  }
  const rows: Row[] = [];
  const seen = new Set<string>();

  for (const row of bindings) {
    const eventUri = row.event?.value;
    const title = row.label?.value.trim();
    const start = row.startDate?.value;
    if (!eventUri || !title || !start) continue;

    const idMatch = /\/events\/(\d+)/.exec(eventUri);
    if (!idMatch?.[1]) continue;
    const eventUrl = `https://data.carnegiehall.org/events/${idMatch[1]}/about`;
    if (seen.has(eventUrl)) continue;
    seen.add(eventUrl);

    const startComparable = start.slice(0, 19);
    rows.push({
      eventUrl,
      title,
      startComparable,
      startRaw: start,
      hall: row.venueName?.value.trim(),
    });
  }

  const nowDay = new Date();
  nowDay.setHours(0, 0, 0, 0);
  const nowNy = carnegieNyWallComparable(nowDay);
  const chosen = rows.filter((r) => r.startComparable >= nowNy);
  if (chosen.length === 0) return [];

  chosen.sort((a, b) => b.startComparable.localeCompare(a.startComparable));

  const events: ScrapedEvent[] = [];
  for (const r of chosen.slice(0, 250)) {
    const startDate = new Date(r.startRaw);
    const dateText = Number.isNaN(startDate.getTime())
      ? r.startRaw
      : startDate.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/New_York",
        });

    events.push({
      source: "carnegie_hall",
      title: r.title,
      dateText,
      venueName: r.hall ?? "Carnegie Hall",
      location: "New York, NY",
      eventUrl: r.eventUrl,
      buyUrl: r.eventUrl,
    });
  }

  return events;
}

export async function scrapeCarnegieHall(): Promise<ScrapedEvent[]> {
  try {
    const fromLod = await scrapeCarnegieHallFromLinkedData();
    return fromLod;
  } catch {
    /* fall through to legacy */
  }

  const base = "https://www.carnegiehall.org";

  try {
    const jsonAttempt = await fetch(`${base}/api/events/upcoming`, {
      headers: {
        ...BROWSER_FETCH_HEADERS,
        Accept: "application/json, text/plain, */*",
      },
    });
    if (jsonAttempt.ok) {
      const ct = jsonAttempt.headers.get("content-type") ?? "";
      if (ct.includes("json")) {
        try {
          const data: unknown = await jsonAttempt.json();
          const mapped = mapCarnegieApiPayload(data);
          if (mapped.length > 0) return mapped;
        } catch {
          /* fall through */
        }
      }
    }
  } catch {
    /* fall through */
  }

  let html = "";
  try {
    html = await fetchHtml(`${base}/Events`);
  } catch {
    return [];
  }
  if (isBlockedHtml(html)) return [];
  const $ = load(html);
  const events: ScrapedEvent[] = [];

  for (const el of $(".event-card, .event").toArray()) {
    const root = $(el);
    const title =
      root.find("a, h3, h2").first().text().trim() ||
      root.find("[data-event-title]").first().text().trim();
    if (!title) continue;

    const dateText =
      root.find(".date, time").first().text().trim() ||
      root.find("[data-event-date]").first().text().trim();

    const venueName =
      root.find(".venue, .location").first().text().trim() || undefined;

    const linkHref =
      root.find('a[href*="tickets"], a[href*="event"]').first().attr("href") ??
      "";
    if (!linkHref) continue;
    const eventUrl = toAbsoluteUrl(linkHref, base);

    events.push({
      source: "carnegie_hall",
      title,
      dateText,
      venueName,
      eventUrl,
      buyUrl: eventUrl,
    });
  }

  return events;
}

function normalizeMetOperaSeasonPath(href: string): string | null {
  const raw = href.trim().split("?")[0]?.split("#")[0] ?? "";
  if (!raw.includes("/season/")) return null;
  const path = raw.startsWith("http")
    ? (() => {
        try {
          return new URL(raw).pathname;
        } catch {
          return null;
        }
      })()
    : raw;
  if (!path) return null;
  const parts = path.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "season") return null;
  return path.endsWith("/") ? path : `${path}/`;
}

function normalizeMetDateText(raw: string): string | undefined {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  // "Apr 24 at 7:30 PM" -> "Apr 24, 7:30 PM" (better Date parsing)
  const replaced = cleaned.replace(/\s+at\s+/i, ", ");
  // "1 PM" -> "1:00 PM" for consistent parsing.
  return replaced.replace(/\b(\d{1,2})\s*(AM|PM)\b/i, "$1:00 $2");
}

function inferMetSeasonYears(productionUrl: string): {
  startYear: number;
  endYear: number;
} | null {
  const m = /\/season\/(\d{4})-(\d{2})-season\//.exec(productionUrl);
  if (!m) return null;
  const startYear = Number(m[1]);
  const endYear = Number(`${String(startYear).slice(0, 2)}${m[2]}`);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null;
  return { startYear, endYear };
}

function withMetSeasonYear(input: {
  monthDayTime: string;
  productionUrl: string;
}): string {
  const seasonYears = inferMetSeasonYears(input.productionUrl);
  if (!seasonYears) {
    return input.monthDayTime;
  }

  const monthMatch = /\b([A-Za-z]{3,9})\b/.exec(input.monthDayTime);
  const monthName = monthMatch?.[1]?.toLowerCase();
  const monthIndex = monthName
    ? [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ].findIndex((m) => m.startsWith(monthName))
    : -1;

  // Met seasons cross years (fall -> spring): Jul-Dec => startYear, Jan-Jun => endYear.
  const year = monthIndex >= 6 ? seasonYears.startYear : seasonYears.endYear;
  const m = /^([A-Za-z]{3,9}\s+\d{1,2}),\s*(.+)$/.exec(input.monthDayTime);
  if (!m) {
    return `${input.monthDayTime}, ${year}`;
  }
  const monthDay = m[1];
  const timePart = m[2];
  return `${monthDay}, ${year}, ${timePart}`;
}

async function scrapeMetProductionPerformances(input: {
  productionUrl: string;
  title: string;
}): Promise<ScrapedEvent[]> {
  const html = await fetchHtml(input.productionUrl);
  if (isBlockedHtml(html)) return [];
  const $ = load(html);

  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const twitterImage = $('meta[name="twitter:image"]').attr("content")?.trim();
  const heroImage =
    $(".hero-image img").first().attr("src")?.trim() ??
    $(".hero-image source").first().attr("srcset")?.split(",")[0]?.trim() ??
    $(".hero-image").first().attr("data-src")?.trim() ??
    undefined;
  const embeddedGlobalAsset = (() => {
    const m = /\/globalassets\/[^"'()\s>]+\.(?:png|jpe?g|webp)/i.exec(html);
    return m?.[0];
  })();

  const coverImageCandidate =
    (ogImage && ogImage.length > 0 ? ogImage : undefined) ??
    (twitterImage && twitterImage.length > 0 ? twitterImage : undefined) ??
    heroImage ??
    embeddedGlobalAsset;
  const coverImageUrl = coverImageCandidate
    ? toAbsoluteUrl(coverImageCandidate, "https://www.metopera.org")
    : undefined;

  const rows: ScrapedEvent[] = [];
  for (const item of $(".upcomingperfs-item").toArray()) {
    const root = $(item);
    const atLine = root.find(".upcomingperfs-item-title").first().text().trim();
    const perfId =
      root
        .find(".upcomingperf-link-js")
        .first()
        .attr("data-performance-id")
        ?.trim() ?? "";

    const normalized = normalizeMetDateText(atLine);
    if (!normalized) continue;
    const dateText = withMetSeasonYear({
      monthDayTime: normalized,
      productionUrl: input.productionUrl,
    });
    const eventUrl = perfId
      ? `${input.productionUrl}?perf=${encodeURIComponent(perfId)}`
      : input.productionUrl;

    rows.push({
      source: "met_opera",
      title: input.title,
      dateText,
      venueName: "Metropolitan Opera",
      location: "New York, NY",
      eventUrl,
      buyUrl: input.productionUrl,
      posterImageUrl: coverImageUrl,
    });
  }

  rows.sort((a, b) => {
    const ta = a.dateText ? Date.parse(a.dateText) : Number.MAX_SAFE_INTEGER;
    const tb = b.dateText ? Date.parse(b.dateText) : Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });

  return rows;
}

export async function scrapeMetOpera(): Promise<ScrapedEvent[]> {
  const base = "https://www.metopera.org";
  const html = await fetchHtml(`${base}/calendar/`);
  const $ = load(html);

  const byUrl = new Map<string, string>();

  function addFromPath(path: string, titleHint?: string) {
    const normalized = normalizeMetOperaSeasonPath(path);
    if (!normalized) return;
    const eventUrl = toAbsoluteUrl(normalized, base);
    const slug = normalized.replace(/\/$/, "").split("/").pop() ?? "";
    const fromSlug = slug ? slugToTitle(slug) : "";
    const normalizedHint = titleHint?.replace(/\s+/g, " ").trim();
    let title =
      normalizedHint && normalizedHint.length > 0 ? normalizedHint : fromSlug;
    if (!title) return;
    if (/^(buy tickets|more|read more)$/i.test(title)) title = fromSlug;
    if (!byUrl.has(eventUrl)) byUrl.set(eventUrl, title);
  }

  for (const el of $('a[href*="/season/"]').toArray()) {
    const href = $(el).attr("href")?.trim() ?? "";
    const text = $(el).text().replace(/\s+/g, " ").trim();
    addFromPath(href, text || undefined);
  }

  const embeddedPath = /\/season\/\d{4}-\d{2}-[^/]+\/[^"'\\s<>?]+/g;
  let m: RegExpExecArray | null;
  while ((m = embeddedPath.exec(html))) {
    addFromPath(m[0]);
  }

  const productions = [...byUrl.entries()].map(([eventUrl, title]) => ({
    eventUrl,
    title,
  }));

  const events: ScrapedEvent[] = [];
  for (const prod of productions) {
    try {
      const perfRows = await scrapeMetProductionPerformances({
        productionUrl: prod.eventUrl,
        title: prod.title,
      });
      if (perfRows.length > 0) {
        events.push(...perfRows);
      }
    } catch {
      /* skip production if we cannot extract dated performance rows */
    }
  }

  return events;
}

interface JuilliardApiEvent {
  id: number;
  title: string;
  date_start_time: string;
  purchase_url?: string;
  video_url?: string;
  image?: { url?: string | null };
  venues?: { name?: string; address?: string };
}

/** Juilliard marks cancellations by prefixing the title (API has no separate flag). */
function isJuilliardCanceledTitle(title: string): boolean {
  return /^\s*(canceled|cancelled)\s*:/i.test(title.trim());
}

export async function scrapeJuilliard(): Promise<ScrapedEvent[]> {
  const res = await fetch("https://calendar.juilliard.edu/api/events/", {
    headers: {
      ...BROWSER_FETCH_HEADERS,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Juilliard calendar API: ${res.status}`);
  }

  const data = (await res.json()) as JuilliardApiEvent[];
  if (!Array.isArray(data)) return [];

  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  const events: ScrapedEvent[] = [];

  for (const e of data) {
    const title = e.title.replace(/\s+/g, " ").trim();
    const cancelled = isJuilliardCanceledTitle(title);

    const start = new Date(e.date_start_time);
    if (Number.isNaN(start.getTime()) || start < startOfYesterday) continue;

    const purchase = e.purchase_url?.trim() ?? "";
    const video = e.video_url?.trim() ?? "";
    const eventUrl =
      purchase || video || `https://calendar.juilliard.edu/#/events/${e.id}`;
    const buyUrl = purchase || video || eventUrl;

    const venueName = e.venues?.name?.trim() ?? "The Juilliard School";
    const location = e.venues?.address?.trim() ?? "New York, NY";
    const posterImageUrl = e.image?.url?.trim()
      ? e.image.url.trim()
      : undefined;

    events.push({
      source: "juilliard",
      title,
      cancelled,
      dateText: e.date_start_time,
      venueName,
      location,
      eventUrl,
      buyUrl,
      posterImageUrl,
    });
  }

  return events;
}

export async function scrapeMSM(): Promise<ScrapedEvent[]> {
  const base = "https://www.msmnyc.edu";
  const byKey = new Map<string, ScrapedEvent>();

  function addEvent(ev: ScrapedEvent) {
    const normalizedDate = (ev.dateText ?? "").toLowerCase().trim();
    const key = `${ev.eventUrl}|${normalizedDate || ev.title.toLowerCase()}`;
    if (!byKey.has(key)) byKey.set(key, ev);
  }

  const perfHtml = await fetchHtml(`${base}/performances/`);
  if (!isBlockedHtml(perfHtml)) {
    const $ = load(perfHtml);
    for (const el of $("#performances-list .newsBlock").toArray()) {
      const root = $(el);
      const link = root.find(".newsBlock_info h2 a").first();
      const linkHref = link.attr("href")?.trim() ?? "";
      if (!linkHref.includes("/performances/")) continue;

      const eventUrl = toAbsoluteUrl(linkHref, base);
      if (
        eventUrl === `${base}/performances/` ||
        eventUrl === `${base}/performances`
      )
        continue;

      const title = link.text().replace(/\s+/g, " ").trim();
      if (!title || title.length < 4) continue;

      const dateText =
        root.find(".newsBlock_info time").first().text().trim() || undefined;
      const imgHref = root.find(".newsBlock_image img").first().attr("src");
      const posterImageUrl = imgHref ? toAbsoluteUrl(imgHref, base) : undefined;
      const venueName = inferMsmVenueName({
        title,
        imageUrl: posterImageUrl,
        fallback: "Manhattan School of Music",
      });

      addEvent({
        source: "msm",
        title,
        dateText,
        venueName,
        location: "New York, NY",
        eventUrl,
        buyUrl: eventUrl,
        posterImageUrl,
      });
    }
  }

  // Livestream listings include many student recitals absent from /performances.
  const livestreamUrls = [
    `${base}/livestreams/`,
    `${base}/livestreams/page/2/`,
    `${base}/livestreams/page/3/`,
  ];
  for (const url of livestreamUrls) {
    try {
      const html = await fetchHtml(url);
      if (isBlockedHtml(html)) continue;
      const $ = load(html);
      for (const el of $(".newsBlock").toArray()) {
        const root = $(el);
        const link = root.find(".newsBlock_info h2 a").first();
        const linkHref = link.attr("href")?.trim() ?? "";
        if (!linkHref.includes("/livestream/")) continue;

        const eventUrl = toAbsoluteUrl(linkHref, base);
        const title = link.text().replace(/\s+/g, " ").trim();
        if (!title || title.length < 4) continue;

        const category = root.find(".newsBlock_info h3").first().text().trim();
        const date = root.find(".newsBlock_info date").first().text().trim();
        const time = root.find(".newsBlock_info time").first().text().trim();
        const dateText =
          [date, time]
            .filter(Boolean)
            .join(", ")
            .replace(/\s+/g, " ")
            .replace(/\bEST\b/i, "")
            .trim() || undefined;
        const imgHref = root.find(".newsBlock_image img").first().attr("src");
        const posterImageUrl = imgHref
          ? toAbsoluteUrl(imgHref, base)
          : undefined;
        const isStudentRecital = /student recital/i.test(category);
        const venueName = inferMsmVenueName({
          title,
          imageUrl: posterImageUrl,
          fallback: "Manhattan School of Music",
        });

        addEvent({
          source: "msm",
          title,
          genreHint: isStudentRecital ? "solo_recital" : undefined,
          dateText,
          venueName,
          location: "New York, NY",
          eventUrl,
          buyUrl: eventUrl,
          posterImageUrl,
        });
      }
    } catch {
      /* ignore failed page and continue */
    }
  }

  return [...byKey.values()];
}

/**
 * NY Phil dropped JSON-LD from SSR; `/concerts-tickets/` is mostly a client app shell.
 * Production pages `/concerts-tickets/{seasonYYZZ}/{slug}/` are linked from explore hubs
 * and expose `og:title`, `og:description` (with real dates), and `og:image` server-side.
 */
const NY_PHIL_EXPLORE_SEED_PATHS = [
  "/concerts-tickets/explore/",
  "/concerts-tickets/explore/dudamel-inaugural-season/",
  "/concerts-tickets/explore/one-night/",
  "/concerts-tickets/explore/virtuoso-violinists/",
  "/concerts-tickets/explore/films",
  "/concerts-tickets/explore/star-pianists/",
  "/concerts-tickets/explore/symphonies/",
  "/concerts-tickets/explore/beethoven-in-new-york/",
  "/concerts-tickets/explore/variations-on-america/",
  "/concerts-tickets/explore/us-at-250/",
  "/concerts-tickets/explore/holidays/",
  "/concerts-tickets/explore/merkin/",
  "/concerts-tickets/explore/artist-spotlight/",
  "/concerts-tickets/explore/artists-in-residence-2026/",
  "/concerts-tickets/explore/parks/",
  "/concerts-tickets/explore/vail/",
  "/concerts-tickets/explore/sound-on/",
  "/concerts-tickets/explore/nightcap/",
  "/concerts-tickets/explore/project-19/",
] as const;

const NY_PHIL_PRODUCTION_HREF = /\/concerts-tickets\/\d{4}\/[a-z0-9-]+\/?/gi;

function discoverNyPhilProductionUrls(html: string, base: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(NY_PHIL_PRODUCTION_HREF)) {
    let path = m[0];
    if (!path.startsWith("/")) continue;
    if (!path.endsWith("/")) path = `${path}/`;
    out.add(toAbsoluteUrl(path, base));
  }
  return [...out];
}

/** Pull a machine-parseable first date from NY Phil marketing copy (og:description). */
function nyPhilDateHintFromDescription(desc: string): string | undefined {
  const d = desc.replace(/\s+/g, " ").trim();
  if (!d) return undefined;

  const rangeMonth = /([A-Z][a-z]+ \d{1,2})[–-](\d{1,2}), (\d{4})/.exec(d);
  if (rangeMonth) {
    return `${rangeMonth[1]}, ${rangeMonth[3]}`;
  }
  const monthDayYear = /([A-Z][a-z]+ \d{1,2}, \d{4})/.exec(d);
  if (monthDayYear) return monthDayYear[1];
  const iso = /\b(\d{4}-\d{2}-\d{2})\b/.exec(d);
  if (iso) return iso[1];
  return undefined;
}

function nyPhilSortTime(ev: ScrapedEvent): number {
  if (!ev.dateText?.trim()) return Number.MAX_SAFE_INTEGER;
  const hint = nyPhilDateHintFromDescription(ev.dateText) ?? ev.dateText;
  const t = new Date(hint).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

async function scrapeNyPhilProductionPage(
  eventUrl: string,
): Promise<ScrapedEvent | null> {
  try {
    const html = await fetchHtml(eventUrl);
    if (isBlockedHtml(html)) return null;
    const $ = load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
    const description = $('meta[property="og:description"]')
      .attr("content")
      ?.trim();
    const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
    const ogUrl = $('meta[property="og:url"]').attr("content")?.trim();

    if (!ogTitle) return null;
    const title = ogTitle.replace(/\s*[-–]\s*NY Phil\s*$/i, "").trim();
    if (!title || title.length < 4) return null;

    const dateHint = description
      ? nyPhilDateHintFromDescription(description)
      : undefined;
    const dateText =
      dateHint ??
      (description && description.length > 0
        ? description.slice(0, 240)
        : undefined);

    const canonical = (ogUrl ?? eventUrl).split("?")[0] ?? eventUrl;
    const posterImageUrl = ogImage?.startsWith("http") ? ogImage : undefined;

    return {
      source: "ny_phil",
      title,
      dateText,
      venueName: "New York Philharmonic",
      location: "New York, NY",
      eventUrl: canonical,
      buyUrl: canonical,
      posterImageUrl,
      genreHint: "orchestral",
    };
  } catch {
    return null;
  }
}

export async function scrapeNyPhil(): Promise<ScrapedEvent[]> {
  const base = "https://www.nyphil.org";
  const found = new Set<string>();

  for (const path of NY_PHIL_EXPLORE_SEED_PATHS) {
    try {
      const html = await fetchHtml(`${base}${path}`);
      if (isBlockedHtml(html)) continue;
      for (const url of discoverNyPhilProductionUrls(html, base))
        found.add(url);
    } catch {
      /* ignore failed seed */
    }
  }

  const urls = [...found].slice(0, 120);
  const scraped: ScrapedEvent[] = [];
  const batchSize = 6;
  for (let i = 0; i < urls.length; i += batchSize) {
    const chunk = urls.slice(i, i + batchSize);
    const batch = await Promise.all(
      chunk.map((u) => scrapeNyPhilProductionPage(u)),
    );
    for (const ev of batch) {
      if (ev) scraped.push(ev);
    }
  }

  const byUrl = new Map<string, ScrapedEvent>();
  for (const ev of scraped) {
    byUrl.set(ev.eventUrl, ev);
  }
  const unique = [...byUrl.values()].sort(
    (a, b) =>
      nyPhilSortTime(a) - nyPhilSortTime(b) || a.title.localeCompare(b.title),
  );

  return enrichEventsWithPageImages(unique);
}

export async function scrapeNycBallet(): Promise<ScrapedEvent[]> {
  const base = "https://www.nycballet.com";
  const res = await fetch(`${base}/season-and-tickets/events/16`, {
    headers: {
      ...BROWSER_FETCH_HEADERS,
      Accept: "application/json",
      Referer: `${base}/season-and-tickets/calendar`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch NYCB calendar API: ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];

  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  const events: ScrapedEvent[] = [];

  for (const row of data) {
    if (!row || typeof row !== "object") continue;

    const record = row as Record<string, unknown>;

    // Only include actual performances — skip family events, workshops,
    // talks/demos, digital events, and any other non-performance listings.
    const keywords = Array.isArray(record.keywords) ? record.keywords : [];
    const isPerformance = keywords.some(
      (k) =>
        k !== null &&
        typeof k === "object" &&
        pickText(k as Record<string, unknown>, "keyword") === "Performances",
    );
    if (!isPerformance) continue;

    const title = pickText(record, "title")?.replace(/\s+/g, " ").trim();
    const perfDate = pickText(record, "perf_date");
    const perfNo = pickText(record, "perf_no");
    const rawEventLink = pickText(record, "event_link");
    if (!title || !perfDate || !perfNo || !rawEventLink) continue;

    const start = new Date(perfDate);
    if (Number.isNaN(start.getTime()) || start < startOfYesterday) continue;

    const eventPage = rawEventLink.startsWith("http")
      ? rawEventLink
      : toAbsoluteUrl(rawEventLink, base);
    const bookingLink = pickText(record, "booking_link");
    const eventUrl = `${eventPage}#performance-${perfNo}`;
    const image =
      pickText(record, "listing_image") ??
      pickText(record, "related_listing_image");
    const prefix = pickText(record, "prefix");

    events.push({
      source: "nycballet",
      title: prefix ? `${prefix}: ${title}` : title,
      dateText: perfDate,
      venueName: "New York City Ballet",
      location: "David H. Koch Theater, New York, NY",
      eventUrl,
      buyUrl: bookingLink ?? eventPage,
      posterImageUrl: image,
      genreHint: "ballet",
    });
  }

  return events.sort((a, b) => {
    const ta = a.dateText ? new Date(a.dateText).getTime() : 0;
    const tb = b.dateText ? new Date(b.dateText).getTime() : 0;
    return ta - tb;
  });
}

export async function scrapeAllVenues(): Promise<ScrapedEvent[]> {
  const [carnegie, met, juilliard, msm, nyPhil, nycBallet] =
    await Promise.allSettled([
      scrapeCarnegieHall(),
      scrapeMetOpera(),
      scrapeJuilliard(),
      scrapeMSM(),
      scrapeNyPhil(),
      scrapeNycBallet(),
    ]);

  const collect = (r: PromiseSettledResult<ScrapedEvent[]>) =>
    r.status === "fulfilled" ? r.value : [];

  return [
    ...collect(carnegie),
    ...collect(met),
    ...collect(juilliard),
    ...collect(msm),
    ...collect(nyPhil),
    ...collect(nycBallet),
  ];
}
