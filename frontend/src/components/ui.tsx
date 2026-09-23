import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Linking, Platform, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop, Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { makeStyles, useTheme, fonts, glow, coverPalette, seedFrom } from "@/src/theme";
import { GROOVE_LABS_URL } from "@/src/config";
import { Waveform } from "@/src/components/waveform";

const GALAXY_BG = require("../../assets/images/galaxy-bg.jpg");

/* ---------------- Animated starfield ---------------- */

function Twinkle({ x, y, size, color, delay, dur }: { x: number; y: number; size: number; color: string; delay: number; dur: number }) {
  const o = useSharedValue(0.2);
  React.useEffect(() => {
    o.value = withDelay(delay, withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        },
        glow(color, size * 2, 0.9),
        st,
      ]}
    />
  );
}

const STARS = Array.from({ length: 26 }).map((_, i) => {
  const s = seedFrom("star" + i);
  return {
    x: (s % 100),
    y: ((s >> 7) % 100),
    size: 1.5 + ((s >> 3) % 3),
    color: ["#FFFFFF", "#A5F3FC", "#F5D0FE", "#C4B5FD"][(s >> 5) % 4],
    delay: (s % 2600),
    dur: 1400 + ((s >> 4) % 2200),
  };
});

export function GalaxyBackground({ children, stars = true }: { children: React.ReactNode; stars?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Image source={GALAXY_BG} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
      {stars &&
        STARS.map((s, i) => (
          <Twinkle key={i} x={s.x} y={s.y} size={s.size} color={s.color} delay={s.delay} dur={s.dur} />
        ))}
      <LinearGradient
        colors={["rgba(13,13,18,0.28)", "rgba(13,13,18,0.5)", "rgba(13,13,18,0.86)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

/* ---------------- Neon infinity logo ---------------- */

export function InfinityLogo({ size = 30, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    pulse.value = withRepeat(withTiming(0.55, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.45 + pulse.value * 0.4 }));

  const w = size * 2.2;
  const h = size * 1.15;
  return (
    <View style={{ alignItems: "center" }} testID="infinity-logo">
      <View style={[{ width: w, height: h }, glow(colors.brandPrimary, size * 0.9, 0.9)]}>
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <Svg width={w} height={h} viewBox="0 0 110 55">
            <Defs>
              <SvgGradient id="infG" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#06B6D4" />
                <Stop offset="0.5" stopColor="#8B5CF6" />
                <Stop offset="1" stopColor="#D946EF" />
              </SvgGradient>
            </Defs>
            {/* soft wide glow strokes */}
            <Circle cx="35" cy="27.5" r="18" stroke="url(#infG)" strokeWidth="14" fill="none" opacity={0.28} />
            <Circle cx="75" cy="27.5" r="18" stroke="url(#infG)" strokeWidth="14" fill="none" opacity={0.28} />
          </Svg>
        </Animated.View>
        <Svg width={w} height={h} viewBox="0 0 110 55">
          <Defs>
            <SvgGradient id="infG2" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#22D3EE" />
              <Stop offset="0.5" stopColor="#A78BFA" />
              <Stop offset="1" stopColor="#F472B6" />
            </SvgGradient>
          </Defs>
          <Circle cx="35" cy="27.5" r="18" stroke="url(#infG2)" strokeWidth="6" fill="none" strokeLinecap="round" />
          <Circle cx="75" cy="27.5" r="18" stroke="url(#infG2)" strokeWidth="6" fill="none" strokeLinecap="round" />
        </Svg>
      </View>
      {showWordmark && (
        <Text
          style={{
            fontFamily: fonts.displayBlack,
            fontSize: size * 0.44,
            color: colors.onSurface,
            letterSpacing: 3,
            marginTop: 8,
            textShadowColor: colors.brandSecondary,
            textShadowRadius: 12,
            textShadowOffset: { width: 0, height: 0 },
          }}
        >
          GROOVSESH
        </Text>
      )}
    </View>
  );
}

/* ---------------- Watermark ---------------- */

export function GrooveWatermark({ style }: { style?: ViewStyle }) {
  const styles = useStyles();
  const open = () => Linking.openURL(GROOVE_LABS_URL).catch(() => {});
  return (
    <Pressable onPress={open} style={[styles.watermark, style]} hitSlop={12} testID="groove-labs-watermark">
      <Text style={styles.watermarkText}>
        a <Text style={styles.watermarkBrand}>GROOVLABZ</Text> studio
      </Text>
    </Pressable>
  );
}

/* ---------------- Neon button (gradient + glow) ---------------- */

type NeonButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  haptic?: Haptics.ImpactFeedbackStyle;
  testID?: string;
  style?: ViewStyle;
};

export function NeonButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
  haptic = Haptics.ImpactFeedbackStyle.Medium,
  testID,
  style,
}: NeonButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  const gradient: [string, string] =
    variant === "primary" ? ["#F472B6", "#A855F7"] : variant === "secondary" ? ["#22D3EE", "#3B82F6"] : ["transparent", "transparent"];
  const fg =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "secondary"
      ? "#001018"
      : colors.onSurface;
  const isFilled = variant === "primary" || variant === "secondary";
  const glowColor = variant === "secondary" ? colors.brandSecondary : colors.brandPrimary;

  const handle = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") Haptics.impactAsync(haptic).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.btnWrap,
        isFilled ? glow(glowColor, 16, 0.7) : null,
        { opacity: disabled ? 0.5 : pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={isFilled ? gradient : ["transparent", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.btn,
          !isFilled && { borderWidth: 1.5, borderColor: variant === "outline" ? colors.borderStrong : colors.border },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={styles.btnRow}>
            {icon}
            <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

/* ---------------- Procedural galaxy session cover ---------------- */

export function SessionCover({
  id,
  title,
  size = 56,
  radius = 12,
  style,
}: {
  id: string;
  title?: string;
  size?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const pal = coverPalette(id);
  const dots = useMemo(() => {
    const s = seedFrom(id);
    return Array.from({ length: 7 }).map((_, i) => {
      const a = seedFrom(id + "d" + i);
      return { x: (a % 90) + 5, y: ((a >> 6) % 80) + 5, r: 1 + ((a >> 3) % 2) };
    });
  }, [id]);
  const initial = (title || "G").trim().charAt(0).toUpperCase();
  return (
    <View style={[{ width: size, height: size, borderRadius: radius, overflow: "hidden" }, glow(pal[0], size * 0.18, 0.55), style]}>
      <LinearGradient colors={[pal[0], pal[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["transparent", pal[2] + "AA"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {dots.map((d, i) => (
        <View
          key={i}
          style={{ position: "absolute", left: `${d.x}%`, top: `${d.y}%`, width: d.r * 2, height: d.r * 2, borderRadius: d.r, backgroundColor: "#FFFFFF", opacity: 0.85 }}
        />
      ))}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: size * 0.14, alignItems: "center" }}>
        <Waveform seed={id} color="#FFFFFF" height={size * 0.28} bars={Math.max(10, Math.round(size / 6))} width={size * 0.8} />
      </View>
      <View style={StyleSheet.absoluteFill} />
      <Text
        style={{
          position: "absolute",
          top: size * 0.1,
          left: size * 0.14,
          fontFamily: fonts.displayBlack,
          fontSize: size * 0.34,
          color: "rgba(255,255,255,0.92)",
          textShadowColor: "rgba(0,0,0,0.35)",
          textShadowRadius: 4,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  watermark: { alignSelf: "center", paddingVertical: 6 },
  watermarkText: { fontFamily: fonts.text, fontSize: 11, color: colors.muted, letterSpacing: 1 },
  watermarkBrand: { fontFamily: fonts.displayBold, color: colors.brandSecondary, letterSpacing: 1.5, fontSize: 10 },
  btnWrap: { borderRadius: 999 },
  btn: {
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnLabel: { fontFamily: fonts.displayBold, fontSize: 15, letterSpacing: 1 },
}));
