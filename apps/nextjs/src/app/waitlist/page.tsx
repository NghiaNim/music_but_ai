import Link from "next/link";

import { WaitlistForm } from "./_components/waitlist-form";

export default function WaitlistPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-amber-50/70 via-rose-50/35 to-violet-50/35">
      <BackgroundOrbs />
      <FloatingNotes />

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center px-6 py-5">
          <Link
            href="/landingpage"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-full border bg-white/90 shadow-sm">
              <MusicNoteIcon />
            </span>
            <span>Classica</span>
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-balance text-gray-900">
                Join the waitlist
              </h1>
              <p className="mt-3 text-base leading-7 text-gray-500">
                Be first to discover concerts matched to your taste, guided by
                Ton Ton.
              </p>
              <p className="mx-auto mt-4 max-w-xs text-sm italic text-amber-700/80">
                "Big feelings? I know a symphony for that."
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[2rem] bg-linear-to-br from-amber-200/40 via-rose-200/25 to-violet-200/35 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(214,143,92,0.12)] backdrop-blur sm:p-8">
                <div className="absolute -top-6 -right-4 h-20 w-20 rounded-full bg-amber-200/60 blur-2xl" />
                <div className="absolute right-8 bottom-10 h-16 w-16 rounded-full bg-rose-200/60 blur-2xl" />
                <WaitlistForm />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 text-center text-sm">
              {[
                { value: "Free", label: "Always free to join" },
                { value: "2 min", label: "Taste profile setup" },
                { value: "Ton Ton", label: "Your personal guide" },
              ].map(({ value, label }) => (
                <div
                  key={value}
                  className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 shadow-sm backdrop-blur"
                >
                  <p className="font-semibold text-gray-900">{value}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute top-12 left-[6%] h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="absolute top-32 right-[10%] h-44 w-44 rounded-full bg-rose-200/25 blur-3xl" />
      <div className="absolute bottom-20 left-[20%] h-48 w-48 rounded-full bg-violet-200/22 blur-3xl" />
      <div className="absolute right-[8%] bottom-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
    </div>
  );
}

function FloatingNotes() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute top-24 left-[14%] -rotate-12"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="#F6A6B4"
        opacity="0.75"
      >
        <rect x="11" y="3" width="2" height="13" />
        <path d="M13 3 Q19 5 19 10 Q19 7 13 7 Z" />
        <ellipse cx="9" cy="17" rx="4" ry="3" />
      </svg>
      <svg
        className="absolute top-20 right-[20%] rotate-8"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="#F5BF47"
        opacity="0.72"
      >
        <rect x="5.3" y="6" width="1.4" height="13" />
        <rect x="17.3" y="4" width="1.4" height="13" />
        <path d="M5 4.5 L19 2.5 L19 5 L5 7 Z" />
        <ellipse cx="4" cy="19" rx="3.2" ry="2.3" />
        <ellipse cx="16" cy="17" rx="3.2" ry="2.3" />
      </svg>
      <svg
        className="absolute top-48 left-[58%] rotate-12"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="#F7B17A"
        opacity="0.68"
      >
        <rect x="11" y="3" width="2" height="13" />
        <path d="M13 3 Q19 5 19 10 Q19 7 13 7 Z" />
        <ellipse cx="9" cy="17" rx="4" ry="3" />
      </svg>
      <svg
        className="absolute top-16 left-[10%] rotate-12 text-amber-400/40"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.5l-1.9-5.7L4.5 9.9 10.1 8z" />
      </svg>
      <svg
        className="absolute top-40 right-[14%] -rotate-6 text-rose-400/35"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.5l-1.9-5.7L4.5 9.9 10.1 8z" />
      </svg>
      <svg
        className="absolute right-[26%] bottom-32 rotate-6 text-violet-400/32"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.5l-1.9-5.7L4.5 9.9 10.1 8z" />
      </svg>
    </div>
  );
}

function MusicNoteIcon() {
  return (
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
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
