import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Linking, Platform, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GROOVE_LABS_URL } from "@/src/config";

const GALAXY_BG = require("../../assets/images/galaxy-bg.jpg");

export function GalaxyBackground({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Image source={GALAXY_BG} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
      <LinearGradient
        colors={["rgba(13,13,18,0.30)", "rgba(13,13,18,0.55)", "rgba(13,13,18,0.86)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

export function InfinityLogo({ size = 30 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center" }} testID="infinity-logo">
      <Text
        style={{
          fontFamily: fonts.displayBold,
          fontSize: size,
          color: colors.brandPrimary,
          letterSpacing: 4,
          textShadowColor: colors.brandPrimary,
          textShadowRadius: 16,
          textShadowOffset: { width: 0, height: 0 },
        }}
      >
        ∞
      </Text>
      <Text
        style={{
          fontFamily: fonts.displayBold,
          fontSize: 13,
          color: colors.onSurface,
          letterSpacing: 6,
          marginTop: -2,
        }}
      >
        GROOVSESH
      </Text>
    </View>
  );
}

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

  const bg =
    variant === "primary"
      ? colors.brandPrimary
      : variant === "secondary"
      ? colors.brandSecondary
      : "transparent";
  const fg =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "secondary"
      ? colors.onBrandSecondary
      : colors.onSurface;
  const borderColor = variant === "outline" ? colors.borderStrong : "transparent";

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
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "outline" ? 1.5 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          shadowColor: variant === "primary" ? colors.brandPrimary : colors.brandSecondary,
        },
        variant !== "ghost" && variant !== "outline" ? styles.glow : null,
        style,
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
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  watermark: { alignSelf: "center", paddingVertical: 6 },
  watermarkText: { fontFamily: fonts.text, fontSize: 11, color: colors.muted, letterSpacing: 1 },
  watermarkBrand: { fontFamily: fonts.displayBold, color: colors.brandSecondary, letterSpacing: 1.5 },
  btn: {
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  glow: {
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnLabel: { fontFamily: fonts.displayBold, fontSize: 17, letterSpacing: 1 },
}));
