/**
 * Native color palette mirroring the web theme tokens.
 *
 * Semantic values are sRGB hex conversions of the oklch tokens in
 * `tooling/tailwind/theme.css` (light `:root` / `@variant dark`). The shell
 * and header values bake in the web's amber overlays (`bg-amber-50/50`,
 * `bg-amber-50/90`, dark `amber-950/10`, `amber-950/90`) over `--background`
 * so screens get the final composited color without runtime alpha stacking.
 *
 * Screens must consume colors from here (via `usePalette()` in `~/theme`)
 * instead of introducing new hex literals.
 */

export interface Palette {
  /** Composited app shell background (web: body + `bg-amber-50/50`). */
  background: string;
  /** Raw `--background` token (used behind full-bleed flows). */
  surface: string;
  card: string;
  cardForeground: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  border: string;
  input: string;
  destructive: string;
  /** Glass header/tab bar fill (web: `bg-amber-50/90` over shell). */
  header: string;
  headerBorder: string;
  /** Ton Ton avatar circle (web: `#F5E6DC` / `rose-950/30`). */
  tonTonCircle: string;
  /** Emerald accent (tickets / free / buy CTAs). */
  emerald: string;
  emeraldSoft: string;
  emeraldForeground: string;
  /** Warm amber accents (hero washes, calendar thumbs, progress bars). */
  amberSoft: string;
  amberStrong: string;
  /** Chip / pill background on cards. */
  chipBg: string;
  chipBorder: string;
}

export const lightPalette: Palette = {
  background: "#FEFAF4",
  surface: "#FCFAFD",
  card: "#FFFFFF",
  cardForeground: "#1E1B20",
  foreground: "#1E1B20",
  mutedForeground: "#797380",
  primary: "#9C1738",
  primaryForeground: "#FFFFFF",
  secondary: "#F7F2F9",
  secondaryForeground: "#5A5360",
  border: "#EFE9F4",
  input: "#FFFFFF",
  destructive: "#EF4444",
  header: "#FFFBEC",
  headerBorder: "#FDE68A",
  tonTonCircle: "#F5E6DC",
  emerald: "#059669",
  emeraldSoft: "#ECFDF5",
  emeraldForeground: "#065F46",
  amberSoft: "#FEF3C7",
  amberStrong: "#D97706",
  chipBg: "#F7F2F9",
  chipBorder: "#EFE9F4",
};

export const darkPalette: Palette = {
  background: "#191214",
  surface: "#141116",
  card: "#141116",
  cardForeground: "#F9F7FB",
  foreground: "#F9F7FB",
  mutedForeground: "#8C8691",
  primary: "#BB4F5E",
  primaryForeground: "#141116",
  secondary: "#252128",
  secondaryForeground: "#A8A2AE",
  border: "#2F2A33",
  input: "#252128",
  destructive: "#7F1D1D",
  header: "#411905",
  headerBorder: "#2D1200",
  tonTonCircle: "#250D17",
  emerald: "#10B981",
  emeraldSoft: "#022C22",
  emeraldForeground: "#6EE7B7",
  amberSoft: "#2D1200",
  amberStrong: "#F59E0B",
  chipBg: "#252128",
  chipBorder: "#2F2A33",
};

/**
 * Accents the web renders identically in both modes.
 */
export const staticColors = {
  /** Profile avatar circle — `bg-[#F8E8EE]` (no dark variant on web). */
  profileAvatarPink: "#F8E8EE",
  /** Onboarding cream backdrop — `#FEFCED`. */
  onboardingCream: "#FEFCED",
  /** Brand crimson used literally on web (`style={{color:"#9C1738"}}`). */
  brandCrimson: "#9C1738",
  white: "#FFFFFF",
} as const;
