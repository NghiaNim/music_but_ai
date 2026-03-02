import cheerio from "cheerio";

async function fetchHtml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

async function scrapeCarnegieHall() {
  const url = "https://www.carnegiehall.org/Events";
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const events = [];

  $(".event-card, .event, article").each((_, el) => {
    const root = $(el);
    const title =
      root.find("a, h3, h2").first().text().trim() ||
      root.attr("aria-label")?.trim() ||
      "";
    if (!title) return;

    const dateText =
      root.find("time").first().text().trim() ||
      root.find(".date").first().text().trim();

    const buyHref =
      root.find('a[href*="tickets"], a[href*="/event/"]').first().attr("href") ??
      "";
    if (!buyHref) return;

    const buyUrl = buyHref.startsWith("http")
      ? buyHref
      : `https://www.carnegiehall.org${buyHref}`;

    events.push({ title, dateText, buyUrl });
  });

  return events;
}

async function scrapeMetOpera() {
  const url = "https://www.metopera.org/calendar/";
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const events = [];

  $(".calendar-event, .event, a[href*='/season/']").each((_, el) => {
    const root = $(el);
    const title =
      root.find(".event-title, h3, h2").first().text().trim() ||
      root.attr("aria-label")?.trim() ||
      "";
    if (!title) return;

    const dateText =
      root.find("time").first().text().trim() ||
      root.find(".date").first().text().trim();

    const buyHref =
      root.find('a[href*="tickets"], a[href*="/season/"]').first().attr("href") ??
      root.attr("href") ??
      "";
    if (!buyHref) return;

    const buyUrl = buyHref.startsWith("http")
      ? buyHref
      : `https://www.metopera.org${buyHref}`;

    events.push({ title, dateText, buyUrl });
  });

  return events;
}

async function scrapeJuilliard() {
  const url = "https://www.juilliard.edu/stage-beyond/performance/calendar";
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const events = [];

  $(".event, article, .views-row").each((_, el) => {
    const root = $(el);
    const title =
      root.find("a, h3, h2").first().text().trim() ||
      root.find(".event-title").first().text().trim();
    if (!title) return;

    const dateText =
      root.find("time").first().text().trim() ||
      root.find(".date").first().text().trim();

    const buyHref =
      root.find('a[href*="tickets"], a[href*="/event/"]').first().attr("href") ??
      "";
    if (!buyHref) return;

    const buyUrl = buyHref.startsWith("http")
      ? buyHref
      : `https://www.juilliard.edu${buyHref}`;

    events.push({ title, dateText, buyUrl });
  });

  return events;
}

async function scrapeMSM() {
  const url = "https://www.msmnyc.edu/performances";
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const events = [];

  $("h3, h2").each((_, el) => {
    const title = $(el).text().trim();
    if (!title) return;

    const container = $(el).closest("article, li, div");
    const dateText =
      container.find("time").first().text().trim() ||
      container.find(".date").first().text().trim();

    const buyHref =
      container
        .find('a[href*="tickets"], a[href*="/performances/"]')
        .first()
        .attr("href") ?? "";
    if (!buyHref) return;

    const buyUrl = buyHref.startsWith("http")
      ? buyHref
      : `https://www.msmnyc.edu${buyHref}`;

    events.push({ title, dateText, buyUrl });
  });

  return events;
}

async function main() {
  console.log("Scraping venues...");
  const [carnegie, met, juilliard, msm] = await Promise.allSettled([
    scrapeCarnegieHall(),
    scrapeMetOpera(),
    scrapeJuilliard(),
    scrapeMSM(),
  ]);

  const summarize = (name, result) => {
    if (result.status === "rejected") {
      console.error(name, "FAILED:", result.reason?.message ?? result.reason);
      return;
    }
    console.log(`${name}: ${result.value.length} events`);
    for (const ev of result.value.slice(0, 3)) {
      console.log("  -", ev.title, "|", ev.dateText ?? "", "→", ev.buyUrl);
    }
  };

  summarize("Carnegie Hall", carnegie);
  summarize("Met Opera", met);
  summarize("Juilliard", juilliard);
  summarize("MSM", msm);
}

main().catch((err) => {
  console.error("Scraper error", err);
  process.exit(1);
});

