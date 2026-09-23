import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Svg, { Polygon, Line, Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { Microphone, Plus, MusicNotes, UploadSimple, ShareNetwork, Gear } from "phosphor-react-native";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GalaxyBackground, InfinityLogo, GrooveWatermark } from "@/src/components/ui";
import { apiFetch } from "@/src/api";
import { queryClient } from "@/src/query-client";
import { useToast } from "@/src/components/toast";

function NeckBackground({ width, height }: { width: number; height: number }) {
  const { colors } = useTheme();
  if (width <= 0) return null;
  const cx = width / 2;
  const topW = width * 0.34;
  const botW = width * 0.52;
  const neckTop = height * 0.12;
  const neckBot = height;

  const frets = Array.from({ length: 7 }, (_, i) => neckTop + ((neckBot - neckTop) / 7) * (i + 0.5));
  const widthAt = (y: number) => {
    const t = (y - neckTop) / (neckBot - neckTop);
    return topW + (botW - topW) * t;
  };

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGradient id="neck" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2A1650" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#120A28" stopOpacity="0.95" />
        </SvgGradient>
      </Defs>
      <Polygon
        points={`${cx - topW / 2 - 10},${neckTop} ${cx + topW / 2 + 10},${neckTop} ${cx + topW / 2 - 6},${height * 0.03} ${cx - topW / 2 + 6},${height * 0.03}`}
        fill="url(#neck)"
        stroke={colors.brandPrimary}
        strokeWidth={1.5}
        opacity={0.9}
      />
      <Polygon
        points={`${cx - topW / 2},${neckTop} ${cx + topW / 2},${neckTop} ${cx + botW / 2},${neckBot} ${cx - botW / 2},${neckBot}`}
        fill="url(#neck)"
        stroke={colors.brandTertiary}
        strokeWidth={1.5}
      />
      {frets.map((y, i) => {
        const w = widthAt(y);
        return (
          <Line key={`f${i}`} x1={cx - w / 2} y1={y} x2={cx + w / 2} y2={y} stroke={colors.brandSecondary} strokeWidth={2} opacity={0.35} />
        );
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const off = (i - 2.5) / 5;
        return (
          <Line key={`s${i}`} x1={cx + off * topW} y1={neckTop} x2={cx + off * botW} y2={neckBot} stroke={colors.onSurface} strokeWidth={0.7} opacity={0.12} />
        );
      })}
      {[0.35, 0.6, 0.85].map((p, i) => (
        <Circle key={`i${i}`} cx={cx} cy={neckTop + (neckBot - neckTop) * p} r={4} fill={colors.brandSecondary} opacity={0.5} />
      ))}
    </Svg>
  );
}

export default function Home() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const [neck, setNeck] = useState({ width: 0, height: 0 });

  const createSession = useMutation({
    mutationFn: () =>
      apiFetch<any>("/sessions", {
        method: "POST",
        body: JSON.stringify({ title: `Session ${new Date().toLocaleDateString()}`, bpm: 90, count_in: true }),
      }),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      router.push(`/session/${s.id}`);
    },
    onError: () => toast.show("Could not create session", "error"),
  });

  const frets = [
    { label: "New Session", icon: Plus, onPress: () => createSession.mutate(), testID: "fret-new-session" },
    { label: "My Sessions", icon: MusicNotes, onPress: () => router.push("/sessions"), testID: "fret-my-sessions" },
    { label: "Import", icon: UploadSimple, onPress: () => router.push("/import"), testID: "fret-import" },
    {
      label: "Tracks",
      icon: ShareNetwork,
      onPress: () => toast.show("Send stems to GroovTracks from any session's Export screen", "info"),
      testID: "fret-tracks",
    },
    { label: "Settings", icon: Gear, onPress: () => router.push("/settings"), testID: "fret-settings" },
  ];

  const jam = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    router.push("/jam");
  };

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <InfinityLogo />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={jam} testID="jam-now-button" style={({ pressed }) => [styles.jamNow, { opacity: pressed ? 0.9 : 1 }]}>
          <View style={styles.jamGlow} />
          <Microphone size={30} color={colors.onBrandPrimary} weight="fill" />
          <Text style={styles.jamText}>JAM NOW</Text>
          <Text style={styles.jamSub}>Instant quick-record</Text>
        </Pressable>

        <View
          style={styles.neckArea}
          onLayout={(e) => setNeck({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
          <NeckBackground width={neck.width} height={neck.height} />
          <View style={styles.fretColumn}>
            {frets.map((f) => {
              const Icon = f.icon;
              return (
                <Pressable
                  key={f.label}
                  testID={f.testID}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    f.onPress();
                  }}
                  style={({ pressed }) => [styles.fret, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                >
                  <Icon size={20} color={colors.brandSecondary} weight="bold" />
                  <Text style={styles.fretText}>{f.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 6 }}>
        <GrooveWatermark />
      </View>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { alignItems: "center", paddingBottom: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 10, flexGrow: 1 },
  jamNow: {
    height: 116,
    borderRadius: 24,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    shadowColor: colors.brandPrimary,
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
    overflow: "hidden",
  },
  jamGlow: { position: "absolute", top: -30, width: 200, height: 100, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.15)" },
  jamText: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.onBrandPrimary, letterSpacing: 3 },
  jamSub: { fontFamily: fonts.text, fontSize: 12, color: "rgba(255,255,255,0.85)", letterSpacing: 1 },
  neckArea: { flex: 1, minHeight: 420, justifyContent: "center", position: "relative" },
  fretColumn: { paddingVertical: 24, gap: 14, justifyContent: "center", flex: 1 },
  fret: {
    height: 58,
    borderRadius: 999,
    backgroundColor: "rgba(38,38,54,0.9)",
    borderWidth: 1.5,
    borderColor: colors.brandSecondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 30,
    shadowColor: colors.brandSecondary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  fretText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface, letterSpacing: 1.5 },
}));
