export type MusicTier = "easy" | "medium" | "hard";

/** Mirrors `eraAffinityEnum` in @acme/db/schema. */
export type ClipEra =
  | "baroque"
  | "classical_period"
  | "romantic"
  | "impressionist"
  | "modern"
  | "contemporary";

/** Mirrors `emotionalOrientationEnum`. */
export type ClipMood = "catharsis" | "tranquility" | "intellectual" | "energy";

/** Mirrors `texturePreferenceEnum`. */
export type ClipTexture = "grand" | "intimate" | "vocal" | "mixed";

/** Mirrors `complexityToleranceEnum`. */
export type ClipComplexity = "accessible" | "layered" | "challenging";

export interface MusicTrack {
  id: number;
  file: string;
  /** Legacy difficulty bucket from the original onboarding. Kept for back-compat. */
  tier: MusicTier;
  title: string;
  composer: string;
  era: ClipEra;
  moodCluster: ClipMood;
  texture: ClipTexture;
  complexity: ClipComplexity;
  /** Approximate playable length in ms; used by the clips-phase UI for skip math. */
  durationMs?: number;
}

/**
 * Curated taste annotations chosen by ear, not by AI. These power the
 * onboarding clips phase + the seed for content-based recommendations.
 *
 * Era buckets follow the conventional pedagogical line:
 *   baroque (Bach/Vivaldi/Pachelbel), classical_period (Mozart/Haydn/Beethoven),
 *   romantic (Chopin/Tchaikovsky/Wagner/Mahler/Rachmaninoff),
 *   impressionist (Debussy/Ravel/Fauré),
 *   modern (Strauss/Shostakovich/Stravinsky/Satie),
 *   contemporary (living composers).
 *
 * Strauss is bucketed `modern` despite being late-romantic stylistically,
 * because users selecting "20th century modern" should encounter him.
 */
