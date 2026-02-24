import Link from "next/link";

const TOPICS = [
  {
    title: "What is Classical Music?",
    description: "A beginner's guide to the art form",
    href: "/chat?mode=learning",
    prompt: "What exactly is classical music? Give me a beginner-friendly overview.",
    color: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
  },
  {
    title: "Concert Etiquette",
    description: "What to wear, when to clap, and more",
    href: "/chat?mode=learning",
    prompt: "What's the etiquette for attending a classical music concert?",
    color: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
  },
  {
    title: "Meet the Instruments",
    description: "From violins to tubas — the orchestra explained",
    href: "/chat?mode=learning",
    prompt: "Tell me about the different sections and instruments in an orchestra.",
    color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  },
  {
    title: "Famous Composers",
    description: "Bach, Mozart, Beethoven, and beyond",
    href: "/chat?mode=learning",
    prompt: "Who are the most famous classical composers I should know about?",
    color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  },
  {
    title: "Types of Performances",
    description: "Orchestra, opera, chamber music, ballet",
    href: "/chat?mode=learning",
    prompt: "What are the different types of classical music performances?",
    color: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800",
  },
  {
    title: "How to Listen",
    description: "Tips for getting more out of a performance",
    href: "/chat?mode=learning",
    prompt: "How should I listen to classical music to get the most out of it?",
    color: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
  },
] as const;

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Learn</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Classical music, explained in plain language
      </p>

      <div className="flex flex-col gap-3">
        {TOPICS.map((topic) => (
          <Link key={topic.title} href={`${topic.href}&q=${encodeURIComponent(topic.prompt)}`}>
            <div
              className={`rounded-xl border p-4 transition-colors active:opacity-80 ${topic.color}`}
            >
              <h3 className="font-semibold">{topic.title}</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {topic.description}
              </p>
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
