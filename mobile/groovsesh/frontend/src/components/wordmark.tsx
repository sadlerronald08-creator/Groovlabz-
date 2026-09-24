import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop } from "react-native-svg";
import { fonts, useTheme, glow } from "@/src/theme";

/**
 * A true single-stroke lemniscate (∞) — not two separate circles.
 */
export function InfinityMark({ size = 30, color, color2 }: { size?: number; color?: string; color2?: string }) {
  const { colors } = useTheme();
  const c1 = color ?? colors.brandTertiary; // purple
  const c2 = color2 ?? colors.brandSecondary; // blue
  const w = size * 2;
  const h = size;
  return (
    <Svg width={w} height={h} viewBox="0 0 64 32" fill="none">
      <Defs>
        <SvgGrad id="inf" x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={c2} />
          <Stop offset="0.5" stopColor={c1} />
          <Stop offset="1" stopColor={c2} />
        </SvgGrad>
      </Defs>
      <Path
        d="M32 16 C32 6 46 6 46 16 C46 26 32 26 32 16 C32 6 18 6 18 16 C18 26 32 26 32 16 Z"
        stroke="url(#inf)"
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Brand wordmark with the infinity replacing the "OO" in GROOV — e.g. GR∞VSESH.
 */
export function Wordmark({
  pre = "GR",
  post = "VSESH",
  size = 40,
  testID,
}: {
  pre?: string;
  post?: string;
  size?: number;
  testID?: string;
}) {
  const { colors } = useTheme();
  const styles = makeWordStyles(colors, size);
  return (
    <View style={styles.row} testID={testID}>
      <Text style={styles.word}>{pre}</Text>
      <View style={{ marginHorizontal: -size * 0.06, marginTop: size * 0.02 }}>
        <InfinityMark size={size * 0.6} />
      </View>
      <Text style={styles.word}>{post}</Text>
    </View>
  );
}

const makeWordStyles = (colors: any, size: number) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
    word: {
      fontFamily: fonts.displayBold,
      fontSize: size,
      color: colors.onSurface,
      letterSpacing: size * 0.02,
      textShadowColor: colors.brandSecondary,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: size * 0.4,
      ...(glow(colors.brandSecondary, size * 0.4, 0.9) as any),
    },
  });
