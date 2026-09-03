import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Image, Pressable, Text, View } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";

import type { Palette } from "~/theme";
import { radius } from "~/theme";
import { trpc } from "~/utils/api";
import { playTtsAudio } from "~/utils/tts-playback";
import tonTonAvatar from "../../../assets/ton-ton-cat-cutout.png";

/**
 * Phase 1 of taste onboarding: a short voice chat with Ton Ton. Mirrors
 * the web `VoicePhase` — TTS via `onboarding.speak` (ElevenLabs), STT via
 * native speech recognition (expo-speech-recognition), always skippable.
 */

type VoiceState =
  | "idle"
  | "connecting"
  | "ai-speaking"
  | "user-speaking"
  | "saving"
  | "done";

interface VoicePhaseProps {
  sessionId: string;
  onComplete: (transcript: string) => void;
  onSkip: () => void;
  palette: Palette;
}

const GREETING =
  "Hi, I'm Ton Ton. Tell me about a piece of music that's stayed with you — what it is, and how it makes you feel.";
const WRAPUP_TEXT = "Got it. I'll fold that in.";
const TTS_FETCH_CAP_MS = 22_000;
const TTS_HARD_CAP_MS = 25_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function VoicePhase({
  sessionId,
  onComplete,
  onSkip,
  palette,
}: VoicePhaseProps) {
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

  const finalTranscriptRef = useRef("");
  const listeningResolveRef = useRef<((text: string) => void) | null>(null);

  useSpeechRecognitionEvent("result", (event) => {
    const result = event.results[0];
    const text = result?.transcript ?? "";
    if (event.isFinal) {
      finalTranscriptRef.current =
        `${finalTranscriptRef.current} ${text}`.trim();
      setInterimTranscript(finalTranscriptRef.current);
    } else {
      setInterimTranscript(`${finalTranscriptRef.current} ${text}`.trim());
    }
  });

  useSpeechRecognitionEvent("end", () => {
    listeningResolveRef.current?.(finalTranscriptRef.current.trim());
    listeningResolveRef.current = null;
  });

  useSpeechRecognitionEvent("error", () => {
    listeningResolveRef.current?.(finalTranscriptRef.current.trim());
    listeningResolveRef.current = null;
  });

  const playTTS = useCallback(async (text: string): Promise<void> => {
    try {
      const payload = await Promise.race([
        speak.mutateAsync({ text }).then((r) => ({ ok: true as const, r })),
        sleep(TTS_FETCH_CAP_MS).then(() => ({ ok: false as const })),
      ]);
      if (!payload.ok) return;
      await playTtsAudio(payload.r.audio);
    } catch {
      // TTS is decoration — never fail the flow on it.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(async (): Promise<string> => {
    finalTranscriptRef.current = "";
    setInterimTranscript("");

    const permission =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) return "";

    return new Promise<string>((resolve) => {
      let resolved = false;
      const finish = (text: string) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        listeningResolveRef.current = null;
        resolve(text);
      };
      listeningResolveRef.current = finish;
      // Hard cap at 60s in case the native module keeps the mic open.
      const timeoutId = setTimeout(() => {
        try {
          ExpoSpeechRecognitionModule.stop();
        } catch {
          finish(finalTranscriptRef.current.trim());
        }
      }, 60_000);
      try {
        ExpoSpeechRecognitionModule.start({
          lang: "en-US",
          interimResults: true,
          continuous: true,
        });
      } catch {
        finish("");
      }
    });
  }, []);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const finalize = useCallback(
    async (transcript: string) => {
      const trimmed = transcript.trim();
      if (trimmed.length === 0) {
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
        Alert.alert(
          "Couldn't save",
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
    await Promise.race([playTTS(GREETING), sleep(TTS_HARD_CAP_MS)]);

    setState("user-speaking");
    setStatusText("Listening — tap when you're done");
    const utterance = await startListening();

    setState("ai-speaking");
    setStatusText("Ton Ton is wrapping up…");
    await Promise.race([playTTS(WRAPUP_TEXT), sleep(TTS_HARD_CAP_MS)]);

    void finalize(utterance);
  };

  const handleStopEarly = () => {
    stopListening();
  };

  const handleSkipPhase = async () => {
    stopListening();
    try {
      await skipVoice.mutateAsync({ sessionId });
    } catch {
      /* non-critical */
    }
    onSkip();
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  if (state === "idle") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        <View
          style={{
            width: 192,
            height: 192,
            borderRadius: 96,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${palette.primary}1A`,
          }}
        >
          <Image
            source={tonTonAvatar}
            style={{ width: 136, height: 136, resizeMode: "contain" }}
          />
        </View>

        <View style={{ gap: 8, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: palette.mutedForeground,
            }}
          >
            A quick chat first
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: palette.foreground,
              textAlign: "center",
            }}
          >
            Tell Ton Ton about music you love
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: palette.mutedForeground,
              textAlign: "center",
              lineHeight: 19,
              marginTop: 4,
            }}
          >
            About a minute of voice. The more you share, the sharper your
            recommendations get. We'll do quick cards after.
          </Text>
        </View>

        <Pressable
          onPress={() => void handleStart()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderRadius: radius.lg,
            backgroundColor: palette.primary,
            paddingHorizontal: 22,
            paddingVertical: 13,
          }}
        >
          <Ionicons name="mic" size={18} color={palette.primaryForeground} />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: palette.primaryForeground,
            }}
          >
            Start chatting
          </Text>
        </Pressable>

        <Pressable
          disabled={skipVoice.isPending}
          onPress={() => void handleSkipPhase()}
          style={{ paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
            Skip — just show me the cards
          </Text>
        </Pressable>
      </View>
    );
  }

  const isAISpeaking =
    state === "connecting" || state === "ai-speaking" || state === "saving";
  const isUserSpeaking = state === "user-speaking";

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 32,
      }}
    >
      <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
        {statusText}
      </Text>

      <View style={{ alignItems: "center", gap: 16 }}>
        <PulsingAvatar
          isAISpeaking={isAISpeaking}
          isUserSpeaking={isUserSpeaking}
          palette={palette}
        >
          {isUserSpeaking ? (
            <Ionicons name="mic" size={56} color={palette.emerald} />
          ) : (
            <Image
              source={tonTonAvatar}
              style={{ width: 136, height: 136, resizeMode: "contain" }}
            />
          )}
        </PulsingAvatar>

        <Text
          style={{ fontSize: 17, fontWeight: "600", color: palette.foreground }}
        >
          {isUserSpeaking ? "Listening…" : "Ton Ton"}
        </Text>

        {isUserSpeaking && interimTranscript ? (
          <Text
            style={{
              fontSize: 12,
              color: palette.mutedForeground,
              fontStyle: "italic",
              textAlign: "center",
              maxWidth: 280,
            }}
          >
            "{interimTranscript}"
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: "center", gap: 12 }}>
        {isUserSpeaking ? (
          <Pressable
            onPress={handleStopEarly}
            style={{
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: palette.border,
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: palette.foreground,
              }}
            >
              Done speaking
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={state === "saving" || skipVoice.isPending}
          onPress={() => void handleSkipPhase()}
          style={{ paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
            Skip the rest
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PulsingAvatar({
  isAISpeaking,
  isUserSpeaking,
  palette,
  children,
}: {
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  palette: Palette;
  children: React.ReactNode;
}) {
  const [pulse] = useState(() => new Animated.Value(0));
  const active = isAISpeaking || isUserSpeaking;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const ringColor = isUserSpeaking ? palette.emerald : palette.primary;

  return (
    <View
      style={{
        width: 192,
        height: 192,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {active ? (
        <Animated.View
          style={{
            position: "absolute",
            width: 192,
            height: 192,
            borderRadius: 96,
            backgroundColor: ringColor,
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.12, 0.02],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.15],
                }),
              },
            ],
          }}
        />
      ) : null}
      <View
        style={{
          width: 160,
          height: 160,
          borderRadius: 80,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isUserSpeaking
            ? `${palette.emerald}26`
            : `${palette.primary}26`,
        }}
      >
        {children}
      </View>
    </View>
  );
}
