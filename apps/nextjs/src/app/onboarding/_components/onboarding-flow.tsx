"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

type Step =
  | { type: "welcome" }
  | { type: "question"; index: number }
  | { type: "transition-to-music" }
  | { type: "music"; index: number }
  | { type: "done" };

export function OnboardingFlow() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.onboarding.getQuestions.queryOptions(),
  );

  const [step, setStep] = useState<Step>({ type: "welcome" });
  const [answers, setAnswers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [ratings, setRatings] = useState<{
    easy: number;
    medium: number;
    hard: number;
  }>({ easy: 5, medium: 5, hard: 5 });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const replyMutation = useMutation(
    trpc.onboarding.reply.mutationOptions(),
  );

  const speakMutation = useMutation(
    trpc.onboarding.speak.mutationOptions(),
  );

  const completeMutation = useMutation(
    trpc.onboarding.complete.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          `Welcome! You're set as a ${result.experienceLevel} listener.`,
        );
        router.push("/");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save. Try signing in first.");
      },
    }),
  );

  const speakText = useCallback(
    async (text: string) => {
      try {
        const result = await speakMutation.mutateAsync({ text });
        const audioBlob = new Blob(
          [Uint8Array.from(atob(result.audio), (c) => c.charCodeAt(0))],
          { type: "audio/mpeg" },
        );
        const url = URL.createObjectURL(audioBlob);
        if (ttsAudioRef.current) {
          ttsAudioRef.current.pause();
          URL.revokeObjectURL(ttsAudioRef.current.src);
        }
        const audio = new Audio(url);
        ttsAudioRef.current = audio;
        await audio.play();
      } catch {
        // TTS is enhancement, not critical — continue without voice
      }
    },
    [speakMutation],
  );

  const handleStartOnboarding = async () => {
    setStep({ type: "question", index: 0 });
    const greeting = `Hi there! Welcome to Classical Music Connect. I'm so excited to help you discover amazing music. Let me ask you a few quick questions. ${data.questions[0]}`;
    setAiReply(greeting);
    void speakText(greeting);
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const answer = inputValue.trim();
    if (!answer) return;

    const currentStep = step as { type: "question"; index: number };
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setInputValue("");

    try {
      const result = await replyMutation.mutateAsync({
        questionIndex: currentStep.index,
        userAnswer: answer,
        previousAnswers: answers,
      });

      setAiReply(result.text);
      void speakText(result.text);

      if (currentStep.index < 2) {
        setStep({ type: "question", index: currentStep.index + 1 });
      } else {
        setStep({ type: "transition-to-music" });
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    }
  };

  const handleStartMusic = () => {
    setStep({ type: "music", index: 0 });
    setAiReply("");
  };

  const handlePlayTrack = (file: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(file);
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
  };

  const handleRate = (tier: "easy" | "medium" | "hard", value: number) => {
    setRatings((prev) => ({ ...prev, [tier]: value }));
  };

  const handleNextTrack = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    const currentMusic = step as { type: "music"; index: number };
    if (currentMusic.index < 2) {
      setStep({ type: "music", index: currentMusic.index + 1 });
    } else {
      setStep({ type: "done" });
    }
  };

  const handleComplete = () => {
    completeMutation.mutate({ answers, ratings });
  };

  const handleSkipToHome = () => {
    router.push("/");
  };

  const progress =
    step.type === "welcome"
      ? 0
      : step.type === "question"
        ? ((step.index + 1) / 6) * 100
        : step.type === "transition-to-music"
          ? 50
          : step.type === "music"
            ? 50 + ((step.index + 1) / 6) * 100
            : 100;

  return (
    <div className="flex h-full flex-col">
      <div className="bg-muted/30 h-1">
        <div
          className="bg-primary h-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
          {step.type === "welcome" && (
            <WelcomeScreen
              onStart={handleStartOnboarding}
              onSkip={handleSkipToHome}
            />
          )}

          {step.type === "question" && (
            <QuestionScreen
              aiReply={aiReply}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSubmit={handleAnswerSubmit}
              isPending={replyMutation.isPending || speakMutation.isPending}
            />
          )}

          {step.type === "transition-to-music" && (
            <TransitionScreen aiReply={aiReply} onContinue={handleStartMusic} />
          )}

          {step.type === "music" && (
            <MusicScreen
              track={data.tracks[step.index]!}
              tier={
                step.index === 0
                  ? "easy"
                  : step.index === 1
                    ? "medium"
                    : "hard"
              }
              rating={
                step.index === 0
                  ? ratings.easy
                  : step.index === 1
                    ? ratings.medium
                    : ratings.hard
              }
              isPlaying={isPlaying}
              onPlay={() =>
                handlePlayTrack(data.tracks[step.index]!.file)
              }
              onRate={(v) =>
                handleRate(
                  step.index === 0
                    ? "easy"
                    : step.index === 1
                      ? "medium"
                      : "hard",
                  v,
                )
              }
              onNext={handleNextTrack}
              trackNumber={step.index + 1}
            />
          )}

          {step.type === "done" && (
            <DoneScreen
              onComplete={handleComplete}
              onSkip={handleSkipToHome}
              isPending={completeMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="bg-primary/10 flex size-20 items-center justify-center rounded-full">
        <MusicNoteIcon size={40} />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Let's learn about your music taste so we can give you the best
          recommendations. It only takes a minute.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onStart}>
          Let's Go
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onSkip}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}

function QuestionScreen({
  aiReply,
  inputValue,
  onInputChange,
  onSubmit,
  isPending,
}: {
  aiReply: string;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center gap-4">
        <div className="flex gap-3">
          <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full">
            <MusicNoteIcon size={18} />
          </div>
          <div className="bg-muted max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-sm leading-relaxed">
              {isPending ? (
                <span className="flex gap-1">
                  <span className="bg-foreground/20 size-2 animate-bounce rounded-full" />
                  <span className="bg-foreground/20 size-2 animate-bounce rounded-full [animation-delay:150ms]" />
                  <span className="bg-foreground/20 size-2 animate-bounce rounded-full [animation-delay:300ms]" />
                </span>
              ) : (
                aiReply
              )}
            </p>
          </div>
        </div>

        {isPending && (
          <div className="text-muted-foreground flex items-center gap-2 px-12 text-xs">
            <SpeakerIcon />
            <span>Listening...</span>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 pt-4">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your answer..."
          disabled={isPending}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!inputValue.trim() || isPending}
        >
          <SendIcon />
        </Button>
      </form>
    </div>
  );
}

function TransitionScreen({
  aiReply,
  onContinue,
}: {
  aiReply: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="flex gap-3">
        <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full">
          <MusicNoteIcon size={18} />
        </div>
        <div className="bg-muted max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 text-left">
          <p className="text-sm leading-relaxed">{aiReply}</p>
        </div>
      </div>
      <Button size="lg" className="mt-4 w-full" onClick={onContinue}>
        Play Me Some Music
      </Button>
    </div>
  );
}

function MusicScreen({
  track,
  tier,
  rating,
  isPlaying,
  onPlay,
  onRate,
  onNext,
  trackNumber,
}: {
  track: { title: string; composer: string; file: string };
  tier: "easy" | "medium" | "hard";
  rating: number;
  isPlaying: boolean;
  onPlay: () => void;
  onRate: (value: number) => void;
  onNext: () => void;
  trackNumber: number;
}) {
  const tierLabel =
    tier === "easy" ? "Piece" : tier === "medium" ? "Piece" : "Piece";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {tierLabel} {trackNumber} of 3
      </p>

      <div className="w-full text-center">
        <div
          className={cn(
            "mx-auto mb-4 flex size-24 items-center justify-center rounded-full transition-all",
            isPlaying
              ? "bg-primary/20 animate-pulse"
              : "bg-primary/10",
          )}
        >
          <button onClick={onPlay} className="focus:outline-none">
            {isPlaying ? <PauseIcon size={36} /> : <PlayIcon size={36} />}
          </button>
        </div>
        <h2 className="text-lg font-semibold">{track.title}</h2>
        <p className="text-muted-foreground text-sm">{track.composer}</p>
      </div>

      <div className="w-full">
        <p className="mb-3 text-center text-sm font-medium">
          How much do you enjoy this? ({rating}/10)
        </p>
        <div className="flex justify-center gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <button
              key={v}
              onClick={() => onRate(v)}
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-xs font-medium transition-all",
                v <= rating
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" className="mt-2 w-full" onClick={onNext}>
        {trackNumber < 3 ? "Next Track" : "Finish"}
      </Button>
    </div>
  );
}

function DoneScreen({
  onComplete,
  onSkip,
  isPending,
}: {
  onComplete: () => void;
  onSkip: () => void;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="bg-emerald-100 dark:bg-emerald-900/30 flex size-20 items-center justify-center rounded-full">
        <CheckIcon size={40} />
      </div>
      <div>
        <h1 className="text-2xl font-bold">All set!</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          We've got a great picture of your taste. Sign in to save your
          profile and get personalized recommendations.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button
          size="lg"
          className="w-full"
          onClick={onComplete}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save & Continue"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onSkip}
        >
          Continue without saving
        </Button>
      </div>
    </div>
  );
}

function MusicNoteIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function PlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-primary">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function PauseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-primary">
      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <path d="M16 9a5 5 0 0 1 0 6" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
