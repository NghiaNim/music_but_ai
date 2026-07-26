import { useColorScheme } from "react-native";

import type { Palette } from "./colors";
import { darkPalette, lightPalette, staticColors } from "./colors";

export type { Palette } from "./colors";
export { darkPalette, lightPalette, staticColors } from "./colors";

/**
 * Resolve the active palette from the system appearance.
 * Mirrors the web's class-based dark mode (mobile follows the OS setting).
 */
export function usePalette(): { palette: Palette; isDark: boolean } {
  const isDark = useColorScheme() === "dark";
  return { palette: isDark ? darkPalette : lightPalette, isDark };
}

/** Corner radii matching the web scale (`--radius: 0.75rem`). */
export const radius = {
  /** `rounded-xl` list rows / inputs. */
  lg: 12,
  /** `rounded-2xl` cards. */
  card: 16,
  /** `rounded-full` pills & chips. */
  full: 999,
} as const;

/** iOS shadow approximating the web `shadow-sm` token. */
export const shadowCard = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 5,
  elevation: 2,
} as const;

/** Type scale matching Tailwind's text-xs … text-3xl. */
export const typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;
