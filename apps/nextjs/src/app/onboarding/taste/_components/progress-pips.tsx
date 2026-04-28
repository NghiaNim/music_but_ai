import { cn } from "@acme/ui";

interface ProgressPipsProps {
  total: number;
  /** Zero-based index of the question currently on screen. */
  currentIndex: number;
}

export function ProgressPips({ total, currentIndex }: ProgressPipsProps) {
  return (
    <div
      className="flex items-center justify-center gap-1.5"
      aria-label={`Question ${currentIndex + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const state =
          i < currentIndex
            ? "done"
            : i === currentIndex
              ? "current"
              : "upcoming";
        return (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              state === "done" && "w-6 bg-emerald-500/80",
              state === "current" && "w-10 bg-emerald-500",
              state === "upcoming" && "bg-muted w-6",
            )}
          />
        );
      })}
    </div>
  );
}
