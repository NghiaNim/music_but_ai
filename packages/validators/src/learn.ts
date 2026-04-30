export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  body: string;
  examples: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  estMinutes: string;
  objective?: string;
  goal?: string;
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

export interface LearningModuleDef {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  cardIcon: string;
  cardGradient: string;
  heroEmoji: string;
  units: Unit[];
}

interface LearnModuleExports {
  MODULES: LearningModuleDef[];
  getModule: (slug: string) => LearningModuleDef | undefined;
}

declare const require: (id: string) => unknown;
const learnModuleExports = require("../../../apps/nextjs/src/app/learn/_lib/modules") as LearnModuleExports;
export const MODULES = learnModuleExports.MODULES;
export const getModule = learnModuleExports.getModule;

export const POINTS_KEY = "classica-points";
export const COMPLETED_KEY = "classica-completed-units";

export function unitKey(moduleSlug: string, unitId: string): string {
  return `${moduleSlug}:${unitId}`;
}

export function parseCompletedUnits(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function serializeCompletedUnits(values: Set<string>): string {
  return JSON.stringify([...values]);
}

export function getStoredNumber(raw: string | null): number {
  return raw ? Number(raw) || 0 : 0;
}

export function countCompletedInModule(
  set: Set<string>,
  moduleSlug: string,
): number {
  let count = 0;
  for (const key of set) {
    if (key.startsWith(`${moduleSlug}:`)) count += 1;
  }
  return count;
}

export interface LearningLevel {
  min: number;
  name: string;
}

export const LEARNING_LEVELS: readonly LearningLevel[] = [
  { min: 0, name: "Newcomer" },
  { min: 20, name: "Curious Listener" },
  { min: 50, name: "Music Explorer" },
  { min: 100, name: "Seasoned Ear" },
  { min: 160, name: "Music Connoisseur" },
] as const;

export function getLearningLevel(points: number) {
  const firstLevel = LEARNING_LEVELS[0];
  if (!firstLevel) {
    return { current: { min: 0, name: "Newcomer" }, currentIndex: 0, next: undefined };
  }
  let current = firstLevel;
  for (const level of LEARNING_LEVELS) {
    if (points >= level.min) current = level;
  }
  const currentIndex = LEARNING_LEVELS.findIndex((l) => l.name === current.name);
  const next = LEARNING_LEVELS[currentIndex + 1];
  return { current, currentIndex, next };
}

export interface BadgeDefinition {
  id: string;
  baseLabel: string;
  imageKey: string;
  category: "attended" | "listened";
  composer?: string;
}

export const BADGE_LEVELS = [
  { level: 1, numeral: "I", requirement: 3 },
  { level: 2, numeral: "II", requirement: 6 },
  { level: 3, numeral: "III", requirement: 9 },
] as const;

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    id: "beethoven",
    baseLabel: "Beethoven Lover",
    imageKey: "beethoven",
    category: "attended",
    composer: "Beethoven",
  },
  {
    id: "mozart",
    baseLabel: "Mozart Lover",
    imageKey: "mozart",
    category: "attended",
    composer: "Mozart",
  },
  {
    id: "bach",
    baseLabel: "Bach Lover",
    imageKey: "bach",
    category: "attended",
    composer: "Bach",
  },
  {
    id: "chopin",
    baseLabel: "Chopin Lover",
    imageKey: "chopin",
    category: "attended",
    composer: "Chopin",
  },
  {
    id: "baroque",
    baseLabel: "Baroque Era Enthusiast",
    imageKey: "baroque",
    category: "listened",
  },
  {
    id: "romantic",
    baseLabel: "Romantic Era Enthusiast",
    imageKey: "romantic",
    category: "listened",
  },
  {
    id: "classical",
    baseLabel: "Classical Era Enthusiast",
    imageKey: "classical",
    category: "listened",
  },
] as const;

