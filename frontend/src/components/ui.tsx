import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Linking, Platform, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Svg, { Defs, RadialGradient, Rect, Stop, Circle } from "react-native-svg";
import { makeStyles, useTheme, fonts, glow, coverPalette, seedFrom } from "@/src/theme";
import { GROOVE_LABS_URL } from "@/src/config";
import { Wordmark, InfinityMark } from "@/src/components/wordmark";
import { Waveform } from "@/src/components/waveform";

export { Wordmark, InfinityMark };

/** Smooth GroovLabz blue/purple radial nebula (matches homepage CSS). */
export function GalaxyBackground({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const stars = React.useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const s = seedFrom(`star${i}`);
        return {
          x: (s % 1000) / 1000,
          y: ((s >> 10) % 1000) / 1000,
          r: 0.6 + ((s >> 3) % 10) / 8,
          o: 0.12 + ((s >> 6) % 30) / 100,
        };
      }),
    [],
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="n1" cx="20%" cy="2%" rx="70%" ry="55%" fx="20%" fy="2%">
            <Stop offset="0" stopColor="#102D5A" stopOpacity="0.95" />
            <Stop offset="0.55" stopColor="#102D5A" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="n2" cx="84%" cy="16%" rx="62%" ry="50%" fx="84%" fy="16%">
            <Stop offset="0" stopColor="#3B1354" stopOpacity="0.9" />
            <Stop offset="0.55" stopColor="#3B1354" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="n3" cx="60%" cy="100%" rx="80%" ry="45%" fx="60%" fy="100%">
            <Stop offset="0" stopColor="#08243F" stopOpacity="0.8" />
            <Stop offset="0.6" stopColor="#08243F" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={colors.surface} />
        <Rect width="100%" height="100%" fill="url(#n1)" />
        <Rect width="100%" height="100%" fill="url(#n2)" />
        <Rect width="100%" height="100%" fill="url(#n3)" />
        {stars.map((st, i) => (
          <Circle key={i} cx={`${st.x * 100}%`} cy={`${st.y * 100}%`} r={Math.max(0.4, st.r)} fill="#DCEBFF" opacity={st.o} />
        ))}
      </Svg>
      {children}
    </View>
  );
}

/** GroovSesh brand lockup for the login / splash. */
const BRAND_LOGO = require("../../assets/images/groovsesh-logo.png");
const LOGO_AR = 425 / 119; // width / height of the exported logo asset

export function InfinityLogo({ height = 54 }: { height?: number }) {
  return (
    <Image
      source={BRAND_LOGO}
      style={{ width: height * LOGO_AR, height }}
      contentFit="contain"
      testID="brand-wordmark"
    />
  );
}

/** Clickable "a GR∞VLABZ studio" watermark at the bottom of every screen. */
export function GrooveWatermark() {
  const styles = useWmStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      style={styles.wrap}
      onPress={() => Linking.openURL(GROOVE_LABS_URL)}
      testID="groovlabz-watermark"
      hitSlop={10}
    >
      <Text style={styles.text}>
        a <Text style={styles.brand}>GR</Text>
        <Text style={[styles.brand, { color: colors.brandTertiary }]}>∞</Text>
        <Text style={styles.brand}>VLABZ</Text> studio
      </Text>
    </Pressable>
  );
}

type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

export function NeonButton({ label, onPress, variant = "primary", loading, disabled, icon, style, testID }: BtnProps) {
  const { colors } = useTheme();
  const styles = useBtnStyles();
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? glow(colors.brandPrimary, 18, 0.7) : undefined,
        { opacity: disabled ? 0.5 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[colors.brandSecondary, colors.brandPrimary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.secondaryFill]} />
      )}
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={isPrimary ? colors.onBrandPrimary : colors.brandSecondary} />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, { color: isPrimary ? colors.onBrandPrimary : colors.brandSecondary }]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

/** Procedural galaxy cover art for a saved session, seeded by id. */
export function SessionCover({ id, title, size = 52, radius = 12 }: { id: string; title: string; size?: number; radius?: number }) {
  const pal = coverPalette(id);
  const seed = seedFrom(id);
  const stars = Array.from({ length: 5 }, (_, i) => ({
    x: ((seed >> (i * 3)) % 100) / 100,
    y: ((seed >> (i * 3 + 2)) % 100) / 100,
  }));
  const initial = (title || "S").trim().charAt(0).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden" }}>
      <LinearGradient colors={[pal[0], pal[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["transparent", pal[2] + "88"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {stars.map((s, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: s.x * size,
            top: s.y * size * 0.6,
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: "#FFFFFF",
            opacity: 0.7,
          }}
        />
      ))}
      <View style={{ position: "absolute", bottom: 6, left: 6, right: 6 }}>
        <Waveform seed={id} height={size * 0.28} color="#FFFFFF" bars={10} />
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Text
          style={{
            fontFamily: fonts.displayBold,
            fontSize: size * 0.34,
            color: "#FFFFFF",
            textAlign: "center",
            marginTop: size * 0.12,
            opacity: 0.95,
          }}
        >
          {initial}
        </Text>
      </View>
    </View>
  );
}

const useWmStyles = makeStyles((colors) => ({
  wrap: { alignItems: "center", paddingVertical: 6 },
  text: { fontFamily: fonts.textMedium, fontSize: 12, color: colors.muted, letterSpacing: 1 },
  brand: { fontFamily: fonts.displayBold, color: colors.onSurfaceSecondary, letterSpacing: 1 },
}));

const useBtnStyles = makeStyles((colors) => ({
  btn: {
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  secondaryFill: { backgroundColor: "transparent" },
  inner: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  label: { fontFamily: fonts.displayBold, fontSize: 15, letterSpacing: 1 },
}));
