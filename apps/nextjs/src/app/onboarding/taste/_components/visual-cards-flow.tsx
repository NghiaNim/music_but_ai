"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { VisualAnswers } from "@acme/validators";
import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";
import { MinimalReveal } from "./minimal-reveal";
import { ProgressPips } from "./progress-pips";
import { QuestionCard } from "./question-card";
import { QUESTIONS } from "./questions";

type Phase = "idle" | "questions" | "deriving" | "reveal";

interface DerivedProfile {
  archetype: string | null;
  badgeEmoji: string | null;
  tags: string[] | null;
  profileSummary: string | null;
}

export function VisualCardsFlow() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<VisualAnswers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [profile, setProfile] = useState<DerivedProfile | null>(null);

  const getOrCreateSession = useMutation(
    trpc.onboarding.getOrCreateSession.mutationOptions(),
  );
  const saveAnswers = useMutation(
    trpc.onboarding.saveVisualAnswers.mutationOptions(),
  );
  const derive = useMutation(trpc.tasteProfile.derive.mutationOptions());

  // Bootstrap once: pull or create the session, then jump to the
  // earliest unanswered question (resume-aware).
  useEffect(() => {
    if (phase !== "idle") return;

    let cancelled = false;
    getOrCreateSession.mutateAsync().then(
      (session) => {
        if (cancelled) return;
        setSessionId(session.id);
        const existing = (session.visualAnswers ?? {}) as VisualAnswers;
        setAnswers(existing);

        if (session.status === "complete") {
          // Already done — go straight to reveal with whatever profile
          // they have. tasteProfile.derive is idempotent so we can
          // safely re-call to populate.
          setPhase("deriving");
          derive.mutateAsync({ sessionId: session.id }).then(
            (res) => {
              if (cancelled) return;
              setProfile(extractProfile(res.profile));
              setPhase("reveal");
            },
            () => {
              if (cancelled) return;
              setPhase("reveal");
            },
          );
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
        toast.error(
          err instanceof Error
            ? err.message
            : "Could not start onboarding — please try again.",
        );
      },
    );

    return () => {
      cancelled = true;
    };
    // We intentionally only run this once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Last question — derive the profile and transition to reveal.
    setPhase("deriving");
    try {
      const res = await derive.mutateAsync({ sessionId });
      setProfile(extractProfile(res.profile));
      // Invalidate the cached profile so the rest of the app sees it.
      await queryClient.invalidateQueries({
        queryKey: trpc.tasteProfile.get.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.userProfile.get.queryKey(),
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "We hit a snag building your profile, but your answers are saved.",
      );
    }
    setPhase("reveal");
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

  if (phase === "idle" || (phase === "questions" && !currentQuestion)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="bg-muted size-8 animate-pulse rounded-full" />
      </div>
    );
  }

  if (phase === "deriving" || phase === "reveal") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <MinimalReveal profile={profile} isLoading={phase === "deriving"} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={questionIndex === 0 || saveAnswers.isPending}
          className={cn(
            "transition-opacity",
            questionIndex === 0 && "pointer-events-none opacity-0",
          )}
          aria-label="Previous question"
        >
          <BackArrow />
          <span>Back</span>
        </Button>
        <ProgressPips total={total} currentIndex={questionIndex} />
        <span className="text-muted-foreground text-xs tabular-nums">
          {questionIndex + 1} / {total}
        </span>
      </header>

      <main
        key={questionIndex}
        className="animate-in fade-in slide-in-from-right-4 flex flex-1 items-center justify-center overflow-y-auto px-6 py-8 duration-300"
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
  return {
    archetype: typeof p.archetype === "string" ? p.archetype : null,
    badgeEmoji: typeof p.badgeEmoji === "string" ? p.badgeEmoji : null,
    tags:
      Array.isArray(p.tags) && p.tags.every((t) => typeof t === "string")
        ? p.tags.filter((t): t is string => typeof t === "string")
        : null,
    profileSummary:
      typeof p.profileSummary === "string" ? p.profileSummary : null,
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
