// Groove Sesh — Dark-first galaxy/neon theme.
// Single dark scheme (the app is always dark). Values come from design_guidelines.json.
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#0D0D12",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#1A1A24",
  onSurfaceSecondary: "#E2E8F0",
  surfaceTertiary: "#262636",
  onSurfaceTertiary: "#CBD5E1",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#0D0D12",

  brand: "#A855F7",
  onBrand: "#FFFFFF",
  brandPrimary: "#D946EF",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#06B6D4",
  onBrandSecondary: "#000000",
  brandTertiary: "#8B5CF6",
  onBrandTertiary: "#FFFFFF",

  success: "#10B981",
  onSuccess: "#FFFFFF",
  warning: "#F59E0B",
  onWarning: "#FFFFFF",
  error: "#EF4444",
  onError: "#FFFFFF",
  info: "#3B82F6",
  onInfo: "#FFFFFF",

  border: "#2E324A",
  borderStrong: "#D946EF",
  divider: "#1F2233",
  muted: "#64748B",
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
  display: "Rajdhani",
  displayBold: "RajdhaniBold",
  text: "IBMPlexSans",
  textMedium: "IBMPlexSansMedium",
};

// Deterministic neon colors for track lanes / waveforms.
export const trackColors = ["#06B6D4", "#D946EF", "#8B5CF6", "#10B981", "#F59E0B", "#3B82F6"];
