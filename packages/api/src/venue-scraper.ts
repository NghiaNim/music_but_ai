import { load } from "cheerio";

export type ScrapedVenue =
  | "carnegie_hall"
  | "met_opera"
  | "juilliard"
  | "msm";

export interface ScrapedEvent {
  source: ScrapedVenue;
  title: string;
  dateText?: string;
  venueName?: string;
  location?: string;
  buyUrl: string;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

function toAbsoluteUrl(href: string, base: string): string {
  return href.startsWith("http") ? href : `${base}${href}`;
}

export async function scrapeCarnegieHall(): Promise<ScrapedEvent[]> {
  const base = "https://www.carnegiehall.org";
  const html = await fetchHtml(`${base}/Events`);
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

    const buyHref =
      root.find('a[href*="tickets"], a[href*="event"]').first().attr("href") ??
      "";
    if (!buyHref) continue;

    events.push({
      source: "carnegie_hall",
      title,
      dateText,
      venueName,
      buyUrl: toAbsoluteUrl(buyHref, base),
    });
  }

  return events;
}

export async function scrapeMetOpera(): Promise<ScrapedEvent[]> {
  const base = "https://www.metopera.org";
  const html = await fetchHtml(`${base}/calendar/`);
  const $ = load(html);
  const events: ScrapedEvent[] = [];

  for (const el of $(".calendar-event, .event, a[href*='/season/']").toArray()) {
    const root = $(el);
    const title =
      root.find(".event-title, h3, h2").first().text().trim() ||
      root.attr("aria-label")?.trim() ||
      "";
    if (!title) continue;

    const dateText =
      root.find("time").first().text().trim() ||
      root.find(".date").first().text().trim();

    const buyHref =
      root.find('a[href*="tickets"], a[href*="/season/"]').first().attr("href") ??
      root.attr("href") ??
      "";
    if (!buyHref) continue;

    events.push({
      source: "met_opera",
      title,
      dateText,
      venueName: "Metropolitan Opera",
      location: "New York, NY",
      buyUrl: toAbsoluteUrl(buyHref, base),
    });
  }

  return events;
}

export async function scrapeJuilliard(): Promise<ScrapedEvent[]> {
  const base = "https://www.juilliard.edu";
  const html = await fetchHtml(`${base}/stage-beyond/performance/calendar`);
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

    const buyHref =
      root.find('a[href*="tickets"], a[href*="/event/"]').first().attr("href") ??
      "";
    if (!buyHref) continue;

    events.push({
      source: "juilliard",
      title,
      dateText,
      venueName: "The Juilliard School",
      location: "New York, NY",
      buyUrl: toAbsoluteUrl(buyHref, base),
    });
  }

  return events;
}

export async function scrapeMSM(): Promise<ScrapedEvent[]> {
  const base = "https://www.msmnyc.edu";
  const html = await fetchHtml(`${base}/performances`);
  const $ = load(html);
  const events: ScrapedEvent[] = [];

  for (const el of $(".event, .performance, li, article").toArray()) {
    const root = $(el);
    const title =
      root.find("a, h3, h2").first().text().trim() ||
      root.find(".event-title").first().text().trim();
    if (!title) continue;

    const dateText =
      root.find("time").first().text().trim() ||
      root.find(".date").first().text().trim();

    const buyHref =
      root.find('a[href*="tickets"], a[href*="/performances/"]').first().attr(
        "href",
      ) ?? "";
    if (!buyHref) continue;

    events.push({
      source: "msm",
      title,
      dateText,
      venueName: "Manhattan School of Music",
      location: "New York, NY",
      buyUrl: toAbsoluteUrl(buyHref, base),
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

