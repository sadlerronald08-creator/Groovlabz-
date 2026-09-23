import React, { useMemo } from "react";
import { View } from "react-native";

// Deterministic pseudo-random bar heights from a seed string.
function seededBars(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const v = (h % 1000) / 1000;
    // shape it a little so it looks like a waveform envelope
    const env = 0.35 + 0.65 * Math.abs(Math.sin((i / count) * Math.PI * 3 + (h % 7)));
    out.push(0.2 + v * 0.8 * env);
  }
  return out;
}

type Props = {
  seed: string;
  color: string;
  height?: number;
  bars?: number;
  progress?: number; // 0..1 played portion
  dimColor?: string;
  live?: number[]; // live metering values 0..1
};

export function Waveform({ seed, color, height = 48, bars = 48, progress, dimColor, live }: Props) {
  const values = useMemo(() => (live && live.length ? live : seededBars(seed, bars)), [seed, bars, live]);
  const barWidth = 100 / values.length;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", height, width: "100%", gap: 2 }}>
      {values.map((v, i) => {
        const played = progress != null ? i / values.length <= progress : true;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              maxWidth: `${barWidth}%`,
              height: Math.max(3, v * height),
              borderRadius: 2,
              backgroundColor: played ? color : dimColor || "rgba(255,255,255,0.15)",
              shadowColor: color,
              shadowOpacity: played ? 0.5 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        );
      })}
    </View>
  );
}
