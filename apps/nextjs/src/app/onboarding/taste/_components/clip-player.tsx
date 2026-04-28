"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

import type { ClipReactionDraft } from "./clips-phase";

interface ClipPlayerProps {
  clip: {
    id: string;
    composer: string;
    title: string;
    file: string;
  };
  /** 1-based for display; passed in from the parent. */
  index: number;
  total: number;
  /**
   * The user has chosen to move on. The reaction we computed gets
   * folded into the parent's draft list. `next` advances the index;
   * the parent decides whether that means the next clip or finishing.
   */
  onAdvance: (reaction: ClipReactionDraft) => void;
  /** True only on the very first clip — gates audio playback behind a tap. */
  requiresFirstTap: boolean;
  onFirstTapConsumed: () => void;
}

/**
 * One clip, fully self-contained. Owns its own audio element and
 * timing state. We deliberately don't show era/mood — the spec calls
 * this out as bias-prevention.
 *
 * Reaction is captured from a 3-button tap row (love/ok/not for me),
 * not from voice or text input. Mic-based reactions were in the spec
 * but add infra cost without obvious lift over an explicit tap.
 */
export function ClipPlayer({
  clip,
  index,
  total,
  onAdvance,
  requiresFirstTap,
  onFirstTapConsumed,
}: ClipPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(!requiresFirstTap);
  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [reaction, setReaction] = useState<ClipReactionDraft["reaction"]>(null);
  const visualizerHeights = useMemo(
    () =>
      Array.from(
        { length: 9 },
        (_, i) => `${20 + Math.sin((i + 1) * 0.7) * 30 + (i % 3) * 6}px`,
      ),
    [],
  );

  // Auto-play when `hasStarted` flips true (first tap consumed) and
  // for every clip after the first.
  useEffect(() => {
    if (!hasStarted) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        // Browser autoplay policy can still block; surface play UI.
        setIsPlaying(false);
      });
  }, [hasStarted, clip.id]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgressMs(audio.currentTime * 1000);
    if (!Number.isNaN(audio.duration) && audio.duration > 0) {
      setDurationMs(audio.duration * 1000);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setReachedEnd(true);
  };

  const handleFirstTap = () => {
    onFirstTapConsumed();
    setHasStarted(true);
  };

  const handlePauseToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleReplay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setReplayCount((c) => c + 1);
    setReachedEnd(false);
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const buildReaction = (skipped: boolean): ClipReactionDraft => ({
    clipId: clip.id,
    listenedMs: Math.max(0, Math.round(progressMs)),
    clipDurationMs: Math.max(0, Math.round(durationMs)),
    skipped,
    replayed: replayCount > 0,
    reaction,
  });

  const handleSkip = () => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    onAdvance(buildReaction(true));
  };

  const handleNext = () => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    // If they pressed "next" before the natural end, treat it as a
    // soft skip — listenedMs records how much they actually heard.
    onAdvance(buildReaction(!reachedEnd));
  };

  const progressPct =
    durationMs > 0 ? Math.min(100, (progressMs / durationMs) * 100) : 0;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <audio
        ref={audioRef}
        src={clip.file}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleEnded}
      />

      <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        Clip {index} of {total}
      </div>

      {/* Pulsing visualizer — purely decorative; gives the user
          something to look at while listening so they don't feel like
          they're staring at a static screen. */}
      <Visualizer playing={isPlaying} visualizerHeights={visualizerHeights} />

      {/* Title + composer are intentionally hidden in v1 — labels in
          the catalog are not yet trusted, and the spec actually
          prefers blind listening so the user reacts to the music
          rather than the brand. */}
      <div className="space-y-1.5 px-2 text-center">
        <h2 className="text-lg font-semibold text-balance sm:text-xl">
          What does this make you feel?
        </h2>
        <p className="text-muted-foreground text-sm">
          Listen with fresh ears
        </p>
      </div>

      <div className="w-full max-w-xs">
        <div className="bg-muted relative h-1.5 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-200 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-muted-foreground mt-1 flex justify-between font-mono text-[11px]">
          <span>{formatTime(progressMs)}</span>
          <span>{formatTime(durationMs)}</span>
        </div>
      </div>

      {requiresFirstTap && !hasStarted ? (
        <div className="flex flex-col items-center gap-3">
          <Button onClick={handleFirstTap} size="lg">
            <PlayIcon /> Start listening
          </Button>
          <p className="text-muted-foreground text-xs">
            We'll auto-play the rest. Tap any clip to pause.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePauseToggle}
              className="hover:bg-muted grid size-12 place-items-center rounded-full border transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              onClick={handleReplay}
              className="hover:bg-muted grid size-10 place-items-center rounded-full border text-xs transition-colors"
              aria-label="Replay"
            >
              <ReplayIcon />
            </button>
          </div>

          <ReactionRow value={reaction} onChange={setReaction} />

          <div className="flex w-full items-center justify-between gap-3 pt-2">
            <Button variant="ghost" onClick={handleSkip} type="button">
              Skip
            </Button>
            <Button onClick={handleNext} type="button">
              {index === total ? "Finish" : "Next clip"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ReactionRow({
  value,
  onChange,
}: {
  value: ClipReactionDraft["reaction"];
  onChange: (next: ClipReactionDraft["reaction"]) => void;
}) {
  const buttons: {
    key: NonNullable<ClipReactionDraft["reaction"]>;
    label: string;
    activeClass: string;
  }[] = [
    {
      key: "love",
      label: "Love it",
      activeClass:
        "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      key: "ok",
      label: "It's okay",
      activeClass:
        "border-neutral-400 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    },
    {
      key: "not_for_me",
      label: "Not for me",
      activeClass:
        "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-muted-foreground text-xs">
        Optional — how does this land?
      </p>
      <div className="flex gap-2">
        {buttons.map((b) => {
          const selected = value === b.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => onChange(selected ? null : b.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                selected
                  ? b.activeClass
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400",
              )}
            >
              {b.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Visualizer({
  playing,
  visualizerHeights,
}: {
  playing: boolean;
  visualizerHeights: string[];
}) {
  return (
    <div className="flex h-20 items-end gap-1.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 rounded-full bg-emerald-500/70 transition-all",
            playing ? "animate-pulse" : "",
          )}
          style={{
            height: playing ? visualizerHeights[i] : "8px",
            animationDelay: `${i * 90}ms`,
            animationDuration: "900ms",
          }}
        />
      ))}
    </div>
  );
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}
function ReplayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}
