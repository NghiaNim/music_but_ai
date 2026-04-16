"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

const POINTS_KEY = "classica-points";
const COMPLETED_KEY = "classica-completed-modules";

// ─── Content ────────────────────────────────────────────────

interface Lesson {
  title: string;
  emoji: string;
  gradient: string;
  body: string;
  examples: string[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Unit {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  goal: string;
  emoji: string;
  gradient: string;
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

const UNITS: Unit[] = [
  {
    id: "families",
    number: 1,
    title: "Instrument Families",
    subtitle: "The big picture",
    goal: "I can roughly categorize sound",
    emoji: "🎼",
    gradient: "from-violet-100 to-fuchsia-50 dark:from-violet-900/40",
    lessons: [
      {
        title: "Strings",
        emoji: "🎻",
        gradient: "from-rose-100 to-pink-50",
        body: "Made from strings that vibrate when bowed, plucked, or struck. Warm, expressive, and often the emotional heart of the orchestra.",
        examples: ["Violin", "Viola", "Cello", "Double Bass", "Harp"],
      },
      {
        title: "Woodwinds",
        emoji: "🎷",
        gradient: "from-emerald-100 to-teal-50",
        body: "Sound from vibrating air — either through a reed or across an opening. Light, agile, and colorful.",
        examples: ["Flute", "Clarinet", "Oboe", "Bassoon", "Saxophone"],
      },
      {
        title: "Brass",
        emoji: "🎺",
        gradient: "from-amber-100 to-yellow-50",
        body: "Sound is made by buzzing your lips into a mouthpiece. Bold, powerful, and often used for dramatic moments.",
        examples: ["Trumpet", "French Horn", "Trombone", "Tuba"],
      },
      {
        title: "Percussion",
        emoji: "🥁",
        gradient: "from-sky-100 to-indigo-50",
        body: "Hit, shaken, or scraped to create sound. Provides rhythm, punctuation, and sometimes melody.",
        examples: ["Timpani", "Snare Drum", "Cymbals", "Xylophone", "Triangle"],
      },
    ],
    quiz: [
      {
        question: "Which family does the violin belong to?",
        options: ["Brass", "Strings", "Woodwinds", "Percussion"],
        correctIndex: 1,
        explanation:
          "The violin is the most iconic string instrument — its strings vibrate when bowed.",
      },
      {
        question: "What family produces sound by buzzing lips?",
        options: ["Woodwinds", "Percussion", "Brass", "Strings"],
        correctIndex: 2,
        explanation:
          "Brass players vibrate their lips against the mouthpiece to make the horn sing.",
      },
      {
        question: "Which of these is a woodwind instrument?",
        options: ["Tuba", "Clarinet", "Cello", "Timpani"],
        correctIndex: 1,
        explanation:
          "The clarinet uses a single reed that vibrates to produce its sound.",
      },
      {
        question: "Which family is the timpani part of?",
        options: ["Percussion", "Strings", "Brass", "Woodwinds"],
        correctIndex: 0,
        explanation:
          "Timpani (or kettle drums) are tuned drums — classic percussion.",
      },
    ],
  },
  {
    id: "spotlight",
    number: 2,
    title: "Spotlight Instruments",
    subtitle: "The stars up close",
    goal: "I can recognize common instruments",
    emoji: "⭐",
    gradient: "from-amber-100 to-orange-50 dark:from-amber-900/40",
    lessons: [
      {
        title: "Violin",
        emoji: "🎻",
        gradient: "from-rose-100 to-pink-50",
        body: "The soprano of the orchestra — often carries the melody. Played with a bow (arco) or plucked (pizzicato). Four strings tuned G–D–A–E.",
        examples: ["Bright & singing", "String family", "4 strings"],
      },
      {
        title: "Flute",
        emoji: "🎶",
        gradient: "from-emerald-100 to-teal-50",
        body: "A woodwind with no reed — sound is made by blowing across a hole. Bright, clear, and agile. The piccolo is its tiny, even higher cousin.",
        examples: ["Airy & bright", "Woodwind family", "No reed"],
      },
      {
        title: "Trumpet",
        emoji: "🎺",
        gradient: "from-amber-100 to-yellow-50",
        body: "Three valves let you change pitch. Bold and piercing — used in jazz, classical, fanfares, and marching bands alike.",
        examples: ["Bold & bright", "Brass family", "3 valves"],
      },
      {
        title: "Piano",
        emoji: "🎹",
        gradient: "from-sky-100 to-indigo-50",
        body: "88 keys, each striking tuned strings inside. Sometimes called a percussion instrument because of the hammers. A whole orchestra in one box.",
        examples: ["88 keys", "Hammers & strings", "Huge range"],
      },
    ],
    quiz: [
      {
        question: "Which instrument is played with a bow?",
        options: ["Flute", "Trumpet", "Violin", "Piano"],
        correctIndex: 2,
        explanation:
          "The violin is bowed (or plucked) — the bow is drawn across the strings.",
      },
      {
        question: "How does a flute make sound?",
        options: [
          "By buzzing the lips",
          "Blowing across an opening",
          "Hammering strings",
          "Using a double reed",
        ],
        correctIndex: 1,
        explanation:
          "Unlike the clarinet or oboe, the flute has no reed — sound is made by blowing across its mouth hole.",
      },
      {
        question: "How many keys does a standard piano have?",
        options: ["76", "88", "100", "64"],
        correctIndex: 1,
        explanation: "A standard modern piano has 88 keys — 52 white, 36 black.",
      },
      {
        question: "Which of these is a brass instrument?",
        options: ["Clarinet", "Cello", "Trumpet", "Xylophone"],
        correctIndex: 2,
        explanation:
          "The trumpet is brass — three valves and a buzzing lip vibration.",
      },
    ],
  },
];

// ─── Types ──────────────────────────────────────────────────

type Screen =
  | { type: "overview" }
  | { type: "lesson"; unitId: string; index: number }
  | { type: "quiz"; unitId: string; index: number }
  | { type: "result"; unitId: string; score: number };

// ─── Helpers ────────────────────────────────────────────────

function getStoredNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(key);
  return v ? Number(v) || 0 : 0;
}

function getStoredSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

// ─── Main component ─────────────────────────────────────────

export function InstrumentsModule() {
  const [screen, setScreen] = useState<Screen>({ type: "overview" });
  const [points, setPoints] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    setPoints(getStoredNumber(POINTS_KEY));
    setCompleted(getStoredSet(COMPLETED_KEY));
  }, []);

