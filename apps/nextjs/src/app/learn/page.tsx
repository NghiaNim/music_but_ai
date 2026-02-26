import Link from "next/link";

const TOPICS = [
  {
    title: "What is Classical Music?",
    description: "A beginner's guide to the art form",
    href: "/chat?mode=learning",
    prompt:
      "What exactly is classical music? Give me a beginner-friendly overview.",
    gradient:
      "from-violet-100 to-violet-50 dark:from-violet-950/40 dark:to-violet-900/20",
    icon: "🎹",
  },
  {
    title: "Concert Etiquette",
    description: "What to wear, when to clap, and more",
    href: "/chat?mode=learning",
    prompt: "What's the etiquette for attending a classical music concert?",
    gradient:
      "from-rose-100 to-rose-50 dark:from-rose-950/40 dark:to-rose-900/20",
    icon: "🎩",
  },
  {
    title: "Meet the Instruments",
    description: "From violins to tubas — the orchestra explained",
    href: "/chat?mode=learning",
    prompt:
      "Tell me about the different sections and instruments in an orchestra.",
    gradient:
      "from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/20",
    icon: "🎻",
  },
  {
    title: "Famous Composers",
    description: "Bach, Mozart, Beethoven, and beyond",
    href: "/chat?mode=learning",
    prompt: "Who are the most famous classical composers I should know about?",
    gradient:
      "from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-900/20",
    icon: "🎼",
  },
  {
    title: "Types of Performances",
    description: "Orchestra, opera, chamber music, ballet",
    href: "/chat?mode=learning",
    prompt: "What are the different types of classical music performances?",
    gradient: "from-sky-100 to-sky-50 dark:from-sky-950/40 dark:to-sky-900/20",
    icon: "🎭",
  },
  {
    title: "How to Listen",
    description: "Tips for getting more out of a performance",
    href: "/chat?mode=learning",
    prompt: "How should I listen to classical music to get the most out of it?",
    gradient:
      "from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-orange-900/20",
    icon: "🎧",
  },
] as const;

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Learn</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Classical music, explained in plain language
      </p>

      <div className="grid grid-cols-2 gap-3">
        {TOPICS.map((topic) => (
          <Link
            key={topic.title}
            href={`${topic.href}&q=${encodeURIComponent(topic.prompt)}`}
          >
            <div className="bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-transform active:scale-[0.98]">
              <div
                className={`flex aspect-4/3 items-center justify-center bg-linear-to-br ${topic.gradient}`}
              >
                <span className="text-5xl">{topic.icon}</span>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h3 className="text-sm leading-tight font-semibold">
                  {topic.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs leading-snug">
                  {topic.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border p-4 text-center">
        <p className="text-sm font-semibold">Have a question?</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Ask the AI Mentor anything about classical music
        </p>
        <Link
          href="/chat?mode=learning"
          className="text-primary mt-3 inline-block text-sm font-medium"
        >
          Open AI Mentor →
        </Link>
      </div>
    </div>
  );
}
