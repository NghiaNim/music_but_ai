"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

/**
 * Phase 1 of the new taste onboarding: a short voice chat with
 * Tanny. Optional but nudged. The transcript feeds into
 * `tasteProfile.derive` alongside the visual answers + clip
 * reactions, giving the LLM warmer signal than cards alone.
 *
 * Reuses the existing infra:
 *   - TTS via `onboarding.speak` (ElevenLabs)
 *   - STT via the browser's `SpeechRecognition` (free, no infra)
 *   - Tanny avatar at `/tanny.png`
 *
 * If the browser doesn't support SpeechRecognition (Firefox, some
 * iOS WebViews), we fall back to a `window.prompt`. The whole
 * phase is skippable from any state.
 */

type VoiceState =
  | "idle" // intro screen, waiting for user to tap Start
  | "connecting" // TTS warming up before greeting plays
  | "ai-speaking" // Tanny is talking
  | "user-speaking" // mic open, capturing one long utterance
  | "saving" // transcript hitting the server
  | "done"; // ready to advance — auto-fires onComplete

interface VoicePhaseProps {
  sessionId: string;
  /** Called once the transcript has been persisted. */
  onComplete: (transcript: string) => void;
  /** Called when the user opts out (or the browser blocks STT). */
  onSkip: () => void;
}

const GREETING =
  "Hi, I'm Tanny. Tell me about a piece of music that's stayed with you — what it is, and how it makes you feel.";

const WRAPUP_TEXT = "Got it. I'll fold that in.";