export const MUSIC_CATALOG: MusicTrack[] = [
  {
    id: 1,
    file: "/music/Track_01.mp3",
    tier: "easy",
    title: "Air on the G String",
    composer: "J.S. Bach",
    era: "baroque",
    moodCluster: "tranquility",
    texture: "intimate",
    complexity: "accessible",
  },
  {
    id: 2,
    file: "/music/Track_02.mp3",
    tier: "easy",
    title: "Moonlight Sonata (1st Movement)",
    composer: "Beethoven",
    era: "classical_period",
    moodCluster: "tranquility",
    texture: "intimate",
    complexity: "accessible",
  },
  {
    id: 3,
    file: "/music/Track_03.mp3",
    tier: "easy",
    title: "Eine Kleine Nachtmusik",
    composer: "Mozart",
    era: "classical_period",
    moodCluster: "energy",
    texture: "grand",
    complexity: "accessible",
  },
  {
    id: 4,
    file: "/music/Track_04.mp3",
    tier: "easy",
    title: "Canon in D",
    composer: "Pachelbel",
    era: "baroque",
    moodCluster: "tranquility",
    texture: "intimate",
    complexity: "accessible",
  },
  {
    id: 5,
    file: "/music/Track_05.mp3",
    tier: "easy",
    title: "Clair de Lune",
    composer: "Debussy",
    era: "impressionist",
    moodCluster: "tranquility",
    texture: "intimate",
    complexity: "accessible",
  },
  {
    id: 6,
    file: "/music/Track_06.mp3",
    tier: "easy",
    title: "Für Elise",
    composer: "Beethoven",
    era: "classical_period",
    moodCluster: "tranquility",
    texture: "intimate",
    complexity: "accessible",
  },
  {
    id: 7,
    file: "/music/Track_07.mp3",
    tier: "easy",
    title: "Spring (Four Seasons)",
    composer: "Vivaldi",
    era: "baroque",
    moodCluster: "energy",
    texture: "grand",
    complexity: "accessible",
  },
  {
    id: 8,
    file: "/music/Track_08.mp3",
    tier: "easy",
    title: "Gymnopédie No. 1",
    composer: "Satie",
    era: "modern",
    moodCluster: "tranquility",
    texture: "intimate",
    complexity: "accessible",
  },
  {
    id: 9,
    file: "/music/Track_09.mp3",
    tier: "easy",
    title: "Prelude in C Major",
    composer: "J.S. Bach",
    era: "baroque",
    // From the Well-Tempered Clavier — a piece of architecture as much
    // as music; the closest "intellectual" mood we have in the catalog.
    moodCluster: "intellectual",
    texture: "intimate",
    complexity: "accessible",
  },
  {
    id: 10,
    file: "/music/Track_10.mp3",
    tier: "easy",
    title: "Ode to Joy",
    composer: "Beethoven",
    era: "classical_period",
    moodCluster: "energy",
    texture: "vocal",
    complexity: "accessible",
  },
  {
    id: 11,
    file: "/music/Track_11.mp3",
    tier: "medium",
    title: "Waltz No. 2",
    composer: "Shostakovich",
    era: "modern",
    moodCluster: "energy",
    texture: "grand",
    complexity: "accessible",
  },
  {
    id: 12,
    file: "/music/Track_12.mp3",
    tier: "medium",
    title: "Nocturne Op. 9 No. 2",
    composer: "Chopin",
    era: "romantic",
    moodCluster: "tranquility",
    texture: "intimate",
    complexity: "accessible",
  },
  {
    id: 13,
    file: "/music/Track_13.mp3",
    tier: "medium",
    title: "Swan Lake Theme",
    composer: "Tchaikovsky",
    era: "romantic",
    moodCluster: "catharsis",
    texture: "grand",
    complexity: "accessible",
  },
  {
    id: 14,
    file: "/music/Track_14.mp3",
    tier: "medium",
    title: "Pathétique Sonata",
    composer: "Beethoven",
    era: "classical_period",
    moodCluster: "catharsis",
    texture: "intimate",
    complexity: "layered",
  },
  {
    id: 15,
    file: "/music/Track_15.mp3",
    tier: "medium",
    title: "String Quartet No. 8",
    composer: "Shostakovich",
    era: "modern",
    moodCluster: "catharsis",
    texture: "intimate",
    complexity: "layered",
  },
  {
    id: 16,
    file: "/music/Track_16.mp3",
    tier: "medium",
    title: "Piano Concerto No. 2",
    composer: "Rachmaninoff",
    era: "romantic",
    moodCluster: "catharsis",
    texture: "grand",
    complexity: "layered",
  },
  {
    id: 17,
    file: "/music/Track_17.mp3",
    tier: "medium",
    title: "Ballade No. 1",
    composer: "Chopin",
    era: "romantic",
    moodCluster: "catharsis",
    texture: "intimate",
    complexity: "layered",
  },
  {
    id: 18,
    file: "/music/Track_18.mp3",
    tier: "medium",
    title: "1812 Overture",
    composer: "Tchaikovsky",
    era: "romantic",
    moodCluster: "energy",
    texture: "grand",
    complexity: "accessible",
  },
  {
    id: 19,
    file: "/music/Track_19.mp3",
    tier: "medium",
    title: "Piano Concerto No. 1",
    composer: "Tchaikovsky",
    era: "romantic",
    moodCluster: "catharsis",
    texture: "grand",
    complexity: "layered",
  },
  {
    id: 20,
    file: "/music/Track_20.mp3",
    tier: "medium",
    title: "Fantasie-Impromptu",
    composer: "Chopin",
    era: "romantic",
    moodCluster: "energy",
    texture: "intimate",
    complexity: "layered",
  },
  {
    id: 21,
    file: "/music/Track_21.mp3",
    tier: "hard",
    title: "Also sprach Zarathustra",
    composer: "R. Strauss",
    era: "modern",
    moodCluster: "catharsis",
    texture: "grand",
    complexity: "layered",
  },
  {
    id: 22,
    file: "/music/Track_22.mp3",
    tier: "hard",
    title: "Der Rosenkavalier Suite",
    composer: "R. Strauss",
    era: "modern",
    moodCluster: "catharsis",
    texture: "grand",
    complexity: "layered",
  },
  {
    id: 23,
    file: "/music/Track_23.mp3",
    tier: "hard",
    title: "Adagietto (Symphony No. 5)",
    composer: "Mahler",
    era: "romantic",
    moodCluster: "catharsis",
    texture: "grand",
    complexity: "layered",
  },
  {
    id: 24,
    file: "/music/Track_24.mp3",
    tier: "hard",
    title: "Till Eulenspiegel",
    composer: "R. Strauss",
    era: "modern",
    moodCluster: "energy",
    texture: "grand",
    complexity: "layered",
  },
  {
    id: 25,
    file: "/music/Track_25.mp3",
    tier: "hard",
    title: "Ride of the Valkyries",
    composer: "Wagner",
    era: "romantic",
    moodCluster: "energy",
    texture: "grand",
    complexity: "accessible",
  },
  {
    id: 26,
    file: "/music/Track_26.mp3",
    tier: "hard",
    title: "Don Juan",
    composer: "R. Strauss",
    era: "modern",
    moodCluster: "catharsis",
    texture: "grand",
    complexity: "layered",
  },
  {
    id: 27,
    file: "/music/Track_27.mp3",
    tier: "hard",
    title: "Symphony No. 2 (Finale)",
    composer: "Mahler",
    era: "romantic",
    moodCluster: "catharsis",
    texture: "vocal",
    complexity: "challenging",
  },
  {
    id: 28,
    file: "/music/Track_28.mp3",
    tier: "hard",
    title: "Ein Heldenleben",
    composer: "R. Strauss",
    era: "modern",
    moodCluster: "catharsis",
    texture: "grand",
    complexity: "challenging",
  },
  {
    id: 29,
    file: "/music/Track_29.mp3",
    tier: "hard",
    title: "Tristan und Isolde (Prelude)",
    composer: "Wagner",
    era: "romantic",
    moodCluster: "catharsis",
    texture: "grand",
    complexity: "challenging",
  },
  {
    id: 30,
    file: "/music/Track_30.mp3",
    tier: "hard",
    title: "Four Last Songs",
    composer: "R. Strauss",
    era: "modern",
    moodCluster: "catharsis",
    texture: "vocal",
    complexity: "layered",
  },
  {
    id: 31,
    file: "/music/Track_31.mp3",
    tier: "hard",
    title: "Das Lied von der Erde",
    composer: "Mahler",
    era: "romantic",
    moodCluster: "catharsis",
    texture: "vocal",
    complexity: "challenging",
  },
];

