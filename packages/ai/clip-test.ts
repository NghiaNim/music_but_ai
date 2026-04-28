import { MUSIC_CATALOG, pickClipsForOnboarding } from "@acme/ai";

console.log(`Catalog size: ${MUSIC_CATALOG.length}`);
const eras = new Set(MUSIC_CATALOG.map((t) => t.era));
const moods = new Set(MUSIC_CATALOG.map((t) => t.moodCluster));
const textures = new Set(MUSIC_CATALOG.map((t) => t.texture));
console.log(`Eras covered: ${[...eras].join(", ")}`);
console.log(`Moods covered: ${[...moods].join(", ")}`);
console.log(`Textures covered: ${[...textures].join(", ")}`);

console.log("\nNo prior:");
const noPrior = pickClipsForOnboarding({});
for (const t of noPrior)
  console.log(
    `  ${t.composer.padEnd(15)} ${t.era.padEnd(18)} ${t.moodCluster.padEnd(13)} ${t.texture.padEnd(10)} ${t.title}`,
  );

console.log("\nUser leans romantic + catharsis:");
const biased = pickClipsForOnboarding({
  prior: {
    eras: ["romantic", "impressionist"],
    emotionalOrientation: "catharsis",
  },
});
for (const t of biased)
  console.log(
    `  ${t.composer.padEnd(15)} ${t.era.padEnd(18)} ${t.moodCluster.padEnd(13)} ${t.texture.padEnd(10)} ${t.title}`,
  );
