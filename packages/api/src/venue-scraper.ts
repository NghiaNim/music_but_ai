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

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

function toAbsoluteUrl(href: string, base: string): string {
  return href.startsWith("http") ? href : `${base}${href}`;
}

function isBlockedHtml(html: string): boolean {
  return /incapsula|just a moment|cloudflare|noindex, nofollow/i.test(html);
}

export async function scrapeCarnegieHall(): Promise<ScrapedEvent[]> {
  const base = "https://www.carnegiehall.org";
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

export async function scrapeMetOpera(): Promise<ScrapedEvent[]> {
  const base = "https://www.metopera.org";
  const html = await fetchHtml(`${base}/calendar/`);
  const $ = load(html);
  const events: ScrapedEvent[] = [];

  for (const el of $(
    ".calendar-event, .event, a[href*='/season/']",
  ).toArray()) {
    const root = $(el);
    const title =
      root.find(".event-title, h3, h2").first().text().trim() ||
      root.attr("aria-label")?.trim() ||
      "";
    if (!title) continue;

    const dateText =
      root.find("time").first().text().trim() ||
      root.find(".date").first().text().trim();

    const linkHref =
      root
        .find('a[href*="tickets"], a[href*="/season/"]')
        .first()
        .attr("href") ??
      root.attr("href") ??
      "";
    if (!linkHref) continue;
    const eventUrl = toAbsoluteUrl(linkHref, base);
    if (!eventUrl.includes("/season/")) continue;

    events.push({
      source: "met_opera",
      title,
      dateText,
      venueName: "Metropolitan Opera",
      location: "New York, NY",
      eventUrl,
      buyUrl: eventUrl,
    });
  }

  return events;
}

export async function scrapeJuilliard(): Promise<ScrapedEvent[]> {
  const base = "https://www.juilliard.edu";
  const html = await fetchHtml(`${base}/stage-beyond/performance/calendar`);
  if (isBlockedHtml(html)) return [];
  const $ = load(html);
  const events: ScrapedEvent[] = [];

  for (const el of $(".event, article, .views-row").toArray()) {
    const root = $(el);
    const title =
      root.find("a, h3, h2").first().text().trim() ||
      root.find(".event-title").first().text().trim();
    if (!title) continue;

    const dateText =
      root.find("time").first().text().trim() ||
      root.find(".date").first().text().trim();

    const linkHref =
      root
        .find('a[href*="tickets"], a[href*="/event/"]')
        .first()
        .attr("href") ?? "";
    if (!linkHref) continue;
    const eventUrl = toAbsoluteUrl(linkHref, base);

    events.push({
      source: "juilliard",
      title,
      dateText,
      venueName: "The Juilliard School",
      location: "New York, NY",
      eventUrl,
      buyUrl: eventUrl,
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
