"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

type Phase =
  | "idle"
  | "connecting"
  | "ai-speaking"
  | "user-speaking"
  | "processing"
  | "music-playing"
  | "music-rating"
  | "done";

export function OnboardingFlow() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.onboarding.getQuestions.queryOptions(),
  );

  const [phase, setPhase] = useState<Phase>("idle");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [musicIndex, setMusicIndex] = useState(0);
  const [ratings, setRatings] = useState<{
    easy: number;
    medium: number;
    hard: number;
  }>({ easy: 5, medium: 5, hard: 5 });
  const [statusText, setStatusText] = useState("");
  const [callDuration, setCallDuration] = useState(0);

  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const replyMutation = useMutation(trpc.onboarding.reply.mutationOptions());
  const speakMutation = useMutation(trpc.onboarding.speak.mutationOptions());
  const completeMutation = useMutation(
    trpc.onboarding.complete.mutationOptions({
      onSuccess: (result) => {
        toast.success(`You're set as a ${result.experienceLevel} listener!`);
        router.push("/");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save — try signing in first.");
      },
    }),
  );

  // Call timer
  useEffect(() => {
    if (phase !== "idle" && phase !== "done") {
      timerRef.current = setInterval(
        () => setCallDuration((d) => d + 1),
        1000,
      );
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const playTTS = useCallback(
    async (text: string): Promise<void> => {
      try {
        const result = await speakMutation.mutateAsync({ text });
        const bytes = Uint8Array.from(atob(result.audio), (c) =>
          c.charCodeAt(0),
        );
        const blob = new Blob([bytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        return new Promise<void>((resolve) => {
          if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            URL.revokeObjectURL(ttsAudioRef.current.src);
          }
          const audio = new Audio(url);
          ttsAudioRef.current = audio;
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
      } catch {
        // TTS is non-critical, continue silently
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        // Fallback: prompt for text
        const text = window.prompt("Voice not available. Type your answer:");
        resolve(text ?? "I'm not sure");
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      let resolved = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        if (!resolved) {
          resolved = true;
          resolve(transcript || "I'm not sure");
        }
      };

      recognition.onerror = () => {
        if (!resolved) {
          resolved = true;
          resolve("I'm not sure");
        }
      };

      recognition.onend = () => {
        if (!resolved) {
          resolved = true;
          resolve("I'm not sure");
        }
      };

      recognition.start();
    });
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const handleStartCall = async () => {
    setPhase("connecting");
    setStatusText("Connecting...");
    setCallDuration(0);

    // Small delay to feel like a real connection
    await new Promise((r) => setTimeout(r, 1200));

    const greeting = `Hi there! Welcome to Classical Music Connect. I'm so excited to help you discover amazing music. Let me ask you a few quick questions. ${data.questions[0]}`;

    setPhase("ai-speaking");
    setStatusText("AI Mentor is speaking...");
    await playTTS(greeting);

    // Start listening
    setPhase("user-speaking");
    setStatusText("Your turn — speak now");
    const answer = await startListening();

    await processAnswer(0, answer, []);
  };

  const processAnswer = async (
    qIndex: number,
    answer: string,
    prevAnswers: string[],
  ) => {
    setPhase("processing");
    setStatusText("Thinking...");
    const newAnswers = [...prevAnswers, answer];
    setAnswers(newAnswers);

    try {
      const result = await replyMutation.mutateAsync({
        questionIndex: qIndex,
        userAnswer: answer,
        previousAnswers: prevAnswers,
      });

      setPhase("ai-speaking");
      setStatusText("AI Mentor is speaking...");
      await playTTS(result.text);

      if (qIndex < 2) {
        const nextQ = qIndex + 1;
        setQuestionIndex(nextQ);
        setPhase("user-speaking");
        setStatusText("Your turn — speak now");
        const nextAnswer = await startListening();
        await processAnswer(nextQ, nextAnswer, newAnswers);
      } else {
        // Transition to music phase
        setPhase("ai-speaking");
        setStatusText("Time to listen to some music!");
        await new Promise((r) => setTimeout(r, 800));
        setMusicIndex(0);
        setPhase("music-playing");
        setStatusText("Listen and rate this track");
        playMusicTrack(0);
      }
    } catch {
      toast.error("Something went wrong");
      setPhase("user-speaking");
      setStatusText("Let's try again — speak now");
      const retry = await startListening();
      await processAnswer(qIndex, retry, prevAnswers);
    }
  };

  const playMusicTrack = (idx: number) => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
    }
    const track = data.tracks[idx];
    if (!track) return;
    const audio = new Audio(track.file);
    musicAudioRef.current = audio;
    audio.play();
    // Auto-stop after 30 seconds for snippet
    setTimeout(() => {
      if (musicAudioRef.current === audio) {
        audio.pause();
        setPhase("music-rating");
        setStatusText("How did that sound?");
      }
    }, 30000);
  };

  const handleMusicRate = (value: number) => {
    const tier =
      musicIndex === 0 ? "easy" : musicIndex === 1 ? "medium" : "hard";
    setRatings((prev) => ({ ...prev, [tier]: value }));
  };

  const handleNextTrack = () => {
    if (musicAudioRef.current) musicAudioRef.current.pause();
    if (musicIndex < 2) {
      const next = musicIndex + 1;
      setMusicIndex(next);
      setPhase("music-playing");
      setStatusText("Listen and rate this track");
      playMusicTrack(next);
    } else {
      setPhase("done");
      setStatusText("All done!");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleStopMusic = () => {
    if (musicAudioRef.current) musicAudioRef.current.pause();
    setPhase("music-rating");
    setStatusText("How did that sound?");
  };

  const handleHangUp = () => {
    stopListening();
    if (ttsAudioRef.current) ttsAudioRef.current.pause();
    if (musicAudioRef.current) musicAudioRef.current.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    router.push("/");
  };

  const handleComplete = () => {
    completeMutation.mutate({ answers, ratings });
  };

  // ─── Idle: not started yet ───
  if (phase === "idle") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="relative">
          <div className="bg-primary/10 flex size-28 items-center justify-center rounded-full">
            <AIMentorAvatar size={56} />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Mentor</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            A quick voice chat to learn your taste
          </p>
        </div>
        <button
          onClick={handleStartCall}
          className="flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform active:scale-95"
        >
          <PhoneIcon />
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => router.push("/")}
        >
          Skip for now
        </Button>
      </div>
    );
  }

  // ─── Done: save results ───
  if (phase === "done") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckIcon size={40} />
        </div>
        <div>
          <h1 className="text-xl font-bold">All set!</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Call ended &middot; {formatDuration(callDuration)}
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          Sign in to save your profile and get personalized recommendations.
        </p>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            onClick={handleComplete}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? "Saving..." : "Save & Continue"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => router.push("/")}
          >
            Continue without saving
          </Button>
        </div>
      </div>
    );
  }

  // ─── Music rating overlay ───
  if (phase === "music-rating") {
    const tier =
      musicIndex === 0 ? "easy" : musicIndex === 1 ? "medium" : "hard";
    const currentRating = ratings[tier];

    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Track {musicIndex + 1} of 3
        </p>
        <h2 className="text-lg font-semibold">How did you like it?</h2>
        <div className="flex gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <button
              key={v}
              onClick={() => handleMusicRate(v)}
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-sm font-medium transition-all",
                v <= currentRating
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <Button size="lg" className="mt-2 w-full max-w-xs" onClick={handleNextTrack}>
          {musicIndex < 2 ? "Next Track" : "Finish"}
        </Button>
      </div>
    );
  }

  // ─── Active call: speaking / listening / music ───
  const isAISpeaking = phase === "ai-speaking" || phase === "connecting" || phase === "processing";
  const isUserSpeaking = phase === "user-speaking";
  const isMusicPlaying = phase === "music-playing";

  return (
    <div className="flex h-full flex-col items-center justify-between px-4 py-8">
      {/* Top: status */}
      <div className="text-center">
        <p className="text-muted-foreground text-xs">
          {formatDuration(callDuration)}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{statusText}</p>
      </div>

      {/* Center: avatar with animation */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Pulsing rings for active states */}
          {(isAISpeaking || isUserSpeaking) && (
            <>
              <div className="absolute -inset-4 animate-ping rounded-full bg-primary/10" />
              <div className="absolute -inset-8 animate-pulse rounded-full bg-primary/5" />
            </>
          )}
          {isMusicPlaying && (
            <>
              <div className="absolute -inset-4 animate-pulse rounded-full bg-violet-500/10" />
              <div className="absolute -inset-8 animate-pulse rounded-full bg-violet-500/5 [animation-delay:300ms]" />
            </>
          )}
          <div
            className={cn(
              "relative flex size-32 items-center justify-center rounded-full transition-colors",
              isAISpeaking && "bg-primary/15",
              isUserSpeaking && "bg-emerald-500/15",
              isMusicPlaying && "bg-violet-500/15",
              phase === "connecting" && "bg-muted animate-pulse",
            )}
          >
            {isMusicPlaying ? (
              <WaveformIcon size={56} />
            ) : isUserSpeaking ? (
              <MicIcon size={56} />
            ) : (
              <AIMentorAvatar size={56} />
            )}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold">
            {isMusicPlaying
              ? `Track ${musicIndex + 1} of 3`
              : isUserSpeaking
                ? "Listening..."
                : "AI Mentor"}
          </h2>
          {isMusicPlaying && (
            <p className="text-muted-foreground mt-1 text-xs">
              Tap stop when you&apos;ve heard enough
            </p>
          )}
        </div>
      </div>

      {/* Bottom: action buttons */}
      <div className="flex items-center gap-6">
        {isMusicPlaying && (
          <button
            onClick={handleStopMusic}
            className="flex size-14 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg transition-transform active:scale-95"
          >
            <StopIcon />
          </button>
        )}
        <button
          onClick={handleHangUp}
          className="flex size-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform active:scale-95"
        >
          <HangUpIcon />
        </button>
      </div>
    </div>
  );
}

function AIMentorAvatar({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function HangUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="22" y1="2" x2="2" y2="22" />
    </svg>
  );
}

function MicIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function WaveformIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
      <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="6" width="12" height="12" rx="2" />
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
