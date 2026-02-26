export type MusicTier = "easy" | "medium" | "hard";

export interface MusicTrack {
  id: number;
  file: string;
  tier: MusicTier;
  title: string;
  composer: string;
}

export const MUSIC_CATALOG: MusicTrack[] = [
  // Easy listening (Tracks 1-10): Bach, Beethoven, Mozart — approachable classics
  {
    id: 1,
    file: "/music/Track_01.mp3",
    tier: "easy",
    title: "Air on the G String",
    composer: "J.S. Bach",
  },
  {
    id: 2,
    file: "/music/Track_02.mp3",
    tier: "easy",
    title: "Moonlight Sonata (1st Movement)",
    composer: "Beethoven",
  },
  {
    id: 3,
    file: "/music/Track_03.mp3",
    tier: "easy",
    title: "Eine Kleine Nachtmusik",
    composer: "Mozart",
  },
  {
    id: 4,
    file: "/music/Track_04.mp3",
    tier: "easy",
    title: "Canon in D",
    composer: "Pachelbel",
  },
  {
    id: 5,
    file: "/music/Track_05.mp3",
    tier: "easy",
    title: "Clair de Lune",
    composer: "Debussy",
  },
  {
    id: 6,
    file: "/music/Track_06.mp3",
    tier: "easy",
    title: "Für Elise",
    composer: "Beethoven",
  },
  {
    id: 7,
    file: "/music/Track_07.mp3",
    tier: "easy",
    title: "Spring (Four Seasons)",
    composer: "Vivaldi",
  },
  {
    id: 8,
    file: "/music/Track_08.mp3",
    tier: "easy",
    title: "Gymnopédie No. 1",
    composer: "Satie",
  },
  {
    id: 9,
    file: "/music/Track_09.mp3",
    tier: "easy",
    title: "Prelude in C Major",
    composer: "J.S. Bach",
  },
  {
    id: 10,
    file: "/music/Track_10.mp3",
    tier: "easy",
    title: "Ode to Joy",
    composer: "Beethoven",
  },

  // Medium listening (Tracks 11-20): Shostakovich, Chopin, Tchaikovsky — more emotional depth
  {
    id: 11,
    file: "/music/Track_11.mp3",
    tier: "medium",
    title: "Waltz No. 2",
    composer: "Shostakovich",
  },
  {
    id: 12,
    file: "/music/Track_12.mp3",
    tier: "medium",
    title: "Nocturne Op. 9 No. 2",
    composer: "Chopin",
  },
  {
    id: 13,
    file: "/music/Track_13.mp3",
    tier: "medium",
    title: "Swan Lake Theme",
    composer: "Tchaikovsky",
  },
  {
    id: 14,
    file: "/music/Track_14.mp3",
    tier: "medium",
    title: "Pathétique Sonata",
    composer: "Beethoven",
  },
  {
    id: 15,
    file: "/music/Track_15.mp3",
    tier: "medium",
    title: "String Quartet No. 8",
    composer: "Shostakovich",
  },
  {
    id: 16,
    file: "/music/Track_16.mp3",
    tier: "medium",
    title: "Piano Concerto No. 2",
    composer: "Rachmaninoff",
  },
  {
    id: 17,
    file: "/music/Track_17.mp3",
    tier: "medium",
    title: "Ballade No. 1",
    composer: "Chopin",
  },
  {
    id: 18,
    file: "/music/Track_18.mp3",
    tier: "medium",
    title: "1812 Overture",
    composer: "Tchaikovsky",
  },
  {
    id: 19,
    file: "/music/Track_19.mp3",
    tier: "medium",
    title: "Piano Concerto No. 1",
    composer: "Tchaikovsky",
  },
  {
    id: 20,
    file: "/music/Track_20.mp3",
    tier: "medium",
    title: "Fantasie-Impromptu",
    composer: "Chopin",
  },

  // Harder listening (Tracks 21-31): Strauss, Mahler, Wagner — complex but beautiful
  {
    id: 21,
    file: "/music/Track_21.mp3",
    tier: "hard",
    title: "Also sprach Zarathustra",
    composer: "R. Strauss",
  },
  {
    id: 22,
    file: "/music/Track_22.mp3",
    tier: "hard",
    title: "Der Rosenkavalier Suite",
    composer: "R. Strauss",
  },
  {
    id: 23,
    file: "/music/Track_23.mp3",
    tier: "hard",
    title: "Adagietto (Symphony No. 5)",
    composer: "Mahler",
  },
  {
    id: 24,
    file: "/music/Track_24.mp3",
    tier: "hard",
    title: "Till Eulenspiegel",
    composer: "R. Strauss",
  },
  {
    id: 25,
    file: "/music/Track_25.mp3",
    tier: "hard",
    title: "Ride of the Valkyries",
    composer: "Wagner",
  },
  {
    id: 26,
    file: "/music/Track_26.mp3",
    tier: "hard",
    title: "Don Juan",
    composer: "R. Strauss",
  },
  {
    id: 27,
    file: "/music/Track_27.mp3",
    tier: "hard",
    title: "Symphony No. 2 (Finale)",
    composer: "Mahler",
  },
  {
    id: 28,
    file: "/music/Track_28.mp3",
    tier: "hard",
    title: "Ein Heldenleben",
    composer: "R. Strauss",
  },
  {
    id: 29,
    file: "/music/Track_29.mp3",
    tier: "hard",
    title: "Tristan und Isolde (Prelude)",
    composer: "Wagner",
  },
  {
    id: 30,
    file: "/music/Track_30.mp3",
    tier: "hard",
    title: "Four Last Songs",
    composer: "R. Strauss",
  },
  {
    id: 31,
    file: "/music/Track_31.mp3",
    tier: "hard",
    title: "Das Lied von der Erde",
    composer: "Mahler",
  },
];

export function getRandomTracksPerTier(): [MusicTrack, MusicTrack, MusicTrack] {
  const easy = MUSIC_CATALOG.filter((t) => t.tier === "easy");
  const medium = MUSIC_CATALOG.filter((t) => t.tier === "medium");
  const hard = MUSIC_CATALOG.filter((t) => t.tier === "hard");

  return [
    easy[Math.floor(Math.random() * easy.length)]!,
    medium[Math.floor(Math.random() * medium.length)]!,
    hard[Math.floor(Math.random() * hard.length)]!,
  ];
}
