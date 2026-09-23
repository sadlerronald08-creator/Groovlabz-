import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Waveform } from "phosphor-react-native";
import { ToolScreen } from "@/src/components/tool-screen";
import { makeStyles, useTheme, fonts, glow } from "@/src/theme";

const STRINGS = [
  { note: "E", oct: "2" },
  { note: "A", oct: "2" },
  { note: "D", oct: "3" },
  { note: "G", oct: "3" },
  { note: "B", oct: "3" },
  { note: "E", oct: "4" },
];

export default function TunerScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [sel, setSel] = useState(0);
  return (
    <ToolScreen
      title="TUNER"
      subtitle="Standard tuning · E A D G B E. Pick a string and match the reference note by ear."
      Icon={Waveform}
      testID="tuner-screen"
    >
      <View style={styles.gauge}>
        <View style={styles.gaugeCenter} />
        <View style={[styles.needle, glow(colors.success, 12, 0.8)]} />
        <Text style={styles.big}>{STRINGS[sel].note}</Text>
        <Text style={styles.oct}>{STRINGS[sel].note}{STRINGS[sel].oct}</Text>
      </View>
      <View style={styles.row}>
        {STRINGS.map((s, i) => {
          const active = i === sel;
          return (
            <Pressable
              key={i}
              testID={`tuner-string-${i}`}
              onPress={() => setSel(i)}
              style={[styles.chip, active && { borderColor: colors.brandSecondary, backgroundColor: colors.brandSecondary }, active ? glow(colors.brandSecondary, 12, 0.7) : undefined]}
            >
              <Text style={[styles.chipText, active && { color: colors.onBrandSecondary }]}>{s.note}</Text>
            </Pressable>
          );
        })}
      </View>
    </ToolScreen>
  );
}

const useStyles = makeStyles((colors) => ({
  gauge: { width: 220, height: 120, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(6,24,42,0.6)", alignItems: "center", justifyContent: "center", marginTop: 22, overflow: "hidden" },
  gaugeCenter: { position: "absolute", top: 8, width: 2, height: 22, backgroundColor: colors.muted },
  needle: { position: "absolute", top: 8, width: 3, height: 40, backgroundColor: colors.success, borderRadius: 2 },
  big: { fontFamily: fonts.displayBold, fontSize: 52, color: colors.onSurface },
  oct: { fontFamily: fonts.numeric, fontSize: 16, color: colors.onSurfaceSecondary, marginTop: 2 },
  row: { flexDirection: "row", gap: 10, marginTop: 24, flexWrap: "wrap", justifyContent: "center" },
  chip: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.7)" },
  chipText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface },
}));
