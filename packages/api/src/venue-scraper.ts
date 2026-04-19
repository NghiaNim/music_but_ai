import { load } from "cheerio";

export type ScrapedVenue = "carnegie_hall" | "met_opera" | "juilliard" | "msm";

export interface ScrapedEvent {
  source: ScrapedVenue;
  title: string;
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
  return /incapsula|just a moment|cloudflare|noindex, nofollow/i.test(html);
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
    const title = String(o.title ?? o.name ?? o.eventTitle ?? "").trim();
    const rawUrl = String(
      o.url ?? o.link ?? o.uri ?? o.eventUrl ?? o.href ?? "",
    ).trim();
    if (!title || !rawUrl) continue;
    const eventUrl = rawUrl.startsWith("http")
      ? rawUrl
      : toAbsoluteUrl(rawUrl, "https://www.carnegiehall.org");
    const dateText = String(o.date ?? o.startDate ?? o.dateText ?? "").trim();
    events.push({
      source: "carnegie_hall",
      title,
      dateText: dateText || undefined,
      eventUrl,
      buyUrl: String(o.ticketUrl ?? o.buyUrl ?? eventUrl).trim() || eventUrl,
    });
  }
  return events;
}

export async function scrapeCarnegieHall(): Promise<ScrapedEvent[]> {
  const base = "https://www.carnegiehall.org";

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

  const html = await fetchHtml(`${base}/Events`);
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

export async function scrapeMetOpera(): Promise<ScrapedEvent[]> {
  const base = "https://www.metopera.org";
  const html = await fetchHtml(`${base}/calendar/`);
  const $ = load(html);

  const byUrl = new Map<string, string>();

  function addFromPath(path: string, titleHint?: string) {
    const normalized = normalizeMetOperaSeasonPath(path);
    if (!normalized) return;
    const eventUrl = toAbsoluteUrl(normalized, base);
    const slug =
      normalized.replace(/\/$/, "").split("/").pop() ?? "";
    const fromSlug = slug ? slugToTitle(slug) : "";
    let title =
      titleHint?.replace(/\s+/g, " ").trim() ||
      fromSlug;
    if (!title) return;
    if (/^(buy tickets|more|read more)$/i.test(title)) title = fromSlug;
    if (!byUrl.has(eventUrl)) byUrl.set(eventUrl, title);
  }

  for (const el of $('a[href*="/season/"]').toArray()) {
    const href = $(el).attr("href")?.trim() ?? "";
    const text = $(el).text().replace(/\s+/g, " ").trim();
    addFromPath(href, text || undefined);
  }

  const embeddedPath =
    /\/season\/\d{4}-\d{2}-[^/]+\/[^"'\\s<>?]+/g;
  let m: RegExpExecArray | null;
  while ((m = embeddedPath.exec(html))) {
    addFromPath(m[0]);
  }

  return [...byUrl.entries()].map(([eventUrl, title]) => ({
    source: "met_opera" as const,
    title,
    venueName: "Metropolitan Opera",
    location: "New York, NY",
    eventUrl,
    buyUrl: eventUrl,
  }));
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

export async function scrapeJuilliard(): Promise<ScrapedEvent[]> {
  const res = await fetch("https://calendar.juilliard.edu/api/events", {
    headers: {
      ...BROWSER_FETCH_HEADERS,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch Juilliard calendar API: ${res.status}`,
    );
  }

  const data = (await res.json()) as JuilliardApiEvent[];
  if (!Array.isArray(data)) return [];

  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  const events: ScrapedEvent[] = [];

  for (const e of data) {
    const start = new Date(e.date_start_time);
    if (Number.isNaN(start.getTime()) || start < startOfYesterday) continue;

    const purchase = e.purchase_url?.trim() ?? "";
    const video = e.video_url?.trim() ?? "";
    const eventUrl = purchase || video || `https://calendar.juilliard.edu/#/events/${e.id}`;
    const buyUrl = purchase || video || eventUrl;

    const venueName = e.venues?.name?.trim() || "The Juilliard School";
    const location =
      e.venues?.address?.trim() || "New York, NY";
    const posterImageUrl = e.image?.url?.trim()
      ? e.image.url.trim()
      : undefined;

    events.push({
      source: "juilliard",
      title: e.title.replace(/\s+/g, " ").trim(),
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
  const html = await fetchHtml(`${base}/performances/`);
  if (isBlockedHtml(html)) return [];
  const $ = load(html);
  const events: ScrapedEvent[] = [];
  const seen = new Set<string>();

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

    if (seen.has(eventUrl)) continue;
    seen.add(eventUrl);

    const imgHref = root.find(".newsBlock_image img").first().attr("src");
    const posterImageUrl = imgHref
      ? toAbsoluteUrl(imgHref, base)
      : undefined;

    events.push({
      source: "msm",
      title,
      dateText,
      venueName: "Manhattan School of Music",
      location: "New York, NY",
      eventUrl,
      buyUrl: eventUrl,
      posterImageUrl,
    });
  }

  return events;
}

export async function scrapeAllVenues(): Promise<ScrapedEvent[]> {
  const [carnegie, met, juilliard, msm] = await Promise.allSettled([
    scrapeCarnegieHall(),
    scrapeMetOpera(),
    scrapeJuilliard(),
    scrapeMSM(),
  ]);

  const collect = (r: PromiseSettledResult<ScrapedEvent[]>) =>
    r.status === "fulfilled" ? r.value : [];

  return [
    ...collect(carnegie),
    ...collect(met),
    ...collect(juilliard),
    ...collect(msm),
  ];
}