export function getRandomTracksPerTier(): [MusicTrack, MusicTrack, MusicTrack] {
  const easy = MUSIC_CATALOG.filter((t) => t.tier === "easy");
  const medium = MUSIC_CATALOG.filter((t) => t.tier === "medium");
  const hard = MUSIC_CATALOG.filter((t) => t.tier === "hard");
  const easyTrack = easy[Math.floor(Math.random() * easy.length)];
  const mediumTrack = medium[Math.floor(Math.random() * medium.length)];
  const hardTrack = hard[Math.floor(Math.random() * hard.length)];

  if (!easyTrack || !mediumTrack || !hardTrack) {
    throw new Error("Music catalog is missing one or more tiers");
  }

  return [easyTrack, mediumTrack, hardTrack];
}

/**
 * Pick `count` clips that maximize coverage of the (era × moodCluster)
 * grid. If `prior` is supplied (partial profile from the visual cards),
 * tilt toward those eras for a cleaner signal — but keep at least
 * `Math.floor(count / 3)` slots for "stretch" picks outside the user's
 * stated preference, so a single clip phase can still surprise them.
 *
 * Deterministic shuffling is left to the caller; this returns picks in
 * a fixed coverage order.
 */
export function pickClipsForOnboarding(input: {
  count?: number;
  prior?: { eras?: ClipEra[]; emotionalOrientation?: ClipMood };
}): MusicTrack[] {
  const count = input.count ?? 10;
  const preferredEras = new Set(input.prior?.eras ?? []);
  const preferredMood = input.prior?.emotionalOrientation;

  // Bucket by (era, mood) so we can scoop one per cell.
  const byCell = new Map<string, MusicTrack[]>();
  for (const t of MUSIC_CATALOG) {
    const key = `${t.era}::${t.moodCluster}`;
    const arr = byCell.get(key) ?? [];
    arr.push(t);
    byCell.set(key, arr);
  }

  // Score cells — preferred eras get +2, preferred mood +1, otherwise 0.
  const scoredCells = [...byCell.entries()].map(([key, tracks]) => {
    const [era, mood] = key.split("::") as [ClipEra, ClipMood];
    let score = 0;
    if (preferredEras.has(era)) score += 2;
    if (preferredMood && preferredMood === mood) score += 1;
    return { era, mood, score, tracks };
  });

  scoredCells.sort((a, b) => b.score - a.score);

  // Reserve ~30% of slots for stretch picks so users always see something
  // outside their preference for discovery.
  const stretchSlots = Math.floor(count / 3);
  const preferredSlots = count - stretchSlots;

  const picks: MusicTrack[] = [];
  const seenComposers = new Set<string>();
  const takeFromCell = (cell: { tracks: MusicTrack[] }) => {
    const fresh =
      cell.tracks.find((t) => !seenComposers.has(t.composer)) ?? cell.tracks[0];
    if (fresh) {
      picks.push(fresh);
      seenComposers.add(fresh.composer);
    }
  };

  for (const cell of scoredCells) {
    if (picks.length >= preferredSlots) break;
    if (cell.score === 0) continue;
    takeFromCell(cell);
  }

  for (const cell of scoredCells) {
    if (picks.length >= count) break;
    if (cell.score > 0) continue;
    takeFromCell(cell);
  }

  // Final top-up if still short (small catalog edge case).
  if (picks.length < count) {
    for (const t of MUSIC_CATALOG) {
      if (picks.length >= count) break;
      if (!picks.includes(t)) picks.push(t);
    }
  }

  return picks.slice(0, count);
}
