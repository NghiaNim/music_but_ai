import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { VisualAnswers } from "@acme/validators";

import { ClipsPhase } from "~/components/onboarding/clips-phase";
import { MinimalReveal } from "~/components/onboarding/minimal-reveal";
import { ProgressPips } from "~/components/onboarding/progress-pips";
import { QuestionCard } from "~/components/onboarding/question-card";
import { QUESTIONS } from "~/components/onboarding/questions";
import { VoicePhase } from "~/components/onboarding/voice-phase";
import { usePalette } from "~/theme";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { toSignInHref } from "~/utils/auth-redirect";

type Phase = "idle" | "voice" | "questions" | "clips" | "deriving" | "reveal";

interface DerivedProfile {
  archetype: string | null;
  badgeEmoji: string | null;
  tags: string[] | null;
  profileSummary: string | null;
  profileCards: { label: string; value: string }[] | null;
}

function hasAnswerFor(answers: VisualAnswers, key: keyof VisualAnswers) {
  const v = answers[key];
  if (Array.isArray(v)) return v.length > 0;
  return v != null;
}

function isFinishedSessionError(err: unknown) {
  if (!(err instanceof Error)) return false;
  return err.message.toLowerCase().includes("finished onboarding session");
}

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

export default function TasteOnboardingScreen() {
  const router = useRouter();
  const { palette } = usePalette();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ restart?: string }>();
  const isRestart = params.restart === "1";
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) {
      router.replace(toSignInHref("/onboarding/taste"));
    }
  }, [router, session?.user]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<VisualAnswers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [profile, setProfile] = useState<DerivedProfile | null>(null);
  const [bootstrapError, setBootstrapError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

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

  const runDerive = async (id: string, isCancelled?: () => boolean) => {
    setPhase("deriving");
    try {
      const res = await derive.mutateAsync({ sessionId: id });
      if (isCancelled?.()) return;
      const derived = extractProfile(res.profile);
      setProfile(derived);
      await queryClient.invalidateQueries(trpc.tasteProfile.pathFilter());
      await queryClient.invalidateQueries(trpc.userProfile.pathFilter());
    } catch {
      if (!isCancelled?.()) {
        Alert.alert(
          "We hit a snag",
          "We hit a snag building your profile, but your answers are saved.",
        );
      }
    }
    if (!isCancelled?.()) setPhase("reveal");
  };

  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (!session?.user) return;
    if (phase !== "idle") return;
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    let cancelled = false;
    const bootstrap = isRestart
      ? restartSession.mutateAsync()
      : getOrCreateSession.mutateAsync();

    bootstrap.then(
      (bootstrapped) => {
        if (cancelled) return;
        setBootstrapError(false);
        setSessionId(bootstrapped.id);
        const existing = (bootstrapped.visualAnswers ?? {}) as VisualAnswers;
        setAnswers(existing);

        if (bootstrapped.status === "complete") {
          void runDerive(bootstrapped.id, () => cancelled);
          return;
        }
        if (bootstrapped.phase === "voice") {
          setPhase("voice");
          return;
        }
        if (bootstrapped.phase === "clips") {
          setPhase("clips");
          return;
        }
        if (bootstrapped.phase === "complete") {
          void runDerive(bootstrapped.id, () => cancelled);
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
      () => {
        bootstrappedRef.current = false;
        setBootstrapError(true);
      },
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, reloadNonce]);

  const total = QUESTIONS.length;
  const currentQuestion = QUESTIONS[questionIndex];

  const handleAnswer = async (value: string | string[] | null) => {
    if (!sessionId || !currentQuestion) return;
    const isLast = questionIndex === total - 1;

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

    try {
      await saveAnswers.mutateAsync({
        sessionId,
        answers: patch,
        markVisualComplete: isLast,
      });
    } catch (err) {
      if (isFinishedSessionError(err)) {
        try {
          const fresh = await restartSession.mutateAsync();
          setSessionId(fresh.id);
          await saveAnswers.mutateAsync({
            sessionId: fresh.id,
            answers: patch,
            markVisualComplete: isLast,
          });
        } catch (retryErr) {
          Alert.alert(
            "Couldn't restart",
            retryErr instanceof Error
              ? retryErr.message
              : "Could not restart your quiz — please try again.",
          );
          return;
        }
      } else {
        Alert.alert(
          "Couldn't save",
          err instanceof Error
            ? err.message
            : "Could not save your answer — please try again.",
        );
        return;
      }
    }

    if (!isLast) {
      setQuestionIndex((i) => Math.min(i + 1, total - 1));
      return;
    }
    setPhase("clips");
  };

  const handleClipsDone = () => {
    if (!sessionId) return;
    void runDerive(sessionId);
  };

  const handleVoiceDone = () => {
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

  const cream = "#FEFCED";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cream }}>
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          accessibilityLabel="Save and exit — your progress is kept"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 20,
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: `${cream}E6`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={18} color={palette.mutedForeground} />
        </Pressable>

        {bootstrapError && phase === "idle" ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              paddingHorizontal: 24,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: palette.mutedForeground,
                textAlign: "center",
              }}
            >
              We couldn't start your quiz. Check your connection, then try
              again.
            </Text>
            <Pressable
              onPress={() => {
                bootstrappedRef.current = false;
                setBootstrapError(false);
                setReloadNonce((n) => n + 1);
              }}
              style={{
                borderRadius: 12,
                backgroundColor: palette.primary,
                paddingHorizontal: 20,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: palette.primaryForeground,
                }}
              >
                Try again
              </Text>
            </Pressable>
          </View>
        ) : phase === "idle" || (phase === "questions" && !currentQuestion) ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
              Loading…
            </Text>
          </View>
        ) : phase === "voice" && sessionId ? (
          <VoicePhase
            sessionId={sessionId}
            onComplete={handleVoiceDone}
            onSkip={handleVoiceDone}
            palette={palette}
          />
        ) : phase === "clips" && sessionId ? (
          <ClipsPhase
            sessionId={sessionId}
            onComplete={handleClipsDone}
            onSkipPhase={handleClipsDone}
            palette={palette}
          />
        ) : phase === "deriving" || phase === "reveal" ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <MinimalReveal
              profile={profile}
              isLoading={phase === "deriving"}
              palette={palette}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                paddingLeft: 12,
                paddingRight: 56,
              }}
            >
              <View style={{ minWidth: 64 }}>
                {questionIndex > 0 ? (
                  <Pressable
                    onPress={handleBack}
                    disabled={saveAnswers.isPending}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={16}
                      color={palette.primary}
                    />
                    <Text style={{ fontSize: 13, color: palette.primary }}>
                      Back
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <ProgressPips
                total={total}
                currentIndex={questionIndex}
                palette={palette}
              />
              <Text
                style={{
                  minWidth: 64,
                  textAlign: "right",
                  fontSize: 11,
                  color: palette.mutedForeground,
                }}
              >
                {questionIndex + 1} / {total}
              </Text>
            </View>

            <View
              key={questionIndex}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 20,
                paddingVertical: 24,
              }}
            >
              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  initialValue={initialValue as string | string[] | undefined}
                  onAnswer={(v) => void handleAnswer(v)}
                  disabled={saveAnswers.isPending}
                  palette={palette}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
