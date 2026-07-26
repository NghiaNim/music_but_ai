/**
 * Resolves the small, fixed set of Tailwind `from-*`/`to-*` gradient class
 * strings used in `apps/nextjs/src/app/learn/_lib/modules.ts` into a
 * [fromColor, toColor] pair for `expo-linear-gradient`. Not a general
 * Tailwind-to-RN parser — only the color/shade combinations actually used
 * in the learn module data are in the table below.
 */

const TAILWIND_HEX: Record<string, string> = {
  "violet-100": "#ede9fe",
  "violet-200": "#ddd6fe",
  "violet-900": "#4c1d95",
  "violet-950": "#2e1065",
  "fuchsia-50": "#fdf4ff",
  "fuchsia-100": "#fae8ff",
  "fuchsia-900": "#701a75",
  "fuchsia-950": "#4a044e",
  "rose-100": "#ffe4e6",
  "rose-50": "#fff1f2",
  "rose-950": "#4c0519",
  "pink-50": "#fdf2f8",
  "pink-900": "#831843",
  "emerald-100": "#d1fae5",
  "emerald-50": "#ecfdf5",
  "emerald-900": "#064e3b",
  "emerald-950": "#022c22",
  "teal-50": "#f0fdfa",
  "teal-900": "#134e4a",
  "amber-100": "#fef3c7",
  "amber-200": "#fde68a",
  "amber-400": "#fbbf24",
  "amber-50": "#fffbeb",
  "amber-900": "#78350f",
  "amber-950": "#451a03",
  "yellow-50": "#fefce8",
  "yellow-100": "#fef9c3",
  "yellow-900": "#713f12",
  "yellow-950": "#422006",
  "sky-100": "#e0f2fe",
  "sky-50": "#f0f9ff",
  "sky-900": "#0c4a6e",
  "sky-950": "#082f49",
  "indigo-50": "#eef2ff",
  "indigo-900": "#312e81",
  "orange-100": "#ffedd5",
  "orange-50": "#fff7ed",
  "orange-400": "#fb923c",
  "orange-900": "#7c2d12",
  "orange-950": "#431407",
  "purple-50": "#faf5ff",
  "purple-900": "#581c87",
  "blue-50": "#eff6ff",
  "blue-900": "#1e3a8a",
};

function hexToRgba(hex: string, alphaPct: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alphaPct / 100})`;
}

function resolveToken(token: string | undefined): string | undefined {
  if (!token) return undefined;
  const withoutSide = token.replace(/^(from|to)-/, "");
  const [colorShade, opacity] = withoutSide.split("/");
  const hex = colorShade ? TAILWIND_HEX[colorShade] : undefined;
  if (!hex) return undefined;
  return opacity ? hexToRgba(hex, Number(opacity)) : hex;
}

export function resolveGradient(
  gradientClass: string,
  isDark: boolean,
): [string, string] {
  const tokens = gradientClass.split(/\s+/);
  const lightFrom = tokens.find((t) => t.startsWith("from-"));
  const lightTo = tokens.find((t) => t.startsWith("to-"));
  const darkFrom = tokens
    .find((t) => t.startsWith("dark:from-"))
    ?.replace("dark:", "");
  const darkTo = tokens
    .find((t) => t.startsWith("dark:to-"))
    ?.replace("dark:", "");

  const fromToken = isDark ? (darkFrom ?? lightFrom) : lightFrom;
  const toToken = isDark ? (darkTo ?? lightTo) : lightTo;

  return [
    resolveToken(fromToken) ?? "#F4F4F5",
    resolveToken(toToken) ?? "#E4E4E7",
  ];
}
