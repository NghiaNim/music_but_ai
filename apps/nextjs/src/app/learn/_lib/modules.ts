export interface Lesson {
  title: string;
  emoji: string;
  gradient: string;
  body: string;
  examples: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  goal: string;
  emoji: string;
  gradient: string;
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

export interface LearningModuleDef {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  cardIcon: string;
  cardGradient: string;
  heroEmoji: string;
  units: Unit[];
}

// ─── 1. Meet the Instruments ────────────────────────────────

const INSTRUMENTS_MODULE: LearningModuleDef = {
  slug: "instruments",
  title: "Meet the Instruments",
  shortTitle: "Instruments",
  description: "From strings to percussion — earn points!",
  cardIcon: "🎻",
  cardGradient:
    "from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/20",
  heroEmoji: "🎻",
  units: [
    {
      id: "families",
      number: 1,
      title: "Instrument Families",
      subtitle: "The big picture",
      goal: "I can roughly categorize sound",
      emoji: "🎼",
      gradient: "from-violet-100 to-fuchsia-50 dark:from-violet-900/40",
      lessons: [
        {
          title: "Strings",
          emoji: "🎻",
          gradient: "from-rose-100 to-pink-50",
          body: "Made from strings that vibrate when bowed, plucked, or struck. Warm, expressive, and often the emotional heart of the orchestra.",
          examples: ["Violin", "Viola", "Cello", "Double Bass", "Harp"],
        },
        {
          title: "Woodwinds",
          emoji: "🎷",
          gradient: "from-emerald-100 to-teal-50",
          body: "Sound from vibrating air — through a reed or across an opening. Light, agile, and colorful.",
          examples: ["Flute", "Clarinet", "Oboe", "Bassoon", "Saxophone"],
        },
        {
          title: "Brass",
          emoji: "🎺",
          gradient: "from-amber-100 to-yellow-50",
          body: "Sound is made by buzzing your lips into a mouthpiece. Bold, powerful, and dramatic.",
          examples: ["Trumpet", "French Horn", "Trombone", "Tuba"],
        },
        {
          title: "Percussion",
          emoji: "🥁",
          gradient: "from-sky-100 to-indigo-50",
          body: "Hit, shaken, or scraped to create sound. Provides rhythm, punctuation, and sometimes melody.",
          examples: ["Timpani", "Snare", "Cymbals", "Xylophone", "Triangle"],
        },
      ],
      quiz: [
        {
          question: "Which family does the violin belong to?",
          options: ["Brass", "Strings", "Woodwinds", "Percussion"],
          correctIndex: 1,
          explanation: "The violin is the most iconic string instrument.",
        },
        {
          question: "What family produces sound by buzzing lips?",
          options: ["Woodwinds", "Percussion", "Brass", "Strings"],
          correctIndex: 2,
          explanation: "Brass players buzz their lips against the mouthpiece.",
        },
        {
          question: "Which of these is a woodwind?",
          options: ["Tuba", "Clarinet", "Cello", "Timpani"],
          correctIndex: 1,
          explanation: "The clarinet uses a single reed that vibrates.",
        },
        {
          question: "Which family is the timpani part of?",
          options: ["Percussion", "Strings", "Brass", "Woodwinds"],
          correctIndex: 0,
          explanation: "Timpani are tuned drums — classic percussion.",
        },
      ],
    },
    {
      id: "spotlight",
      number: 2,
      title: "Spotlight Instruments",
      subtitle: "The stars up close",
      goal: "I can recognize common instruments",
      emoji: "⭐",
      gradient: "from-amber-100 to-orange-50 dark:from-amber-900/40",
      lessons: [
        {
          title: "Violin",
          emoji: "🎻",
          gradient: "from-rose-100 to-pink-50",
          body: "The soprano of the orchestra — often carries the melody. Played with a bow (arco) or plucked (pizzicato). Four strings: G–D–A–E.",
          examples: ["Bright & singing", "String family", "4 strings"],
        },
        {
          title: "Flute",
          emoji: "🎶",
          gradient: "from-emerald-100 to-teal-50",
          body: "A woodwind with no reed — sound is made by blowing across a hole. Bright, clear, agile.",
          examples: ["Airy & bright", "Woodwind family", "No reed"],
        },
        {
          title: "Trumpet",
          emoji: "🎺",
          gradient: "from-amber-100 to-yellow-50",
          body: "Three valves let you change pitch. Used in jazz, classical, fanfares, and marching bands.",
          examples: ["Bold & bright", "Brass family", "3 valves"],
        },
        {
          title: "Piano",
          emoji: "🎹",
          gradient: "from-sky-100 to-indigo-50",
          body: "88 keys, each striking tuned strings inside. A whole orchestra in one box.",
          examples: ["88 keys", "Hammers & strings", "Huge range"],
        },
      ],
      quiz: [
        {
          question: "Which instrument is played with a bow?",
          options: ["Flute", "Trumpet", "Violin", "Piano"],
          correctIndex: 2,
          explanation: "The violin is bowed (or plucked).",
        },
        {
          question: "How does a flute make sound?",
          options: [
            "By buzzing the lips",
            "Blowing across an opening",
            "Hammering strings",
            "Using a double reed",
          ],
          correctIndex: 1,
          explanation: "The flute has no reed — sound is from blowing across.",
        },
        {
          question: "How many keys does a standard piano have?",
          options: ["76", "88", "100", "64"],
          correctIndex: 1,
          explanation: "A standard piano has 88 keys — 52 white, 36 black.",
        },
        {
          question: "Which of these is a brass instrument?",
          options: ["Clarinet", "Cello", "Trumpet", "Xylophone"],
          correctIndex: 2,
          explanation: "The trumpet is brass — valves and a buzzing lip.",
        },
      ],
    },
  ],
};

// ─── 2. Classical & Jazz Basics ─────────────────────────────

const BASICS_MODULE: LearningModuleDef = {
  slug: "basics",
  title: "Classical & Jazz Basics",
  shortTitle: "Basics",
  description: "A beginner's guide to both genres",
  cardIcon: "🎹",
  cardGradient:
    "from-violet-100 to-violet-50 dark:from-violet-950/40 dark:to-violet-900/20",
  heroEmoji: "🎼",
  units: [
    {
      id: "what-is",
      number: 1,
      title: "What Are Classical & Jazz?",
      subtitle: "Two great traditions",
      goal: "I can explain each in one sentence",
      emoji: "🎼",
      gradient: "from-violet-100 to-fuchsia-50",
      lessons: [
        {
          title: "Classical Music",
          emoji: "🎻",
          gradient: "from-violet-100 to-purple-50",
          body: "Written-down music from a 1,000-year European tradition. Emphasizes composition, large forms, and exact performance of a score.",
          examples: ["Written scores", "Composers", "Orchestras", "~1000 yrs"],
        },
        {
          title: "Jazz Music",
          emoji: "🎷",
          gradient: "from-amber-100 to-orange-50",
          body: "Born in early-1900s America from African-American musical traditions. Built on improvisation, swing, and rhythmic freedom.",
          examples: ["Improvisation", "Swing feel", "~100 yrs", "USA origin"],
        },
        {
          title: "What They Share",
          emoji: "🤝",
          gradient: "from-emerald-100 to-teal-50",
          body: "Both are sophisticated, virtuosic art forms with deep emotional range. Both use acoustic instruments and reward repeated listening.",
          examples: ["Virtuosity", "Emotion", "Acoustic roots"],
        },
      ],
      quiz: [
        {
          question: "Which tradition is older?",
          options: ["Jazz", "Classical", "They're the same age"],
          correctIndex: 1,
          explanation: "Classical has roots ~1,000 years back; jazz ~100 years.",
        },
        {
          question: "Jazz originated in which country?",
          options: ["Germany", "United States", "France", "Italy"],
          correctIndex: 1,
          explanation:
            "Jazz was born in African-American communities in the USA, especially New Orleans.",
        },
        {
          question: "What's a hallmark of jazz performance?",
          options: [
            "Strict score following",
            "Improvisation",
            "No percussion",
            "Single performer only",
          ],
          correctIndex: 1,
          explanation:
            "Improvisation — spontaneous musical creation — is central to jazz.",
        },
      ],
    },
    {
      id: "key-differences",
      number: 2,
      title: "Key Differences",
      subtitle: "How they feel different",
      goal: "I can tell them apart when listening",
      emoji: "⚖️",
      gradient: "from-sky-100 to-indigo-50",
      lessons: [
        {
          title: "The Score vs. The Moment",
          emoji: "📜",
          gradient: "from-violet-100 to-indigo-50",
          body: "Classical performers aim to faithfully realize a composer's written score. Jazz musicians use a 'lead sheet' as a starting point and invent in real time.",
          examples: ["Classical: faithful", "Jazz: spontaneous"],
        },
        {
          title: "Rhythm & Swing",
          emoji: "🎶",
          gradient: "from-amber-100 to-yellow-50",
          body: "Classical rhythm is typically 'straight'. Jazz has 'swing' — a lopsided, dance-like feel where eighth notes lean long-then-short.",
          examples: ["Straight vs. swing", "Syncopation in jazz"],
        },
        {
          title: "The Ensemble",
          emoji: "👥",
          gradient: "from-emerald-100 to-teal-50",
          body: "Classical often means big ensembles with a conductor. Jazz typically features a small combo (3–7 players) who lead themselves.",
          examples: ["Orchestra (50+)", "Combo (3–7)"],
        },
      ],
      quiz: [
        {
          question: "Which usually has a conductor?",
          options: ["Jazz combo", "Classical orchestra", "Both equally"],
          correctIndex: 1,
          explanation: "Classical orchestras use a conductor to coordinate.",
        },
        {
          question: "What is 'swing' in jazz?",
          options: [
            "A dance move",
            "A lopsided rhythmic feel",
            "A type of instrument",
            "A style of costume",
          ],
          correctIndex: 1,
          explanation:
            "Swing is the characteristic 'long-short' rhythmic feel of jazz.",
        },
        {
          question: "A jazz 'lead sheet' tells the player...",
          options: [
            "Every single note",
            "Just the melody & chords — improvise the rest",
            "How loud to play",
            "Nothing, it's blank",
          ],
          correctIndex: 1,
          explanation:
            "A lead sheet has melody and chord symbols. Everything else is improvised.",
        },
      ],
    },
  ],
};

// ─── 3. Concert Etiquette ───────────────────────────────────

const ETIQUETTE_MODULE: LearningModuleDef = {
  slug: "etiquette",
  title: "Concert Etiquette",
  shortTitle: "Etiquette",
  description: "What to wear, when to clap, and more",
  cardIcon: "🎩",
  cardGradient:
    "from-rose-100 to-rose-50 dark:from-rose-950/40 dark:to-rose-900/20",
  heroEmoji: "🎩",
  units: [
    {
      id: "before",
      number: 1,
      title: "Before the Show",
      subtitle: "Getting ready, arriving",
      goal: "I'll show up relaxed and prepared",
      emoji: "🚪",
      gradient: "from-rose-100 to-pink-50",
      lessons: [
        {
          title: "What to Wear",
          emoji: "👔",
          gradient: "from-rose-100 to-amber-50",
          body: "Anything from smart casual to dressy. Most concerts don't have a dress code — if you're comfortable and not in gym clothes, you're fine.",
          examples: ["Smart casual ✓", "Jeans + nice top ✓", "Gym clothes ✗"],
        },
        {
          title: "When to Arrive",
          emoji: "⏰",
          gradient: "from-sky-100 to-indigo-50",
          body: "15–20 minutes early. Latecomers are often held at the door until a break to avoid disturbing the performance.",
          examples: ["15–20 min early", "Don't be late"],
        },
        {
          title: "Program Notes",
          emoji: "📖",
          gradient: "from-emerald-100 to-teal-50",
          body: "Grab a program (paper or digital). Reading the notes before each piece makes the music much more meaningful.",
          examples: ["Free at the door", "Read before piece", "Keeps you engaged"],
        },
      ],
      quiz: [
        {
          question: "How early should you aim to arrive?",
          options: ["Right on time", "5 minutes early", "15–20 minutes early"],
          correctIndex: 2,
          explanation:
            "15–20 minutes gives you time to find seats, use the restroom, and read the program.",
        },
        {
          question: "What happens if you arrive late?",
          options: [
            "You can slip in any time",
            "Often held at the door until a break",
            "You're refused entry",
          ],
          correctIndex: 1,
          explanation:
            "Most halls hold latecomers until a break so the audience isn't disturbed.",
        },
        {
          question: "Is there a strict dress code?",
          options: [
            "Yes, formalwear only",
            "Usually no — smart casual is fine",
            "You must wear all black",
          ],
          correctIndex: 1,
          explanation:
            "Most concerts today have no strict dress code. Be comfortable and respectful.",
        },
      ],
    },
    {
      id: "during",
      number: 2,
      title: "During the Show",
      subtitle: "Clapping, phones, coughing",
      goal: "I know when to clap (and when not to)",
      emoji: "👏",
      gradient: "from-amber-100 to-orange-50",
      lessons: [
        {
          title: "When to Clap (Classical)",
          emoji: "👏",
          gradient: "from-amber-100 to-yellow-50",
          body: "Wait until the END of the whole piece — not between movements. If unsure, follow the crowd. At opera/ballet you can clap after big arias and dances.",
          examples: ["End of piece ✓", "Between movements ✗", "Follow the crowd"],
        },
        {
          title: "When to Clap (Jazz)",
          emoji: "🎷",
          gradient: "from-rose-100 to-pink-50",
          body: "Jazz is more relaxed. It's common to applaud after solos — and encouraged! The performer will often nod to acknowledge.",
          examples: ["After solos ✓", "During a groove ✓", "More relaxed"],
        },
        {
          title: "Phones & Noise",
          emoji: "🤫",
          gradient: "from-sky-100 to-indigo-50",
          body: "Silence your phone completely (even vibrate can be heard). Cough during breaks if possible. Unwrap cough drops before the music starts.",
          examples: ["Phone silent", "Cough at breaks", "No flash photos"],
        },
      ],
      quiz: [
        {
          question: "At a classical concert, when do you usually clap?",
          options: [
            "After each movement",
            "At the end of the whole piece",
            "Whenever you feel like it",
          ],
          correctIndex: 1,
          explanation:
            "Classical audiences hold applause until the piece is fully done.",
        },
        {
          question: "What's expected at a jazz gig?",
          options: [
            "Total silence throughout",
            "Applauding after solos",
            "No applause at all",
          ],
          correctIndex: 1,
          explanation:
            "Clapping after a good solo is standard — and appreciated!",
        },
        {
          question: "Best phone setting during a concert?",
          options: ["Ring on", "Vibrate", "Silent / Off"],
          correctIndex: 2,
          explanation:
            "Even vibrate can rattle on a seat. Fully silent or airplane mode is best.",
        },
      ],
    },
  ],
};

// ─── 4. Legendary Composers & Artists ───────────────────────

const LEGENDS_MODULE: LearningModuleDef = {
  slug: "legends",
  title: "Legendary Composers & Artists",
  shortTitle: "Legends",
  description: "Bach, Beethoven, Miles, Coltrane, and more",
  cardIcon: "🎼",
  cardGradient:
    "from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-900/20",
  heroEmoji: "👑",
  units: [
    {
      id: "classical-giants",
      number: 1,
      title: "Classical Giants",
      subtitle: "Bach to Beethoven and beyond",
      goal: "I can name a few essential composers",
      emoji: "👑",
      gradient: "from-emerald-100 to-teal-50",
      lessons: [
        {
          title: "Bach (1685–1750)",
          emoji: "🎹",
          gradient: "from-amber-100 to-yellow-50",
          body: "Master of counterpoint — weaving multiple melodies together. Baroque era. His music sounds like musical mathematics, beautiful and logical.",
          examples: ["Brandenburg Concertos", "Mass in B minor", "Baroque"],
        },
        {
          title: "Mozart (1756–1791)",
          emoji: "🎻",
          gradient: "from-rose-100 to-pink-50",
          body: "Child prodigy who composed effortless, elegant music. Classical era. Operas, symphonies, concertos — all sparkle with melody.",
          examples: ["The Magic Flute", "Requiem", "Classical era"],
        },
        {
          title: "Beethoven (1770–1827)",
          emoji: "🎼",
          gradient: "from-violet-100 to-indigo-50",
          body: "Broke the rules and expanded music's emotional scale. Bridged Classical → Romantic eras. Wrote some of the greatest symphonies ever — despite going deaf.",
          examples: ["9 Symphonies", "Fidelio", "Went deaf"],
        },
      ],
      quiz: [
        {
          question: "Who is known as the 'master of counterpoint'?",
          options: ["Mozart", "Bach", "Beethoven"],
          correctIndex: 1,
          explanation:
            "Bach's music is built on weaving independent melodies together (counterpoint).",
        },
        {
          question: "Which composer famously went deaf?",
          options: ["Bach", "Mozart", "Beethoven"],
          correctIndex: 2,
          explanation:
            "Beethoven kept composing through increasing deafness — remarkable.",
        },
        {
          question: "Which composer wrote 'The Magic Flute'?",
          options: ["Mozart", "Bach", "Beethoven"],
          correctIndex: 0,
          explanation:
            "Mozart's late opera, written in the final year of his life.",
        },
      ],
    },
    {
      id: "jazz-legends",
      number: 2,
      title: "Jazz Legends",
      subtitle: "The shapers of a genre",
      goal: "I can name the key jazz innovators",
      emoji: "🎷",
      gradient: "from-amber-100 to-orange-50",
      lessons: [
        {
          title: "Louis Armstrong (1901–1971)",
          emoji: "🎺",
          gradient: "from-amber-100 to-yellow-50",
          body: "The father of jazz soloing. Turned jazz from collective group music into a soloist's art. Unmistakable voice & trumpet.",
          examples: ["'What a Wonderful World'", "Hot Five & Seven", "Trumpet"],
        },
        {
          title: "Duke Ellington (1899–1974)",
          emoji: "🎹",
          gradient: "from-violet-100 to-indigo-50",
          body: "Bandleader, pianist, composer. Wrote for specific players in his big band, creating distinctive ensemble color.",
          examples: ["'Take the A Train'", "Big band king", "Pianist"],
        },
        {
          title: "Miles Davis (1926–1991)",
          emoji: "🎺",
          gradient: "from-sky-100 to-indigo-50",
          body: "Constantly reinvented jazz — from bebop to cool, modal, and fusion. 'Kind of Blue' is the best-selling jazz album ever.",
          examples: ["'Kind of Blue'", "5+ major styles", "Cool trumpet"],
        },
        {
          title: "John Coltrane (1926–1967)",
          emoji: "🎷",
          gradient: "from-rose-100 to-pink-50",
          body: "Saxophonist of breathtaking intensity. Pushed harmony and spirituality to new limits. 'A Love Supreme' is a landmark.",
          examples: ["'A Love Supreme'", "Tenor & soprano sax", "Intense"],
        },
      ],
      quiz: [
        {
          question: "Who wrote 'Take the A Train'?",
          options: ["Louis Armstrong", "Duke Ellington", "Miles Davis"],
          correctIndex: 1,
          explanation:
            "It's the signature song of Duke Ellington's big band (by Billy Strayhorn, written for Duke).",
        },
        {
          question: "Which album is the best-selling jazz album ever?",
          options: [
            "'A Love Supreme' (Coltrane)",
            "'Kind of Blue' (Davis)",
            "'Hot Five' (Armstrong)",
          ],
          correctIndex: 1,
          explanation:
            "Miles Davis's 'Kind of Blue' (1959) is the #1 best-seller.",
        },
        {
          question: "John Coltrane primarily played...",
          options: ["Trumpet", "Piano", "Saxophone"],
          correctIndex: 2,
          explanation: "Coltrane was a master of tenor and soprano saxophone.",
        },
      ],
    },
  ],
};

// ─── 5. Types of Performances ───────────────────────────────

const PERFORMANCES_MODULE: LearningModuleDef = {
  slug: "performances",
  title: "Types of Performances",
  shortTitle: "Performances",
  description: "Orchestra, opera, chamber, ballet, and more",
  cardIcon: "🎭",
  cardGradient: "from-sky-100 to-sky-50 dark:from-sky-950/40 dark:to-sky-900/20",
  heroEmoji: "🎭",
  units: [
    {
      id: "classical-formats",
      number: 1,
      title: "Classical Formats",
      subtitle: "Big to small",
      goal: "I know what kind of concert I'm attending",
      emoji: "🎭",
      gradient: "from-sky-100 to-indigo-50",
      lessons: [
        {
          title: "Orchestra / Symphony",
          emoji: "🎻",
          gradient: "from-sky-100 to-blue-50",
          body: "50–100+ musicians playing together under a conductor. Programs usually have 2–3 substantial pieces. The 'big one' in classical.",
          examples: ["50–100+ players", "Conductor", "2–3 pieces"],
        },
        {
          title: "Chamber Music",
          emoji: "🎶",
          gradient: "from-violet-100 to-purple-50",
          body: "Small groups — 2 to ~8 players, one per part, no conductor. Intimate, conversational. String quartet is the classic setup.",
          examples: ["2–8 players", "No conductor", "Intimate"],
        },
        {
          title: "Opera",
          emoji: "🎭",
          gradient: "from-rose-100 to-pink-50",
          body: "Drama told through singing. Sets, costumes, an orchestra in the pit. Subtitles (supertitles) show the translation.",
          examples: ["Sung drama", "Sets & costumes", "Subtitles"],
        },
        {
          title: "Ballet",
          emoji: "🩰",
          gradient: "from-amber-100 to-yellow-50",
          body: "Dance set to an orchestral score, telling a story through movement. Dancers + live orchestra (in the pit).",
          examples: ["Dance + music", "Pit orchestra", "Storytelling"],
        },
      ],
      quiz: [
        {
          question: "A string quartet is an example of...",
          options: ["Opera", "Chamber music", "Symphony"],
          correctIndex: 1,
          explanation: "Four string players — the classic chamber setup.",
        },
        {
          question: "Who typically has a conductor?",
          options: ["Chamber group", "Symphony orchestra", "Solo recital"],
          correctIndex: 1,
          explanation: "Symphony orchestras use a conductor to coordinate.",
        },
        {
          question: "At the opera, what do supertitles do?",
          options: [
            "Show translations of lyrics",
            "List the performers",
            "Announce intermission",
          ],
          correctIndex: 0,
          explanation:
            "Supertitles are projected translations so you follow the story.",
        },
      ],
    },
    {
      id: "jazz-formats",
      number: 2,
      title: "Jazz Formats",
      subtitle: "Combos, big bands, and more",
      goal: "I know the jazz settings",
      emoji: "🎷",
      gradient: "from-amber-100 to-orange-50",
      lessons: [
        {
          title: "Jazz Combo",
          emoji: "🎸",
          gradient: "from-amber-100 to-yellow-50",
          body: "3–7 players: usually a rhythm section (piano/guitar, bass, drums) + 1–3 horn soloists. The typical jazz club lineup.",
          examples: ["3–7 players", "Rhythm + horns", "Club setting"],
        },
        {
          title: "Big Band",
          emoji: "🎺",
          gradient: "from-rose-100 to-pink-50",
          body: "16–18 players in brass, saxes, and rhythm sections. Sophisticated written arrangements with space for solos. Swing-era classic.",
          examples: ["~17 players", "Written arrangements", "Ellington/Basie"],
        },
        {
          title: "Jam Session",
          emoji: "🎤",
          gradient: "from-emerald-100 to-teal-50",
          body: "Informal gathering where musicians drop in and play together on jazz standards. Stakes are low, creativity is high.",
          examples: ["Drop-in", "Standards", "Casual"],
        },
      ],
      quiz: [
        {
          question: "How many players in a typical jazz combo?",
          options: ["3–7", "16–18", "50+"],
          correctIndex: 0,
          explanation: "A combo is small — usually 3 to 7 musicians.",
        },
        {
          question: "A big band has roughly...",
          options: ["5 players", "17 players", "80 players"],
          correctIndex: 1,
          explanation:
            "Classic big bands have ~17: brass, saxes, and a rhythm section.",
        },
        {
          question: "What is a 'jam session'?",
          options: [
            "A strict rehearsal",
            "An informal drop-in play",
            "A ballet class",
          ],
          correctIndex: 1,
          explanation:
            "Jam sessions are casual gatherings where musicians play standards together.",
        },
      ],
    },
  ],
};

// ─── 6. How to Listen ───────────────────────────────────────

const LISTENING_MODULE: LearningModuleDef = {
  slug: "listening",
  title: "How to Listen",
  shortTitle: "Listening",
  description: "Get more out of every performance",
  cardIcon: "🎧",
  cardGradient:
    "from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-orange-900/20",
  heroEmoji: "🎧",
  units: [
    {
      id: "active-listening",
      number: 1,
      title: "Active Listening",
      subtitle: "Hearing what's really there",
      goal: "I listen instead of just hearing",
      emoji: "👂",
      gradient: "from-orange-100 to-amber-50",
      lessons: [
        {
          title: "Pay Attention to One Thing",
          emoji: "🎯",
          gradient: "from-amber-100 to-yellow-50",
          body: "Pick one layer — the melody, the bass, the drums — and follow it for a minute. Then switch. This trains your ear to hear detail.",
          examples: ["One layer at a time", "Switch layers", "Builds your ear"],
        },
        {
          title: "Notice Repetition",
          emoji: "🔁",
          gradient: "from-violet-100 to-fuchsia-50",
          body: "Most music repeats themes with variations. Spotting when something comes back (and how it's changed) is a huge part of the enjoyment.",
          examples: ["Themes return", "Variations", "Form builds meaning"],
        },
        {
          title: "Feel the Pulse",
          emoji: "💓",
          gradient: "from-rose-100 to-pink-50",
          body: "Tap your foot — gently, in your shoe. Feeling the pulse anchors you in the music so faster and slower passages feel meaningful.",
          examples: ["Tap gently", "Feel the beat", "Anchors you"],
        },
      ],
      quiz: [
        {
          question: "What's 'active listening'?",
          options: [
            "Playing music in the background",
            "Focusing attention on what you hear",
            "Dancing along",
          ],
          correctIndex: 1,
          explanation:
            "Active listening means actively paying attention to details.",
        },
        {
          question: "Why notice repetition?",
          options: [
            "It means the composer ran out of ideas",
            "Returning themes (often varied) are a huge part of musical meaning",
            "Repetition is always bad",
          ],
          correctIndex: 1,
          explanation:
            "Repetition & variation shape the whole form and emotional arc.",
        },
        {
          question: "A good way to feel pulse at a concert is...",
          options: [
            "Stomp loudly",
            "Tap foot gently in shoe",
            "Count aloud",
          ],
          correctIndex: 1,
          explanation:
            "A quiet tap keeps you anchored without disturbing others.",
        },
      ],
    },
    {
      id: "follow-the-music",
      number: 2,
      title: "Following the Music",
      subtitle: "Map + texture + emotion",
      goal: "I can follow the structure of a piece",
      emoji: "🗺️",
      gradient: "from-sky-100 to-indigo-50",
      lessons: [
        {
          title: "Three Core Layers",
          emoji: "🥞",
          gradient: "from-emerald-100 to-teal-50",
          body: "Melody (what you hum), harmony (the chords underneath), and rhythm (the pulse & pattern). Every piece has all three.",
          examples: ["Melody", "Harmony", "Rhythm"],
        },
        {
          title: "Follow the Dynamics",
          emoji: "📈",
          gradient: "from-amber-100 to-yellow-50",
          body: "Dynamics = loudness. Pay attention to how music grows (crescendo) and shrinks (diminuendo). These shape emotion.",
          examples: ["Loud ↔ soft", "Builds tension", "Releases"],
        },
        {
          title: "Notice Emotion",
          emoji: "❤️",
          gradient: "from-rose-100 to-pink-50",
          body: "After listening, ask yourself: what did I feel? Joy? Sadness? Tension? Calm? There are no wrong answers — music is an emotional language.",
          examples: ["Ask yourself", "No wrong answers", "Emotional language"],
        },
      ],
      quiz: [
        {
          question: "Which is NOT one of the three core layers?",
          options: ["Melody", "Harmony", "Lighting", "Rhythm"],
          correctIndex: 2,
          explanation: "The three are melody, harmony, rhythm.",
        },
        {
          question: "What's a 'crescendo'?",
          options: ["Getting louder", "Getting softer", "Stopping"],
          correctIndex: 0,
          explanation: "Crescendo = getting louder. Diminuendo = getting softer.",
        },
        {
          question: "After a piece, a good question to ask yourself is...",
          options: [
            "'What did I feel?'",
            "'Was it correct?'",
            "'How many notes?'",
          ],
          correctIndex: 0,
          explanation:
            "Music is emotional — reflecting on what you felt deepens the experience.",
        },
      ],
    },
  ],
};

// ─── Registry ───────────────────────────────────────────────

export const MODULES: LearningModuleDef[] = [
  INSTRUMENTS_MODULE,
  BASICS_MODULE,
  ETIQUETTE_MODULE,
  LEGENDS_MODULE,
  PERFORMANCES_MODULE,
  LISTENING_MODULE,
];

export function getModule(slug: string): LearningModuleDef | undefined {
  return MODULES.find((m) => m.slug === slug);
}
