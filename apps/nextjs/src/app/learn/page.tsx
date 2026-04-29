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

      <Link href="/chat?mode=discovery" className="group mt-8 block">
        <div className="bg-card relative overflow-hidden rounded-2xl border p-3.5 transition-all group-hover:shadow-md">
          <div className="relative flex items-center gap-3">
            <div className="relative grid size-[4.25rem] shrink-0 place-items-center rounded-full bg-[#F5E6DC] dark:bg-rose-950/30">
              <Image
                src="/ton-ton-cat-cutout.png"
                alt="Ton Ton the cat"
                width={68}
                height={68}
                className="h-full w-full object-contain object-bottom"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Have a question?</p>
              <p className="text-muted-foreground text-xs">
                Ask Ton Ton anything about classical or jazz music
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground shrink-0"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
