"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

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
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="bg-muted size-8 animate-pulse rounded-full" />
        <p className="text-muted-foreground text-sm">Loading your clips…</p>
      </div>
    );
  }

  if (clipsQuery.isError || !clipsQuery.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
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

  if (saveReactions.isPending) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="bg-muted size-8 animate-pulse rounded-full" />
        <p className="text-muted-foreground text-sm">Saving your reactions…</p>
      </div>
    );
  }

  if (!currentClip) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Button onClick={onSkipPhase}>Build my profile</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="w-20" />
        <ProgressPips total={total} currentIndex={index} />
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkipPhase}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip the rest
        </Button>
      </header>

      <main
        key={currentClip.id}
        className="animate-in fade-in slide-in-from-bottom-2 flex flex-1 items-center justify-center overflow-y-auto px-6 py-8 duration-300"
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
    </div>
  );
}
