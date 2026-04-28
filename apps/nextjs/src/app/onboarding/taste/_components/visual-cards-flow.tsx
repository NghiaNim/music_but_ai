"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { VisualAnswers } from "@acme/validators";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";
import { ClipsPhase } from "./clips-phase";
import { MinimalReveal } from "./minimal-reveal";
import { ProgressPips } from "./progress-pips";
import { QuestionCard } from "./question-card";
import { QUESTIONS } from "./questions";
import { VoicePhase } from "./voice-phase";

type Phase = "idle" | "voice" | "questions" | "clips" | "deriving" | "reveal";

interface DerivedProfile {
  archetype: string | null;
  badgeEmoji: string | null;
  tags: string[] | null;
  profileSummary: string | null;
  profileCards: { label: string; value: string }[] | null;
}

export function VisualCardsFlow() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRestart = searchParams.get("restart") === "1";

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<VisualAnswers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [profile, setProfile] = useState<DerivedProfile | null>(null);

  const getOrCreateSession = useMutation(
    trpc.onboarding.getOrCreateSession.mutationOptions(),
  );
  const restartSession = useMutation(
    trpc.onboarding.restartSession.mutationOptions(),
  );
  const saveAnswers = useMutation(
    trpc.onboarding.saveVisualAnswers.mutationOptions(),
  );
  const derive = useMutation(trpc.tasteProfile.derive.mutationOptions());

  const [reloadNonce, setReloadNonce] = useState(0);
  const [bootstrapError, setBootstrapError] = useState(false);

  // Bootstrap once: pull or create the session, then jump to the
  // earliest unanswered question (resume-aware). If the URL carries
  // `?restart=1`, force a fresh session instead.
  //
  // The `useRef` guard is critical: without it, React StrictMode
  // (dev only) double-invokes effects, which races `restartSession`
  // against a follow-up `getOrCreateSession`. The follow-up can
  // see the user's most-recent COMPLETED session before
  // `restartSession`'s insert commits — bouncing the user straight
  // back to their old reveal screen instead of starting fresh.
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (phase !== "idle") return;
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    let cancelled = false;
    const baseBootstrap = isRestart
      ? restartSession.mutateAsync()
      : getOrCreateSession.mutateAsync();

    const bootstrap = Promise.race([
      baseBootstrap,
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Taking too long to start — check your connection and try again.",
              ),
            ),
          45_000,
        ),
      ),
    ]);

    // Clean the `restart` flag off the URL so a refresh doesn't
    // re-trigger another restart and wipe in-progress answers.
    if (isRestart) {
      router.replace("/onboarding/taste", { scroll: false });
    }

    bootstrap.then(
      (session) => {
        if (cancelled) return;
        setBootstrapError(false);
        setSessionId(session.id);
        const existing = (session.visualAnswers ?? {}) as VisualAnswers;
        setAnswers(existing);

        if (session.status === "complete") {
          // Already done — re-derive (idempotent) just to repopulate
          // the local `profile` state for the reveal screen.
          void runDerive(session.id, () => cancelled);
          return;
        }

        // Resume by phase: voice → voice phase (Tanny intro),
        // clips → clip-phase, complete → derive, otherwise →
        // first unanswered visual question.
        if (session.phase === "voice") {
          setPhase("voice");
          return;
        }
        if (session.phase === "clips") {
          setPhase("clips");
          return;
        }
        if (session.phase === "complete") {
          void runDerive(session.id, () => cancelled);
          return;
        }

        const firstUnanswered = QUESTIONS.findIndex(
          (q) => !hasAnswerFor(existing, q.key),
        );
        setQuestionIndex(
          firstUnanswered === -1 ? QUESTIONS.length - 1 : firstUnanswered,
        );
        setPhase("questions");
      },
      (err: unknown) => {
        bootstrappedRef.current = false;
        setBootstrapError(true);
        toast.error(
          err instanceof Error
            ? err.message
            : "Could not start onboarding — please try again.",
        );
      },
    );

    return () => {
      cancelled = true;
      // StrictMode remount must be allowed to bootstrap again — otherwise the
      // aborted first pass can strand the UI on a perpetual loading state.
      bootstrappedRef.current = false;
    };
    // reloadNonce retries after a bootstrap failure without remounting the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadNonce]);

  const total = QUESTIONS.length;
  const currentQuestion = QUESTIONS[questionIndex];

  const handleAnswer = async (value: string | string[] | null) => {
    if (!sessionId || !currentQuestion) return;

    const isLast = questionIndex === total - 1;

    // Compose the partial patch we'll persist + merge into local state.
    const patch: Partial<VisualAnswers> = {};
    if (value !== null) {
      if (currentQuestion.kind === "multi") {
        patch[currentQuestion.key] = value as string[] as never;
      } else {
        patch[currentQuestion.key] = value as never;
      }
    }
    const nextAnswers = { ...answers, ...patch };
    setAnswers(nextAnswers);

    // Fire-and-forget save for intermediate questions; await + handle
    // failure on the final question because it gates the derive call.
    try {
      await saveAnswers.mutateAsync({
        sessionId,
        answers: patch,
        markVisualComplete: isLast,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not save your answer — please try again.",
      );
      return;
    }

    if (!isLast) {
      setQuestionIndex((i) => Math.min(i + 1, total - 1));
      return;
    }

    // Last visual question — advance to the clips phase. The
    // server already moved `phase` to `clips` because we passed
    // `markVisualComplete: true`.
    setPhase("clips");
  };

  const runDerive = async (id: string, isCancelled?: () => boolean) => {
    setPhase("deriving");
    try {
      const res = await derive.mutateAsync({ sessionId: id });
      if (isCancelled?.()) return;
      setProfile(extractProfile(res.profile));
      await queryClient.invalidateQueries({
        queryKey: trpc.tasteProfile.get.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.userProfile.get.queryKey(),
      });
    } catch (err) {
      if (!isCancelled?.()) {
        toast.error(
          err instanceof Error
            ? err.message
            : "We hit a snag building your profile, but your answers are saved.",
        );
      }
    }
    if (!isCancelled?.()) setPhase("reveal");
  };

  const handleClipsDone = () => {
    if (!sessionId) return;
    void runDerive(sessionId);
  };

  const handleVoiceDone = () => {
    // Always advance to the first visual question when the voice
    // phase finishes (whether the user spoke or skipped). The
    // `saveVoiceTranscript` proc has already moved the session
    // phase server-side, so a refresh would land here too.
    setQuestionIndex(0);
    setPhase("questions");
  };

  const handleBack = () => {
    if (questionIndex === 0 || saveAnswers.isPending) return;
    setQuestionIndex((i) => Math.max(0, i - 1));
  };

  const initialValue = useMemo(() => {
    if (!currentQuestion) return undefined;
    return answers[currentQuestion.key];
  }, [currentQuestion, answers]);

  // ─── Render ────────────────────────────────────────────────────

  if (bootstrapError && phase === "idle") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-[#FEFCED] px-6 py-12 text-center">
        <p className="text-muted-foreground max-w-sm text-sm">
          We couldn&apos;t start your quiz. Check your connection, then try
          again.
        </p>
        <Button
          type="button"
          size="lg"
          onClick={() => {
            bootstrappedRef.current = false;
            setBootstrapError(false);
            setReloadNonce((n) => n + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (phase === "idle" || (phase === "questions" && !currentQuestion)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-muted size-8 animate-pulse rounded-full" />
      </div>
    );
  }

  if (phase === "voice" && sessionId) {
    return (
      <VoicePhase
        sessionId={sessionId}
        onComplete={handleVoiceDone}
        onSkip={handleVoiceDone}
      />
    );
  }

  if (phase === "clips" && sessionId) {
    return (
      <ClipsPhase
        sessionId={sessionId}
        onComplete={handleClipsDone}
        onSkipPhase={handleClipsDone}
      />
    );
  }

  if (phase === "deriving" || phase === "reveal") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <MinimalReveal profile={profile} isLoading={phase === "deriving"} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* pr-14 reserves room for the floating "Save & exit" X
          button that lives on the page wrapper. */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-3 pr-14 pl-3">
        <div className="flex min-w-0 items-center justify-start">
          {questionIndex > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={saveAnswers.isPending}
              className="shrink-0"
              aria-label="Previous question"
            >
              <BackArrow />
              <span>Back</span>
            </Button>
          ) : null}
        </div>
        <div className="flex shrink-0 justify-center">
          <ProgressPips total={total} currentIndex={questionIndex} />
        </div>
        <span className="text-muted-foreground shrink-0 justify-self-end text-right text-xs tabular-nums">
          {questionIndex + 1} / {total}
        </span>
      </header>

      <main
        key={questionIndex}
        className="animate-in fade-in slide-in-from-right-4 flex flex-1 items-start justify-center px-4 py-6 duration-300 sm:items-center sm:px-6 sm:py-8"
      >
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            initialValue={initialValue as string | string[] | undefined}
            onAnswer={handleAnswer}
            disabled={saveAnswers.isPending}
          />
        )}
      </main>
    </div>
  );
}

