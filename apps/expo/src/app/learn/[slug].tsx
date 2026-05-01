import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

import type { LearningModuleDef, Unit } from "@acme/validators";
import {
  COMPLETED_KEY,
  getModule,
  getStoredNumber,
  parseCompletedUnits,
  POINTS_KEY,
  serializeCompletedUnits,
  unitKey,
} from "@acme/validators";

type Screen =
  | { type: "overview" }
  | { type: "lesson"; unitId: string; index: number }
  | { type: "quiz"; unitId: string; index: number }
  | { type: "result"; unitId: string; score: number };

function findUnit(module: LearningModuleDef, unitId: string): Unit | null {
  return module.units.find((u) => u.id === unitId) ?? null;
}

export default function LearnModuleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const moduleDef = useMemo(() => (slug ? getModule(slug) : undefined), [slug]);
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>({ type: "overview" });
  const [points, setPoints] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    void (async () => {
      const pointsRaw = await SecureStore.getItemAsync(POINTS_KEY);
      const completedRaw = await SecureStore.getItemAsync(COMPLETED_KEY);
      setPoints(getStoredNumber(pointsRaw));
      setCompleted(parseCompletedUnits(completedRaw));
    })();
  }, []);

  if (!moduleDef) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? "#111111" : "#FFFAEF" }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#F9FAFB" : "#111827",
            }}
          >
            Module not found
          </Text>
          <Pressable
            onPress={() => router.replace("/(tabs)/learn")}
            style={{ marginTop: 10 }}
          >
            <Text style={{ color: "#9C1738", fontWeight: "600" }}>
              Back to Learn
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const awardPoints = (value: number) => {
    setPoints((prev) => {
      const next = prev + value;
      void SecureStore.setItemAsync(POINTS_KEY, String(next));
      return next;
    });
  };

  const markCompleted = (unitId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(unitKey(moduleDef.slug, unitId));
      void SecureStore.setItemAsync(
        COMPLETED_KEY,
        serializeCompletedUnits(next),
      );
      return next;
    });
  };

  const startUnit = (unitId: string) => {
    setAnswers([]);
    setScreen({ type: "lesson", unitId, index: 0 });
  };

  const onAnswer = (choice: number) => {
    if (screen.type !== "quiz") return;
    const unit = findUnit(moduleDef, screen.unitId);
    const question = unit?.quiz[screen.index];
    if (!question) return;
    const isCorrect = choice === question.correctIndex;
    setAnswers((prev) => [...prev, choice]);
    if (isCorrect) awardPoints(2);
  };

  const onNextQuestion = () => {
    if (screen.type !== "quiz") return;
    const unit = findUnit(moduleDef, screen.unitId);
    if (!unit) return;
    if (screen.index + 1 < unit.quiz.length) {
      setScreen({
        type: "quiz",
        unitId: screen.unitId,
        index: screen.index + 1,
      });
      return;
    }
    const score = answers.filter(
      (a, i) => a === unit.quiz[i]?.correctIndex,
    ).length;
    const isFirstTime = !completed.has(unitKey(moduleDef.slug, unit.id));
    if (isFirstTime && score === unit.quiz.length) {
      awardPoints(10);
    }
    markCompleted(unit.id);
    setScreen({ type: "result", unitId: unit.id, score });
  };

  const textPrimary = isDark ? "#F9FAFB" : "#111827";
  const textMuted = "#6B7280";
  const border = isDark ? "#2D2D2D" : "#E5E7EB";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#111111" : "#FFFAEF" }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
      >
        {screen.type === "overview" ? (
          <>
            <Pressable
              onPress={() => router.replace("/(tabs)/learn")}
              style={{ marginBottom: 10 }}
            >
              <Text
                style={{ color: "#9C1738", fontWeight: "600", fontSize: 13 }}
              >
                {"← Learn"}
              </Text>
            </Pressable>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 14,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: textPrimary,
                  }}
                >
                  {moduleDef.title}
                </Text>
                <Text style={{ marginTop: 4, color: textMuted, fontSize: 13 }}>
                  {moduleDef.description}
                </Text>
              </View>
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: "#FEF3C7",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{ color: "#92400E", fontSize: 12, fontWeight: "700" }}
                >
                  ⭐ {points}
                </Text>
              </View>
            </View>
            {moduleDef.units.map((unit) => {
              const done = completed.has(unitKey(moduleDef.slug, unit.id));
              return (
                <Pressable
                  key={unit.id}
                  onPress={() => startUnit(unit.id)}
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: cardBg,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      color: textMuted,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    Unit {unit.number}
                  </Text>
                  <Text
                    style={{
                      marginTop: 3,
                      fontSize: 17,
                      fontWeight: "700",
                      color: textPrimary,
                    }}
                  >
                    {unit.title}
                  </Text>
                  <Text
                    style={{ marginTop: 2, color: textMuted, fontSize: 12 }}
                  >
                    {unit.subtitle}
                  </Text>
                  <Text
                    style={{ marginTop: 5, color: textMuted, fontSize: 11 }}
                  >
                    👉 {unit.goal}
                  </Text>
                  <View
                    style={{
                      marginTop: 8,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: textMuted, fontSize: 11 }}>
                      {unit.lessons.length} lessons · {unit.quiz.length}q
                    </Text>
                    {done ? (
                      <Text
                        style={{
                          color: "#047857",
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        ✓ Done
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </>
        ) : null}

        {screen.type === "lesson" ? (
          <LessonView
            moduleDef={moduleDef}
            screen={screen}
            textPrimary={textPrimary}
            textMuted={textMuted}
            border={border}
            cardBg={cardBg}
            onBack={() => {
              if (screen.index > 0) {
                setScreen({ ...screen, index: screen.index - 1 });
              } else {
                setScreen({ type: "overview" });
              }
            }}
            onNext={() => {
              const unit = findUnit(moduleDef, screen.unitId);
              if (!unit) return;
              if (screen.index + 1 < unit.lessons.length) {
                setScreen({
                  type: "lesson",
                  unitId: screen.unitId,
                  index: screen.index + 1,
                });
              } else {
                setScreen({ type: "quiz", unitId: screen.unitId, index: 0 });
                setAnswers([]);
              }
            }}
          />
        ) : null}

        {screen.type === "quiz" ? (
          <QuizView
            moduleDef={moduleDef}
            screen={screen}
            answers={answers}
            textPrimary={textPrimary}
            textMuted={textMuted}
            border={border}
            cardBg={cardBg}
            onAnswer={onAnswer}
            onExit={() => setScreen({ type: "overview" })}
            onNext={onNextQuestion}
          />
        ) : null}

        {screen.type === "result" ? (
          <ResultView
            moduleDef={moduleDef}
            screen={screen}
            textPrimary={textPrimary}
            textMuted={textMuted}
            onDone={() => setScreen({ type: "overview" })}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function LessonView({
  moduleDef,
  screen,
  textPrimary,
  textMuted,
  border,
  cardBg,
  onBack,
  onNext,
}: {
  moduleDef: LearningModuleDef;
  screen: Extract<Screen, { type: "lesson" }>;
  textPrimary: string;
  textMuted: string;
  border: string;
  cardBg: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const unit = findUnit(moduleDef, screen.unitId);
  const lesson = unit?.lessons[screen.index];
  if (!unit || !lesson) return null;
  return (
    <>
      <Pressable onPress={onBack}>
        <Text style={{ color: "#9C1738", fontWeight: "600", fontSize: 13 }}>
          {"← Back"}
        </Text>
      </Pressable>
      <Text style={{ marginTop: 8, color: textMuted, fontSize: 11 }}>
        Unit {unit.number} · Lesson {screen.index + 1} of {unit.lessons.length}
      </Text>
      <View
        style={{
          marginTop: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: cardBg,
          padding: 14,
        }}
      >
        <Text style={{ fontSize: 48, textAlign: "center" }}>
          {lesson.emoji}
        </Text>
        <Text
          style={{
            marginTop: 10,
            fontSize: 22,
            fontWeight: "700",
            color: textPrimary,
          }}
        >
          {lesson.title}
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: textMuted,
            fontSize: 14,
            lineHeight: 22,
          }}
        >
          {lesson.body}
        </Text>
        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {lesson.examples.map((example) => (
            <View
              key={example}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: border,
                paddingHorizontal: 9,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: textPrimary, fontSize: 11 }}>
                {example}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Pressable
        onPress={onNext}
        style={{
          marginTop: 16,
          borderRadius: 12,
          backgroundColor: "#9C1738",
          paddingVertical: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>
          {screen.index + 1 < unit.lessons.length
            ? "Next lesson"
            : "Start quiz →"}
        </Text>
      </Pressable>
    </>
  );
}

function QuizView({
  moduleDef,
  screen,
  answers,
  textPrimary,
  textMuted,
  border,
  cardBg,
  onAnswer,
  onExit,
  onNext,
}: {
  moduleDef: LearningModuleDef;
  screen: Extract<Screen, { type: "quiz" }>;
  answers: number[];
  textPrimary: string;
  textMuted: string;
  border: string;
  cardBg: string;
  onAnswer: (choice: number) => void;
  onExit: () => void;
  onNext: () => void;
}) {
  const unit = findUnit(moduleDef, screen.unitId);
  const question = unit?.quiz[screen.index];
  if (!unit || !question) return null;
  const selected = answers[screen.index];
  const hasAnswered = selected !== undefined;
  const isCorrect = selected === question.correctIndex;
  return (
    <>
      <Pressable onPress={onExit}>
        <Text style={{ color: "#9C1738", fontWeight: "600", fontSize: 13 }}>
          {"← Exit quiz"}
        </Text>
      </Pressable>
      <Text style={{ marginTop: 8, color: textMuted, fontSize: 11 }}>
        Unit {unit.number} · Quiz {screen.index + 1}/{unit.quiz.length}
      </Text>
      <View
        style={{
          marginTop: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: cardBg,
          padding: 14,
        }}
      >
        <Text style={{ color: textMuted, fontSize: 11, fontWeight: "700" }}>
          QUESTION {screen.index + 1}
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: textPrimary,
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          {question.question}
        </Text>
      </View>
      <View style={{ marginTop: 10, gap: 8 }}>
        {question.options.map((option, index) => {
          const isSelected = selected === index;
          const isTheCorrect = index === question.correctIndex;
          return (
            <Pressable
              key={option}
              disabled={hasAnswered}
              onPress={() => onAnswer(index)}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: hasAnswered
                  ? isTheCorrect
                    ? "#10B981"
                    : isSelected && !isCorrect
                      ? "#FB7185"
                      : border
                  : border,
                backgroundColor: hasAnswered
                  ? isTheCorrect
                    ? "#ECFDF5"
                    : isSelected && !isCorrect
                      ? "#FFF1F2"
                      : cardBg
                  : cardBg,
                padding: 12,
              }}
            >
              <Text
                style={{ color: textPrimary, fontSize: 14, fontWeight: "500" }}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hasAnswered ? (
        <View
          style={{
            marginTop: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isCorrect ? "#A7F3D0" : "#FDE68A",
            backgroundColor: isCorrect ? "#ECFDF5" : "#FFFBEB",
            padding: 12,
          }}
        >
          <Text
            style={{
              color: isCorrect ? "#047857" : "#B45309",
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {isCorrect ? "Nice! +2 points" : "Not quite."}
          </Text>
          <Text style={{ marginTop: 4, color: textMuted, fontSize: 12 }}>
            {question.explanation}
          </Text>
        </View>
      ) : null}
      {hasAnswered ? (
        <Pressable
          onPress={onNext}
          style={{
            marginTop: 14,
            borderRadius: 12,
            backgroundColor: "#9C1738",
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>
            {screen.index + 1 < unit.quiz.length
              ? "Next question"
              : "See results"}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

function ResultView({
  moduleDef,
  screen,
  textPrimary,
  textMuted,
  onDone,
}: {
  moduleDef: LearningModuleDef;
  screen: Extract<Screen, { type: "result" }>;
  textPrimary: string;
  textMuted: string;
  onDone: () => void;
}) {
  const unit = findUnit(moduleDef, screen.unitId);
  if (!unit) return null;
  const total = unit.quiz.length;
  const perfect = screen.score === total;
  const earned = screen.score * 2 + (perfect ? 10 : 0);
  return (
    <View style={{ alignItems: "center", marginTop: 30 }}>
      <Text style={{ fontSize: 62 }}>{perfect ? "🏆" : "🎉"}</Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 24,
          fontWeight: "700",
          color: textPrimary,
        }}
      >
        {perfect ? "Perfect score!" : "Nice work!"}
      </Text>
      <Text
        style={{
          marginTop: 8,
          color: textMuted,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        You got {screen.score} out of {total} correct on Unit {unit.number}:{" "}
        {unit.title}.
      </Text>
      <View
        style={{
          marginTop: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#FDE68A",
          backgroundColor: "#FFFBEB",
          paddingVertical: 10,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ color: "#B45309", fontSize: 12, fontWeight: "700" }}>
          Points earned
        </Text>
        <Text
          style={{
            color: "#B45309",
            fontSize: 28,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          +{earned}
        </Text>
      </View>
      <Pressable
        onPress={onDone}
        style={{
          marginTop: 16,
          borderRadius: 12,
          backgroundColor: "#9C1738",
          paddingVertical: 12,
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>
          Back to units
        </Text>
      </Pressable>
    </View>
  );
}
