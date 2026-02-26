import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

import * as schema from "./schema";

const db = drizzle({ client: sql, schema, casing: "snake_case" });

const events: (typeof schema.Event.$inferInsert)[] = [
  {
    title: "Beethoven's 9th Symphony — Season Finale",
    date: new Date("2026-04-18T19:30:00-05:00"),
    venue: "Symphony Center, Chicago",
    venueAddress: "220 S Michigan Ave, Chicago, IL 60604",
    program:
      "Beethoven: Symphony No. 9 in D minor, Op. 125 'Choral' — featuring the Chicago Symphony Chorus",
    description:
      "Experience the electrifying climax of the season with Beethoven's monumental Ninth Symphony. The iconic 'Ode to Joy' finale, performed with full chorus and soloists, is one of the most powerful moments in all of music.",
    difficulty: "beginner",
    genre: "orchestral",
    originalPriceCents: 8500,
    discountedPriceCents: 5900,
    ticketsAvailable: 120,
    beginnerNotes:
      "This is THE classical music experience. The famous 'Ode to Joy' melody kicks in during the final movement — you'll recognize it instantly. The symphony builds from darkness to triumph over about 70 minutes. Don't worry about following every note; just let the journey carry you.",
  },
  {
    title: "Mozart & Dvořák — An Evening of Grace",
    date: new Date("2026-03-22T20:00:00-05:00"),
    venue: "Carnegie Hall, New York",
    venueAddress: "881 7th Ave, New York, NY 10019",
    program:
      "Mozart: Piano Concerto No. 21 in C major, K.467 'Elvira Madigan'\nDvořák: Symphony No. 9 'From the New World'",
    description:
      "Two beloved masterworks in one evening. Mozart's graceful piano concerto features one of the most beautiful slow movements ever written, followed by Dvořák's symphony inspired by America — full of folk melodies and sweeping emotion.",
    difficulty: "beginner",
    genre: "orchestral",
    originalPriceCents: 9500,
    discountedPriceCents: 6500,
    ticketsAvailable: 85,
    beginnerNotes:
      "You've probably heard both of these pieces before without knowing it. Mozart's slow movement has been in countless films. Dvořák's 'New World' symphony has a melody so catchy it was once used as a bread commercial jingle in Japan. Both are incredibly accessible.",
  },
  {
    title: "La Bohème — Puccini's Masterpiece",
    date: new Date("2026-04-05T19:00:00-04:00"),
    venue: "The Metropolitan Opera, New York",
    venueAddress: "30 Lincoln Center Plaza, New York, NY 10023",
    program:
      "Puccini: La Bohème — Full opera in four acts with English supertitles",
    description:
      "The original love story that inspired RENT. Follow bohemian artists in 1830s Paris through love, loss, and the beauty of living fully. Puccini's score is achingly beautiful, with melodies that will stay with you for days.",
    difficulty: "beginner",
    genre: "opera",
    originalPriceCents: 15000,
    discountedPriceCents: 10500,
    ticketsAvailable: 60,
    beginnerNotes:
      "If you've seen RENT, you already know this story — La Bohème is literally what RENT is based on. English supertitles are projected above the stage so you'll always know what's happening. The music is gorgeous and emotional — bring tissues for Act 4.",
  },
  {
    title: "Bach Cello Suites — Complete Cycle",
    date: new Date("2026-03-15T15:00:00-04:00"),
    venue: "Jordan Hall, Boston",
    venueAddress: "30 Gainsborough St, Boston, MA 02115",
    program:
      "J.S. Bach: Complete Cello Suites Nos. 1-6, BWV 1007-1012 — performed by Yo-Yo Ma",
    description:
      "A rare opportunity to hear all six of Bach's cello suites performed in a single afternoon by the legendary Yo-Yo Ma. These intimate, meditative works represent some of the most profound music ever written for a solo instrument.",
    difficulty: "intermediate",
    genre: "solo_recital",
    originalPriceCents: 12000,
    discountedPriceCents: 8400,
    ticketsAvailable: 45,
    beginnerNotes:
      "This is just one person, one cello, and some of the most beautiful music ever written. Suite No. 1 is probably the most famous cello piece in existence — you'll recognize the opening instantly. Let the music wash over you; it's meditative, not dramatic.",
  },
  {
    title: "Tchaikovsky's Swan Lake — Ballet in Concert",
    date: new Date("2026-05-10T19:30:00-04:00"),
    venue: "Kennedy Center, Washington D.C.",
    venueAddress: "2700 F St NW, Washington, DC 20566",
    program:
      "Tchaikovsky: Swan Lake, Op. 20 — Complete ballet with the National Ballet",
    description:
      "The quintessential ballet experience. Tchaikovsky's sweeping score accompanies the timeless story of Prince Siegfried and the enchanted Odette. Features stunning choreography and one of the most beautiful orchestral scores in the repertoire.",
    difficulty: "beginner",
    genre: "ballet",
    originalPriceCents: 11000,
    discountedPriceCents: 7700,
    ticketsAvailable: 90,
    beginnerNotes:
      "Swan Lake is the perfect first ballet. The story is simple (prince falls for swan-princess, evil sorcerer causes trouble), the music is gorgeous, and the dancing is spectacular. The famous 'Dance of the Little Swans' is one of ballet's most iconic moments.",
  },
  {
    title: "Brahms Piano Quartets — Chamber Music Festival",
    date: new Date("2026-03-28T19:00:00-04:00"),
    venue: "Wigmore Hall, London",
    venueAddress: "36 Wigmore St, London W1U 2BP",
    program:
      "Brahms: Piano Quartet No. 1 in G minor, Op. 25\nBrahms: Piano Quartet No. 3 in C minor, Op. 60",
    description:
      "An intimate evening of Brahms's passionate chamber music. The First Quartet's fiery finale (a Rondo alla Zingarese) is one of the most exciting movements in all of chamber music. The Third Quartet is darker and more introspective — Brahms called it his 'Werther' quartet.",
    difficulty: "intermediate",
    genre: "chamber",
    originalPriceCents: 6500,
    discountedPriceCents: 4500,
    ticketsAvailable: 40,
    beginnerNotes:
      "Chamber music means a small group of musicians (here, piano + violin + viola + cello) playing together in a cozy hall. You're much closer to the performers than in an orchestra concert — you can see every expression and gesture. The finale of the First Quartet is pure fire.",
  },
  {
    title: "Vivaldi's Four Seasons — Candlelight Concert",
    date: new Date("2026-04-12T20:00:00-05:00"),
    venue: "St. James Cathedral, Chicago",
    venueAddress: "65 E Huron St, Chicago, IL 60611",
    program:
      "Vivaldi: The Four Seasons (Le quattro stagioni), Op. 8\nPiazzolla: Four Seasons of Buenos Aires (selections)",
    description:
      "Experience Vivaldi's beloved Four Seasons performed by candlelight in a stunning cathedral setting, paired with Piazzolla's tango-infused reimagining. An atmospheric evening where baroque meets Buenos Aires.",
    difficulty: "beginner",
    genre: "chamber",
    originalPriceCents: 5500,
    discountedPriceCents: 3800,
    ticketsAvailable: 75,
    beginnerNotes:
      "You absolutely know this music — Spring and Summer have been in every commercial, film, and phone hold ever. Hearing it live in a candlelit cathedral is a completely different experience. Piazzolla's pieces add a fun, unexpected tango twist.",
  },
  {
    title: "Mahler's Symphony No. 2 'Resurrection'",
    date: new Date("2026-05-02T19:30:00-04:00"),
    venue: "Walt Disney Concert Hall, Los Angeles",
    venueAddress: "111 S Grand Ave, Los Angeles, CA 90012",
    program:
      "Mahler: Symphony No. 2 in C minor 'Resurrection' — with the LA Philharmonic, two soloists, and the Los Angeles Master Chorale",
    description:
      "Mahler's monumental Second Symphony is a 90-minute journey from death to resurrection, culminating in one of the most overwhelming finales in all of orchestral music. Massive forces — full orchestra, two vocal soloists, and a large chorus — come together for a transcendent conclusion.",
    difficulty: "advanced",
    genre: "orchestral",
    originalPriceCents: 9000,
    discountedPriceCents: 6300,
    ticketsAvailable: 100,
    beginnerNotes:
      "This is a BIG piece — 90 minutes with huge orchestra, soloists, and a full choir. The finale is genuinely one of the most overwhelming experiences in music. Fair warning: there's a long quiet section in the middle (Mahler wrote in his score: '5 minutes of silence'). The payoff is worth it.",
  },
  {
    title: "Chopin Nocturnes — Solo Piano Recital",
    date: new Date("2026-03-08T19:30:00-05:00"),
    venue: "Zankel Hall, New York",
    venueAddress: "881 7th Ave, New York, NY 10019",
    program:
      "Chopin: Selection of Nocturnes, Ballades, and Polonaises — performed by Seong-Jin Cho",
    description:
      "An evening of Chopin's most poetic and virtuosic piano works. The Nocturnes are dreamy and intimate; the Ballades are epic storytelling through music; the Polonaises blaze with Polish pride and fire.",
    difficulty: "beginner",
    genre: "solo_recital",
    originalPriceCents: 7500,
    discountedPriceCents: 5200,
    ticketsAvailable: 55,
    beginnerNotes:
      "Chopin wrote almost exclusively for piano, and his music is pure emotion. The Nocturnes are perfect for easing into classical music — they're short, beautiful, and incredibly relaxing. The Ballades and Polonaises add drama and excitement.",
  },
  {
    title: "The Magic Flute — Mozart Opera",
    date: new Date("2026-04-25T19:30:00-04:00"),
    venue: "Lyric Opera of Chicago",
    venueAddress: "20 N Upper Wacker Dr, Chicago, IL 60606",
    program:
      "Mozart: Die Zauberflöte (The Magic Flute) — Sung in German with English supertitles",
    description:
      "Mozart's final opera is a fantastical fairy tale full of magic, love, comedy, and some of the most memorable arias ever written. The Queen of the Night's aria is one of the most famous (and difficult) pieces in all of opera.",
    difficulty: "beginner",
    genre: "opera",
    originalPriceCents: 13000,
    discountedPriceCents: 9100,
    ticketsAvailable: 70,
    beginnerNotes:
      "This is the perfect first opera — it's basically a fairy tale with incredible music. There are funny parts, scary parts, and jaw-dropping singing. Wait for the Queen of the Night's aria — it's the one where the soprano hits impossibly high notes. You'll want to gasp.",
  },
  {
    title: "Rachmaninoff Piano Concerto No. 2",
    date: new Date("2026-05-15T20:00:00-04:00"),
    venue: "Kimmel Center, Philadelphia",
    venueAddress: "300 S Broad St, Philadelphia, PA 19102",
    program:
      "Rachmaninoff: Piano Concerto No. 2 in C minor, Op. 18\nRimsky-Korsakov: Scheherazade, Op. 35",
    description:
      "Two of the most lush, romantic works in the orchestral repertoire. Rachmaninoff's Second Concerto is pure Hollywood romance — sweeping melodies and breathtaking virtuosity. Scheherazade paints the tales of One Thousand and One Nights in vivid orchestral color.",
    difficulty: "beginner",
    genre: "orchestral",
    originalPriceCents: 8000,
    discountedPriceCents: 5600,
    ticketsAvailable: 95,
    beginnerNotes:
      "If you like film scores, you'll LOVE this concert. Rachmaninoff's concerto has been used in dozens of movies (including Brief Encounter). The melodies are incredibly beautiful and memorable. Scheherazade is like a movie in music — each movement tells a different story.",
  },
  {
    title: "Handel's Messiah — Easter Performance",
    date: new Date("2026-04-03T19:00:00-04:00"),
    venue: "National Cathedral, Washington D.C.",
    venueAddress: "3101 Wisconsin Ave NW, Washington, DC 20016",
    program:
      "Handel: Messiah, HWV 56 — Parts II and III (Easter portions) with period instruments",
    description:
      "Experience the Easter portions of Handel's beloved Messiah in the magnificent National Cathedral. Performed with period instruments for an authentic baroque sound, featuring the iconic 'Hallelujah' chorus.",
    difficulty: "beginner",
    genre: "choral",
    originalPriceCents: 6000,
    discountedPriceCents: 4200,
    ticketsAvailable: 110,
    beginnerNotes:
      "You know the 'Hallelujah' chorus — that's from this piece! Fun tradition: audiences have stood during the Hallelujah chorus since King George II supposedly did at the premiere in 1743. The cathedral setting makes this extra special.",
  },
  {
    title: "Bartók & Shostakovich — 20th Century Masters",
    date: new Date("2026-05-20T19:30:00-04:00"),
    venue: "Severance Hall, Cleveland",
    venueAddress: "11001 Euclid Ave, Cleveland, OH 44106",
    program:
      "Bartók: Concerto for Orchestra, Sz. 116\nShostakovich: Symphony No. 5 in D minor, Op. 47",
    description:
      "Two towering 20th-century masterworks that pack an emotional punch. Bartók's Concerto showcases every section of the orchestra in brilliant fashion. Shostakovich's Fifth is a gripping drama of defiance and survival, written under Stalin's watchful eye.",
    difficulty: "intermediate",
    genre: "orchestral",
    originalPriceCents: 7000,
    discountedPriceCents: 4900,
    ticketsAvailable: 80,
    beginnerNotes:
      "These pieces are more modern and edgy than Mozart or Beethoven, but incredibly exciting. Bartók's piece is like a showcase where every instrument gets to be a star. Shostakovich's symphony has a fascinating backstory — he wrote it to save his life from Stalin. The ending is deliberately ambiguous: triumph or forced celebration?",
  },
  {
    title: "String Quartet Marathon — Beethoven Late Quartets",
    date: new Date("2026-04-19T14:00:00-04:00"),
    venue: "Chamber Music Hall, Berlin Philharmonie",
    venueAddress: "Herbert-von-Karajan-Str. 1, 10785 Berlin",
    program:
      "Beethoven: String Quartet No. 14 in C-sharp minor, Op. 131\nBeethoven: String Quartet No. 15 in A minor, Op. 132",
    description:
      "Beethoven's late string quartets are considered among the greatest musical achievements in Western civilization. Written when he was completely deaf, these works are deeply personal, structurally revolutionary, and emotionally overwhelming.",
    difficulty: "advanced",
    genre: "chamber",
    originalPriceCents: 5000,
    discountedPriceCents: 3500,
    ticketsAvailable: 35,
    beginnerNotes:
      "These are challenging but incredibly rewarding. Beethoven was completely deaf when he wrote them, which makes them even more astonishing. The 'Holy Song of Thanksgiving' in Op. 132 (written after recovering from illness) is one of the most moving passages in all of music.",
  },
  {
    title: "Verdi Requiem — Memorial Concert",
    date: new Date("2026-05-08T19:00:00-04:00"),
    venue: "Basilica of the National Shrine, Washington D.C.",
    venueAddress: "400 Michigan Ave NE, Washington, DC 20017",
    program:
      "Verdi: Messa da Requiem — Four soloists, full chorus, and orchestra",
    description:
      "Sometimes called 'the greatest opera ever written' — but it's actually a sacred Requiem Mass. Verdi's setting is dramatic, operatic, and thunderously powerful. The 'Dies Irae' is one of the most terrifying and thrilling moments in music.",
    difficulty: "intermediate",
    genre: "choral",
    originalPriceCents: 8500,
    discountedPriceCents: 5900,
    ticketsAvailable: 65,
    beginnerNotes:
      "Think of this as an opera disguised as a church piece. The 'Dies Irae' (Day of Wrath) section will literally make you jump — massive timpani, crashing brass, and a full chorus screaming about the end of the world. It's metal. In a basilica.",
  },
  {
    title: "Debussy & Ravel — French Impressionism",
    date: new Date("2026-03-29T20:00:00-04:00"),
    venue: "Koerner Hall, Toronto",
    venueAddress: "273 Bloor St W, Toronto, ON M5S 1W2",
    program:
      "Debussy: Prélude à l'après-midi d'un faune\nDebussy: La Mer\nRavel: Boléro",
    description:
      "An evening of shimmering French orchestral color. Debussy's Faune is languid and sensuous; La Mer captures the ocean in three movements. Ravel's Boléro is the ultimate buildup — one melody, repeated and growing for 17 minutes until a shattering climax.",
    difficulty: "beginner",
    genre: "orchestral",
    originalPriceCents: 7500,
    discountedPriceCents: 5200,
    ticketsAvailable: 85,
    beginnerNotes:
      "Boléro is the piece that just keeps building and building on one melody for 17 straight minutes. It's hypnotic. You'll think 'surely this is the climax' about five times before the actual ending, which is absolutely massive. Debussy's pieces are like sonic paintings — just let the colors wash over you.",
  },
];

async function seed() {
  console.log("Seeding events...");

  for (const event of events) {
    await db.insert(schema.Event).values(event);
    console.log(`  ✓ ${event.title}`);
  }

  console.log(`\nSeeded ${events.length} events successfully.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