function hasAnswerFor(answers: VisualAnswers, key: keyof VisualAnswers) {
  const v = answers[key];
  if (Array.isArray(v)) return v.length > 0;
  return v != null;
}

// Defensive: the tRPC profile object has many nullable fields. We
// pull only what reveal needs and accept null.
function extractProfile(profile: unknown): DerivedProfile {
  const p =
    profile && typeof profile === "object"
      ? (profile as Record<string, unknown>)
      : {};
  let cards: { label: string; value: string }[] | null = null;
  if (Array.isArray(p.profileCards)) {
    const filtered = p.profileCards.filter(
      (c): c is { label: string; value: string } =>
        !!c &&
        typeof c === "object" &&
        typeof (c as { label?: unknown }).label === "string" &&
        typeof (c as { value?: unknown }).value === "string",
    );
    cards = filtered.length > 0 ? filtered.slice(0, 4) : null;
  }

  return {
    archetype: typeof p.archetype === "string" ? p.archetype : null,
    badgeEmoji: typeof p.badgeEmoji === "string" ? p.badgeEmoji : null,
    tags:
      Array.isArray(p.tags) && p.tags.every((t) => typeof t === "string")
        ? p.tags.filter((t): t is string => typeof t === "string")
        : null,
    profileSummary:
      typeof p.profileSummary === "string" ? p.profileSummary : null,
    profileCards: cards,
  };
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
