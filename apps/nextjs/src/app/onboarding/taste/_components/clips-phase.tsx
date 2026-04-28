"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { cn } from "@acme/ui";
import { useTRPC } from "~/trpc/react";
import { ClipPlayer } from "./clip-player";
import { ProgressPips } from "./progress-pips";

/** Wire shape we collect per clip; flushed to the server in one go. */
export interface ClipReactionDraft {
  clipId: string;
  listenedMs: number;
  clipDurationMs: number;
  skipped: boolean;
  replayed: boolean;
  reaction: "love" | "ok" | "not_for_me" | null;
}

interface ClipsPhaseProps {
  sessionId: string;
  /** Called once all 10 reactions have been persisted server-side. */
  onComplete: () => void;
  /** Lets users bail to derivation early if they're done. */
  onSkipPhase: () => void;
}

export function ClipsPhase({
  sessionId,
  onComplete,
  onSkipPhase,
}: ClipsPhaseProps) {
  const trpc = useTRPC();

  const clipsQuery = useQuery(
    trpc.onboarding.getClips.queryOptions({ sessionId }),
  );
  const saveReactions = useMutation(
    trpc.onboarding.saveClipReactions.mutationOptions(),
  );

  const [index, setIndex] = useState(0);
  const [reactions, setReactions] = useState<ClipReactionDraft[]>([]);
  const [firstTapConsumed, setFirstTapConsumed] = useState(false);

  if (clipsQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="bg-muted size-8 animate-pulse rounded-full" />
        <p className="text-muted-foreground text-sm">Loading your clips…</p>
      </div>
    );
  }

  if (clipsQuery.isError || !clipsQuery.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">
          We couldn't load your clips. You can still finish onboarding.
        </p>
        <Button onClick={onSkipPhase}>Skip clips & build profile</Button>
      </div>
    );
  }

  const clips = clipsQuery.data.clips;
  const total = clips.length;
  const currentClip = clips[index];

  const finalize = async (allReactions: ClipReactionDraft[]) => {
    try {
      await saveReactions.mutateAsync({
        sessionId,
        reactions: allReactions,
      });
      onComplete();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "We couldn't save your clip reactions — let's try again.",
      );
    }
  };

  const handleAdvance = (reaction: ClipReactionDraft) => {
    const next = [...reactions, reaction];
    setReactions(next);

    if (index + 1 >= total) {
      void finalize(next);
      return;
    }
    setIndex(index + 1);
  };

  const handleBack = () => {
    if (index === 0 || saveReactions.isPending) return;
    setIndex((i) => i - 1);
    setReactions((r) => r.slice(0, -1));
  };

  if (saveReactions.isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="bg-muted size-8 animate-pulse rounded-full" />
        <p className="text-muted-foreground text-sm">Saving your reactions…</p>
      </div>
    );
  }

  if (!currentClip) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Button onClick={onSkipPhase}>Build my profile</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* pr-14 reserves room for the floating "Save & exit" X
          button that lives on the page wrapper. */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-3 pr-14 pl-3">
        <div className="flex min-w-0 items-center justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={index === 0 || saveReactions.isPending}
            className={cn(
              "shrink-0 transition-opacity",
              index === 0 && "pointer-events-none opacity-0",
            )}
            aria-label="Previous clip"
          >
            <BackArrow />
            <span>Back</span>
          </Button>
        </div>
        <div className="flex shrink-0 justify-center">
          <ProgressPips total={total} currentIndex={index} />
        </div>
        <span className="shrink-0" aria-hidden />
      </header>

      <main
        key={currentClip.id}
        className="animate-in fade-in slide-in-from-bottom-2 flex min-h-0 flex-1 flex-col items-start justify-center px-4 py-6 duration-300 sm:items-center sm:px-6 sm:py-8"
      >
        <ClipPlayer
          clip={currentClip}
          index={index + 1}
          total={total}
          onAdvance={handleAdvance}
          requiresFirstTap={index === 0 && !firstTapConsumed}
          onFirstTapConsumed={() => setFirstTapConsumed(true)}
        />
      </main>

      <footer className="shrink-0 bg-[#FEFCED] px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] dark:bg-neutral-950">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkipPhase}
          className="text-muted-foreground hover:text-foreground h-auto w-full py-2 text-xs"
        >
          Skip the rest
        </Button>
      </footer>
    </div>
  );
}

function BackArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
