import React, { useState } from "react";
import { View, Pressable, StyleSheet, Platform, Linking } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { apiFetch } from "@/src/api";
import { queryClient } from "@/src/query-client";
import { useToast } from "@/src/components/toast";
import { GROOVE_LABS_URL } from "@/src/config";

const ART = require("../assets/images/groovsesh-home.png");
const IMG_W = 654;
const IMG_H = 1012;

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const [box, setBox] = useState({ w: 0, h: 0 });

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

  const tap = (fn: () => void, heavy = false) => () => {
    if (Platform.OS !== "web") Haptics.impactAsync(heavy ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  // contain-fit rendered rect of the artwork inside the measured box
  const scale = box.w > 0 ? Math.min(box.w / IMG_W, box.h / IMG_H) : 0;
  const dw = IMG_W * scale;
  const dh = IMG_H * scale;
  const ox = (box.w - dw) / 2;
  const oy = (box.h - dh) / 2;
  // strip overlay from a node center (cx,cy) extending to the right edge
  const node = (cx: number, cy: number) => ({
    position: "absolute" as const,
    left: ox + (cx - 0.06) * dw,
    top: oy + (cy - 0.034) * dh,
    width: (1 - (cx - 0.06)) * dw,
    height: 0.068 * dh,
  });
  const spot = (cx: number, cy: number, fw: number, fh: number) => ({
    position: "absolute" as const,
    left: ox + (cx - fw / 2) * dw,
    top: oy + (cy - fh / 2) * dh,
    width: fw * dw,
    height: fh * dh,
  });

  const nodes: { id: string; cx: number; cy: number; onPress: () => void; heavy?: boolean }[] = [
    { id: "jam-now-button", cx: 0.51, cy: 0.247, onPress: () => router.push("/jam"), heavy: true },
    { id: "fret-record", cx: 0.505, cy: 0.317, onPress: () => createSession.mutate() },
    { id: "fret-review", cx: 0.477, cy: 0.388, onPress: () => router.push("/sessions") },
    { id: "fret-neural", cx: 0.459, cy: 0.459, onPress: () => toast.show("Neural Clean runs in Export → GroovMash", "info") },
    { id: "fret-mixer", cx: 0.446, cy: 0.531, onPress: () => router.push("/sessions") },
    { id: "fret-reel", cx: 0.428, cy: 0.601, onPress: () => router.push("/sessions") },
    { id: "fret-collab", cx: 0.428, cy: 0.682, onPress: () => toast.show("Collab — invite bandmates (coming soon)", "info") },
  ];

  const tabs: { id: string; cx: number; onPress: () => void }[] = [
    { id: "tab-home", cx: 0.073, onPress: () => {} },
    { id: "tab-tuner", cx: 0.211, onPress: () => toast.show("Tuner — coming soon", "info") },
    { id: "tab-metronome", cx: 0.375, onPress: () => toast.show("Open a session for the metronome", "info") },
    { id: "tab-looper", cx: 0.544, onPress: () => toast.show("Looper — coming soon", "info") },
    { id: "tab-songbook", cx: 0.713, onPress: () => toast.show("Songbook — coming soon", "info") },
    { id: "tab-setlists", cx: 0.895, onPress: () => toast.show("Setlists — coming soon", "info") },
  ];

  const pressStyle = ({ pressed }: { pressed: boolean }) => ({ backgroundColor: pressed ? "rgba(56,189,248,0.18)" : "transparent", borderRadius: 12 });

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.stage} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <Image source={ART} style={StyleSheet.absoluteFill} contentFit="contain" cachePolicy="memory-disk" />

        {box.w > 0 && (
          <>
            {/* top-right settings gear */}
            <Pressable testID="home-settings" onPress={tap(() => router.push("/settings"))} style={[spot(0.94, 0.03, 0.13, 0.05), pressStyle]} />
            {/* hamburger menu */}
            <Pressable testID="home-menu" onPress={tap(() => router.push("/settings"))} style={[spot(0.06, 0.03, 0.13, 0.05), pressStyle]} />
            {/* QUICK JAMS badge */}
            <Pressable testID="home-quick-jams" onPress={tap(() => router.push("/sessions"))} style={[spot(0.84, 0.115, 0.26, 0.14), pressStyle]} />

            {/* guitar neck play-nodes */}
            {nodes.map((n) => (
              <Pressable key={n.id} testID={n.id} onPress={tap(n.onPress, n.heavy)} style={[node(n.cx, n.cy), pressStyle]} />
            ))}

            {/* GroovLabz watermark (stool) */}
            <Pressable testID="groove-labs-watermark" onPress={() => Linking.openURL(GROOVE_LABS_URL).catch(() => {})} style={spot(0.8, 0.715, 0.22, 0.07)} />

            {/* bottom tab bar */}
            {tabs.map((t) => (
              <Pressable key={t.id} testID={t.id} onPress={tap(t.onPress)} style={[spot(t.cx, 0.955, 0.16, 0.075), pressStyle]} />
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#05060A" },
  stage: { flex: 1, position: "relative" },
});
