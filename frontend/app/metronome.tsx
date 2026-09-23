import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { CaretLeft, Minus, Plus, Play, Pause } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, glow } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark } from "@/src/components/ui";
import { useMetronome } from "@/src/audio/metronome";

const BEATS = 4;

export default function MetronomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const metro = useMetronome();

  const [bpm, setBpm] = useState(100);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(0);
  const visual = useRef<any>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  const stopAll = () => {
    metro.stop();
    if (visual.current) clearInterval(visual.current);
    visual.current = null;
    setRunning(false);
    setBeat(0);
  };

  const startAll = () => {
    metro.start(bpmRef.current);
    setBeat(0);
    let i = 0;
    setBeat(0);
    if (visual.current) clearInterval(visual.current);
    visual.current = setInterval(() => {
      i = (i + 1) % BEATS;
      setBeat(i);
    }, 60000 / bpmRef.current);
    setRunning(true);
  };

  const toggle = () => (running ? stopAll() : startAll());

  // restart timing when bpm changes mid-run
  useEffect(() => {
    if (running) {
      metro.stop();
      metro.start(bpm);
      if (visual.current) clearInterval(visual.current);
      let i = beat;
      visual.current = setInterval(() => {
        i = (i + 1) % BEATS;
        setBeat(i);
      }, 60000 / bpm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);

  useEffect(() => () => stopAll(), []); // cleanup on unmount

  const nudge = (d: number) => setBpm((b) => Math.max(40, Math.min(240, b + d)));

  return (
    <GalaxyBackground>
      <View style={{ flex: 1, paddingTop: insets.top + 8 }} testID="metronome-screen">
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8} testID="tool-back">
            <CaretLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle}>METRONOME</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          <View style={styles.beats}>
            {Array.from({ length: BEATS }).map((_, i) => {
              const active = running && beat === i;
              const isDown = i === 0;
              const c = isDown ? colors.brandTertiary : colors.brandSecondary;
              return (
                <View
                  key={i}
                  style={[
                    styles.beatDot,
                    { borderColor: c, backgroundColor: active ? c : "transparent" },
                    active ? glow(c, 16, 0.9) : undefined,
                  ]}
                />
              );
            })}
          </View>

          <Text style={styles.bpm} testID="bpm-value">{bpm}</Text>
          <Text style={styles.bpmLabel}>BPM · 4/4</Text>

          <View style={styles.bpmRow}>
            <Pressable style={styles.nudge} onPress={() => nudge(-1)} testID="bpm-minus" hitSlop={8}>
              <Minus size={20} color={colors.onSurface} weight="bold" />
            </Pressable>
            <Slider
              style={{ flex: 1, height: 40 }}
              minimumValue={40}
              maximumValue={240}
              step={1}
              value={bpm}
              onValueChange={setBpm}
              minimumTrackTintColor={colors.brandSecondary}
              maximumTrackTintColor={colors.divider}
              thumbTintColor={colors.brandPrimary}
              testID="bpm-slider"
            />
            <Pressable style={styles.nudge} onPress={() => nudge(1)} testID="bpm-plus" hitSlop={8}>
              <Plus size={20} color={colors.onSurface} weight="bold" />
            </Pressable>
          </View>

          <Pressable
            onPress={toggle}
            testID="metronome-toggle"
            style={[styles.playBtn, { backgroundColor: running ? colors.error : colors.brandPrimary }, glow(running ? colors.error : colors.brandPrimary, 22, 0.85)]}
          >
            {running ? <Pause size={34} color="#FFF" weight="fill" /> : <Play size={34} color={colors.onBrandPrimary} weight="fill" />}
          </Pressable>
          <Text style={styles.hint}>{running ? "TAP TO STOP" : "TAP TO START"}</Text>
        </View>

        <View style={{ paddingBottom: insets.bottom + 4 }}>
          <GrooveWatermark />
        </View>
      </View>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 48 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: fonts.displayBold, fontSize: 16, color: colors.onSurface, letterSpacing: 1 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 10 },
  beats: { flexDirection: "row", gap: 16, marginBottom: 20 },
  beatDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  bpm: { fontFamily: fonts.numeric, fontSize: 82, color: colors.onSurface, lineHeight: 88 },
  bpmLabel: { fontFamily: fonts.displayBold, fontSize: 12, color: colors.onSurfaceSecondary, letterSpacing: 3 },
  bpmRow: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%", marginTop: 16 },
  nudge: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(6,24,42,0.7)" },
  playBtn: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center", marginTop: 30 },
  hint: { fontFamily: fonts.displayBold, fontSize: 12, color: colors.muted, letterSpacing: 2, marginTop: 10 },
}));