export function VoicePhase({ sessionId, onComplete, onSkip }: VoicePhaseProps) {
  const trpc = useTRPC();

  const speak = useMutation(trpc.onboarding.speak.mutationOptions());
  const saveTranscript = useMutation(
    trpc.onboarding.saveVoiceTranscript.mutationOptions(),
  );
  const skipVoice = useMutation(
    trpc.onboarding.skipVoicePhase.mutationOptions(),
  );

  const [state, setState] = useState<VoiceState>("idle");
  const [statusText, setStatusText] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ─── helpers ────────────────────────────────────────────────────

  const playTTS = useCallback(
    async (text: string): Promise<void> => {
      try {
        const result = await speak.mutateAsync({ text });
        const bytes = Uint8Array.from(atob(result.audio), (c) =>
          c.charCodeAt(0),
        );
        const blob = new Blob([bytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        await new Promise<void>((resolve) => {
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
        // TTS is decoration — don't fail the flow on it.
      }
    },
    // speak mutation is stable; depending on it would re-bind
    // every render and cancel ongoing audio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * Opens the mic and resolves with the captured utterance. Uses
   * `continuous: true` so the user can speak multiple sentences in
   * a row — recognition.onend fires after a natural pause, which
   * iOS/Chrome handle differently but well enough for our needs.
   *
   * Maximum hold time is 60s as a safety net (some browsers won't
   * end on their own).
   */
  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      let SpeechRecognitionCtor: typeof SpeechRecognition | undefined;
      if (
        "SpeechRecognition" in window &&
        typeof window.SpeechRecognition === "function"
      ) {
        SpeechRecognitionCtor = window.SpeechRecognition;
      } else if (
        "webkitSpeechRecognition" in window &&
        typeof window.webkitSpeechRecognition === "function"
      ) {
        SpeechRecognitionCtor = window.webkitSpeechRecognition;
      }

      if (!SpeechRecognitionCtor) {
        // Firefox + some WebViews: typed fallback so the user can
        // still contribute a transcript.
        const text = window.prompt(
          "Your browser doesn't support voice. Type a quick note about music that's stayed with you:",
        );
        resolve(text?.trim() ?? "");
        return;
      }

      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalText = "";
      let resolved = false;

      const finalize = () => {
        if (resolved) return;
        resolved = true;
        try {
          recognition.stop();
        } catch {
          /* already stopped */
        }
        recognitionRef.current = null;
        resolve(finalText.trim());
      };

      // Hard cap at 60s in case the browser keeps the mic open.
      const timeoutId = window.setTimeout(finalize, 60_000);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results.item(i);
          if (!result) continue;
          const alternative = result.item(0);
          const text = alternative ? alternative.transcript : "";
          if (result.isFinal) {
            finalText += text + " ";
          } else {
            interim += text;
          }
        }
        setInterimTranscript((finalText + interim).trim());
      };
      recognition.onerror = () => {
        window.clearTimeout(timeoutId);
        finalize();
      };
      recognition.onend = () => {
        window.clearTimeout(timeoutId);
        finalize();
      };

      try {
        recognition.start();
      } catch {
        window.clearTimeout(timeoutId);
        finalize();
      }
    });
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
  }, []);

  // ─── flow ───────────────────────────────────────────────────────

  const finalize = useCallback(
    async (transcript: string) => {
      const trimmed = transcript.trim();
      if (trimmed.length === 0) {
        // User said nothing detectable — treat as a soft skip so the
        // session phase still moves forward, but no transcript saved.
        try {
          await skipVoice.mutateAsync({ sessionId });
        } catch {
          /* non-critical */
        }
        onSkip();
        return;
      }
      setState("saving");
      setStatusText("Saving what you said…");
      try {
        await saveTranscript.mutateAsync({ sessionId, transcript: trimmed });
        setState("done");
        onComplete(trimmed);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "We couldn't save the recording — moving on without it.",
        );
        onSkip();
      }
    },
    [saveTranscript, skipVoice, sessionId, onComplete, onSkip],
  );

  const handleStart = async () => {
    setInterimTranscript("");
    setState("connecting");
    setStatusText("Connecting…");
    await playTTS(GREETING);

    setState("user-speaking");
    setStatusText("Listening — tap when you're done");
    const utterance = await startListening();

    setState("ai-speaking");
    setStatusText("Tanny is wrapping up…");
    await playTTS(WRAPUP_TEXT);

    void finalize(utterance);
  };

  const handleStopEarly = () => {
    // Triggers recognition.onend, which finalizes via the promise
    // resolution chain in handleStart.
    stopListening();
  };

  const handleSkipPhase = async () => {
    stopListening();
    if (ttsAudioRef.current) ttsAudioRef.current.pause();
    try {
      await skipVoice.mutateAsync({ sessionId });
    } catch {
      /* non-critical */
    }
    onSkip();
  };

  // Cleanup on unmount: stop mic + audio so we don't leak handles
  // if the user navigates away mid-call.
  useEffect(() => {
    return () => {
      stopListening();
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
      }
    };
  }, [stopListening]);

  // ─── render ─────────────────────────────────────────────────────

  if (state === "idle") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 text-center">
        <div className="bg-primary/10 flex size-28 items-center justify-center rounded-full">
          <Image
            src="/tanny.png"
            alt="Tanny"
            width={88}
            height={88}
            className="rounded-full"
          />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            A quick chat first
          </p>
          <h2 className="text-xl font-semibold text-balance sm:text-2xl">
            Tell Tanny about music you love
          </h2>
          <p className="text-muted-foreground mt-2 text-sm text-balance">
            About a minute of voice. The more you share, the sharper your
            recommendations get. We'll do quick cards after.
          </p>
        </div>

        <Button size="lg" onClick={handleStart} className="gap-2">
          <MicIcon /> Start chatting
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkipPhase}
          className="text-muted-foreground"
          disabled={skipVoice.isPending}
        >
          Skip — just show me the cards
        </Button>
      </div>
    );
  }

  // Active states: connecting / ai-speaking / user-speaking / saving / done
  const isAISpeaking =
    state === "connecting" || state === "ai-speaking" || state === "saving";
  const isUserSpeaking = state === "user-speaking";

  return (
    <div className="flex flex-1 flex-col items-center justify-between gap-6 px-4 py-8 text-center">
      <div className="text-muted-foreground text-sm">{statusText}</div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {(isAISpeaking || isUserSpeaking) && (
            <>
              <div
                className={cn(
                  "absolute -inset-4 animate-ping rounded-full",
                  isUserSpeaking ? "bg-emerald-500/15" : "bg-primary/10",
                )}
              />
              <div
                className={cn(
                  "absolute -inset-8 animate-pulse rounded-full",
                  isUserSpeaking ? "bg-emerald-500/10" : "bg-primary/5",
                )}
              />
            </>
          )}
          <div
            className={cn(
              "relative flex size-32 items-center justify-center rounded-full transition-colors",
              isAISpeaking && "bg-primary/15",
              isUserSpeaking && "bg-emerald-500/15",
            )}
          >
            {isUserSpeaking ? (
              <MicIconLarge />
            ) : (
              <Image
                src="/tanny.png"
                alt="Tanny"
                width={88}
                height={88}
                className="rounded-full"
              />
            )}
          </div>
        </div>

        <h2 className="text-lg font-semibold">
          {isUserSpeaking ? "Listening…" : "Tanny"}
        </h2>

        {/* Live caption while the user is speaking — gives them
            visible confirmation the mic is picking them up. */}
        {isUserSpeaking && interimTranscript && (
          <p className="text-muted-foreground mx-auto max-w-xs text-xs italic">
            "{interimTranscript}"
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        {isUserSpeaking && (
          <Button onClick={handleStopEarly} size="lg" variant="outline">
            Done speaking
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkipPhase}
          className="text-muted-foreground"
          disabled={state === "saving" || skipVoice.isPending}
        >
          Skip the rest
        </Button>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicIconLarge() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-500"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
