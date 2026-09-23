// Groove Sesh — Dark-first galaxy/neon theme.
// Single dark scheme (the app is always dark). Values come from design_guidelines.json.
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#02050B",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#071A2B",
  onSurfaceSecondary: "#A7DFFF",
  surfaceTertiary: "#0C2C46",
  onSurfaceTertiary: "#91AFC2",
  surfaceInverse: "#EAF6FF",
  onSurfaceInverse: "#02050B",

  brand: "#2DA4FF",
  onBrand: "#FFFFFF",
  brandPrimary: "#2DA4FF",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#54BAFF",
  onBrandSecondary: "#001018",
  brandTertiary: "#C978FF",
  onBrandTertiary: "#FFFFFF",

  success: "#79FF45",
  onSuccess: "#04120A",
  warning: "#FFB020",
  onWarning: "#1A1200",
  error: "#FF5A6A",
  onError: "#FFFFFF",
  info: "#66CAFF",
  onInfo: "#001018",

  border: "#12405F",
  borderStrong: "#2D9BE4",
  divider: "#0E2438",
  muted: "#7FA9BF",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "light" satisfies ColorScheme;

// Both scheme keys map to the same galaxy palette so the app is always dark.
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light: dark, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const fonts = {
  // Space Grotesk — clean, bold, modern display for brand, headings & buttons
  display: "SpaceGroteskMedium",
  displayBold: "SpaceGroteskBold",
  displayBlack: "SpaceGroteskBold",
  // Rajdhani — condensed numerics for timecodes / durations / metrics
  numeric: "RajdhaniBold",
  numericMedium: "Rajdhani",
  // IBM Plex Sans — clean body & UI labels
  text: "IBMPlexSans",
  textMedium: "IBMPlexSansMedium",
};

// Reusable neon glow shadow presets.
export const glow = (color: string, radius = 16, opacity = 0.8) => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: 0 },
  elevation: Math.round(radius / 2),
});

// Deterministic neon colors for track lanes / waveforms.
export const trackColors = ["#2DA4FF", "#54BAFF", "#C978FF", "#79FF45", "#66CAFF", "#38BDF8"];

// Deterministic galaxy cover palette from a session id (procedural cover art).
const coverPalettes: [string, string, string][] = [
  ["#2DA4FF", "#3B1354", "#54BAFF"],
  ["#54BAFF", "#102D5A", "#C978FF"],
  ["#C978FF", "#3B1354", "#2DA4FF"],
  ["#79FF45", "#102D5A", "#54BAFF"],
  ["#2DA4FF", "#0C2C46", "#C978FF"],
  ["#66CAFF", "#3B1354", "#2DA4FF"],
];
export function coverPalette(id: string): [string, string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return coverPalettes[h % coverPalettes.length];
}
export function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
