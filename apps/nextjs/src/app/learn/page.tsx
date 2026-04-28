import Image from "next/image";
import Link from "next/link";

import { ModuleCard } from "./_components/module-card";
import { MODULES } from "./_lib/modules";

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Learn</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Bite-sized modules & quizzes — earn points as you go
      </p>

      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((module) => (
          <ModuleCard key={module.slug} module={module} />
        ))}
      </div>

      <div className="mt-8 rounded-xl border p-4 text-center">
        <div className="mb-2 flex justify-center">
          <Image
            src="/tanny-cat-cutout.png"
            alt="Tanny the cat"
            width={52}
            height={52}
            className="object-contain"
          />
        </div>
        <p className="text-sm font-semibold">Have a question?</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Ask Tanny anything about classical or jazz music
        </p>
        <Link
          href="/chat?mode=learning"
          className="text-primary mt-3 inline-block text-sm font-medium"
        >
          Ask Tanny →
        </Link>
      </div>
    </div>
  );
}