  function awardPoints(amount: number) {
    setPoints((prev) => {
      const next = prev + amount;
      window.localStorage.setItem(POINTS_KEY, String(next));
      return next;
    });
  }

  function markCompleted(unitId: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(unitId);
      window.localStorage.setItem(COMPLETED_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function startUnit(unitId: string) {
    setAnswers([]);
    setScreen({ type: "lesson", unitId, index: 0 });
  }

  function advance() {
    if (screen.type !== "lesson") return;
    const unit = UNITS.find((u) => u.id === screen.unitId)!;
    if (screen.index + 1 < unit.lessons.length) {
      setScreen({
        type: "lesson",
        unitId: screen.unitId,
        index: screen.index + 1,
      });
    } else {
      setScreen({ type: "quiz", unitId: screen.unitId, index: 0 });
    }
  }

  function back() {
    if (screen.type === "lesson" && screen.index > 0) {
      setScreen({ ...screen, index: screen.index - 1 });
    } else {
      setScreen({ type: "overview" });
    }
  }

  function answerQuestion(choiceIndex: number) {
    if (screen.type !== "quiz") return;
    const unit = UNITS.find((u) => u.id === screen.unitId)!;
    const question = unit.quiz[screen.index]!;
    const isCorrect = choiceIndex === question.correctIndex;
    const newAnswers = [...answers, choiceIndex];
    setAnswers(newAnswers);
    if (isCorrect) awardPoints(2);
  }

  function nextQuestion() {
    if (screen.type !== "quiz") return;
    const unit = UNITS.find((u) => u.id === screen.unitId)!;
    if (screen.index + 1 < unit.quiz.length) {
      setScreen({ ...screen, index: screen.index + 1 });
    } else {
      const score = answers.filter(
        (a, i) => a === unit.quiz[i]!.correctIndex,
      ).length;
      const isFirstTime = !completed.has(unit.id);
      if (isFirstTime && score === unit.quiz.length) {
        awardPoints(10);
      }
      markCompleted(unit.id);
      setScreen({ type: "result", unitId: screen.unitId, score });
    }
  }

  // ─── Render ────────────────────────────────────────────

  if (screen.type === "overview") {
    return (
      <OverviewScreen
        points={points}
        completed={completed}
        onStart={startUnit}
      />
    );
  }

  const unit = UNITS.find((u) => u.id === screen.unitId)!;

  if (screen.type === "lesson") {
    const lesson = unit.lessons[screen.index]!;
    return (
      <LessonScreen
        unit={unit}
        lesson={lesson}
        index={screen.index}
        total={unit.lessons.length}
        onBack={back}
        onNext={advance}
      />
    );
  }

  if (screen.type === "quiz") {
    const question = unit.quiz[screen.index]!;
    const selected = answers[screen.index];
    return (
      <QuizScreen
        unit={unit}
        question={question}
        index={screen.index}
        total={unit.quiz.length}
        selected={selected}
        onAnswer={answerQuestion}
        onNext={nextQuestion}
        onExit={() => setScreen({ type: "overview" })}
      />
    );
  }

  return (
    <ResultScreen
      unit={unit}
      score={screen.score}
      total={unit.quiz.length}
      onDone={() => setScreen({ type: "overview" })}
    />
  );
}

// ─── Overview ────────────────────────────────────────────────

function OverviewScreen({
  points,
  completed,
  onStart,
}: {
  points: number;
  completed: Set<string>;
  onStart: (unitId: string) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/learn"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Learn
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Meet the Instruments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Short modules & quizzes — earn points!
          </p>
        </div>
        <PointsBadge points={points} />
      </div>

      <div className="flex flex-col gap-3">
        {UNITS.map((unit) => (
          <button
            key={unit.id}
            onClick={() => onStart(unit.id)}
            className={cn(
              "bg-linear-to-br relative overflow-hidden rounded-2xl border p-5 text-left transition-all active:scale-[0.99]",
              unit.gradient,
            )}
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/70 text-2xl shadow-sm dark:bg-black/20">
                {unit.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wider uppercase text-zinc-700 dark:text-zinc-300">
                  Unit {unit.number}
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {unit.title}
                </h2>
                <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
                  {unit.subtitle}
                </p>
                <p className="text-muted-foreground mt-2 text-xs italic">
                  👉 {unit.goal}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {completed.has(unit.id) && (
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    ✓ Done
                  </span>
                )}
                <span className="text-muted-foreground text-xs">
                  {unit.lessons.length} lessons · {unit.quiz.length}q
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed p-4 text-center">
        <p className="text-sm font-semibold">How points work</p>
        <p className="text-muted-foreground mt-1 text-xs">
          +2 for each correct answer · +10 bonus for perfect unit
        </p>
      </div>
    </div>
  );
}

// ─── Lesson ──────────────────────────────────────────────────

function LessonScreen({
  unit,
  lesson,
  index,
  total,
  onBack,
  onNext,
}: {
  unit: Unit;
  lesson: Lesson;
  index: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back
        </button>
        <p className="text-muted-foreground text-xs font-medium">
          Unit {unit.number} · Lesson {index + 1} of {total}
        </p>
      </div>

      <ProgressBar value={(index + 1) / (total + 1)} />

      <div
        className={cn(
          "bg-linear-to-br mt-5 flex aspect-square w-full items-center justify-center rounded-2xl border",
          lesson.gradient,
        )}
      >
        <span className="text-8xl">{lesson.emoji}</span>
      </div>

      <h2 className="mt-5 text-2xl font-bold tracking-tight">{lesson.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {lesson.body}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {lesson.examples.map((ex) => (
          <span
            key={ex}
            className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {ex}
          </span>
        ))}
      </div>

      <Button onClick={onNext} size="lg" className="mt-8 w-full">
        {index + 1 < total ? "Next lesson" : "Start quiz →"}
      </Button>
    </div>
  );
}

// ─── Quiz ────────────────────────────────────────────────────

function QuizScreen({
  unit,
  question,
  index,
  total,
  selected,
  onAnswer,
  onNext,
  onExit,
}: {
  unit: Unit;
  question: QuizQuestion;
  index: number;
  total: number;
  selected: number | undefined;
  onAnswer: (choice: number) => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const hasAnswered = selected !== undefined;
  const isCorrect = selected === question.correctIndex;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Exit quiz
        </button>
        <p className="text-muted-foreground text-xs font-medium">
          Unit {unit.number} · Quiz · {index + 1}/{total}
        </p>
      </div>

      <ProgressBar
        value={
          (unit.lessons.length + index + (hasAnswered ? 1 : 0)) /
          (unit.lessons.length + total)
        }
      />

      <div className="mt-6 rounded-2xl border bg-white p-5 dark:bg-zinc-900">
        <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
          Question {index + 1}
        </p>
        <h2 className="text-lg font-semibold leading-snug">
          {question.question}
        </h2>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isSelected = selected === i;
          const isTheCorrect = i === question.correctIndex;
          return (
            <button
              key={option}
              onClick={() => !hasAnswered && onAnswer(i)}
              disabled={hasAnswered}
              className={cn(
                "flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm transition-all dark:bg-zinc-900",
                !hasAnswered &&
                  "hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-zinc-800",
                hasAnswered &&
                  isTheCorrect &&
                  "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30",
                hasAnswered &&
                  isSelected &&
                  !isCorrect &&
                  "border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/30",
              )}
            >
              <span className="font-medium">{option}</span>
              {hasAnswered && isTheCorrect && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  ✓
                </span>
              )}
              {hasAnswered && isSelected && !isCorrect && (
                <span className="text-rose-600 dark:text-rose-400">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {hasAnswered && (
        <div
          className={cn(
            "mt-4 rounded-xl border p-4",
            isCorrect
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
              : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
          )}
        >
          <p
            className={cn(
              "text-sm font-semibold",
              isCorrect
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-amber-700 dark:text-amber-300",
            )}
          >
            {isCorrect ? "Nice! +2 points" : "Not quite."}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {question.explanation}
          </p>
        </div>
      )}

      {hasAnswered && (
        <Button onClick={onNext} size="lg" className="mt-4 w-full">
          {index + 1 < total ? "Next question" : "See results"}
        </Button>
      )}
    </div>
  );
}

// ─── Result ──────────────────────────────────────────────────

function ResultScreen({
  unit,
  score,
  total,
  onDone,
}: {
  unit: Unit;
  score: number;
  total: number;
  onDone: () => void;
}) {
  const perfect = score === total;
  const earned = score * 2 + (perfect ? 10 : 0);

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={cn(
          "bg-linear-to-br mt-2 flex size-32 items-center justify-center rounded-full text-6xl",
          perfect
            ? "from-amber-200 to-yellow-100"
            : "from-violet-200 to-fuchsia-100",
        )}
      >
        {perfect ? "🏆" : "🎉"}
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight">
        {perfect ? "Perfect score!" : "Nice work!"}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-xs text-sm">
        You got {score} out of {total} correct on Unit {unit.number}:{" "}
        {unit.title}.
      </p>

      <div className="mt-6 rounded-2xl border bg-white p-4 dark:bg-zinc-900">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Points earned
        </p>
        <p className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">
          +{earned}
        </p>
        {perfect && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Includes +10 perfect bonus
          </p>
        )}
      </div>

      <Button onClick={onDone} size="lg" className="mt-8 w-full max-w-xs">
        Back to units
      </Button>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────

function PointsBadge({ points }: { points: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1.5 dark:border-amber-700 dark:bg-amber-900/40">
      <span className="text-base">⭐</span>
      <span className="text-sm font-bold text-amber-800 dark:text-amber-200">
        {points}
      </span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-full bg-linear-to-r from-amber-400 to-orange-400 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}
