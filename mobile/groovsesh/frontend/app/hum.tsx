import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from "expo-audio";
import { CaretLeft, Microphone, Stop, Pulse } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, glow } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark, NeonButton } from "@/src/components/ui";
import { ensureRecordingMode, ensurePlaybackMode, requestMicPermission } from "@/src/audio/engine";
import { apiFetch, humToDrums } from "@/src/api";
import { useToast } from "@/src/components/toast";

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

export default function HumToDrumsScreen() {
  const { session } = useLocalSearchParams<{ session?: string }>();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 100);
  const [phase, setPhase] = useState<"idle" | "recording" | "analysing">("idle");
  const [result, setResult] = useState<{ bpm: number; bars: number; kicks: number; snares: number; sessionId: string } | null>(null);

  const start = async () => {
    const ok = await requestMicPermission();
    if (!ok) { toast.show("Microphone permission is needed", "error"); return; }
    try {
      await ensureRecordingMode();
      await recorder.prepareToRecordAsync();
      recorder.record();
      setResult(null);
      setPhase("recording");
    } catch {
      toast.show("Could not start recording", "error");
    }
  };

  const stopAndAnalyse = async () => {
    setPhase("analysing");
    try {
      await recorder.stop();
      await ensurePlaybackMode();
      const uri = recorder.uri;
      if (!uri) throw new Error("No audio captured");
      let sessionId = session;
      if (!sessionId) {
        const s = await apiFetch<any>("/sessions", { method: "POST", body: JSON.stringify({ title: `Hum Groove ${new Date().toLocaleDateString()}` }) });
        sessionId = s.id;
      }
      const res = await humToDrums(sessionId!, uri);
      qc.invalidateQueries({ queryKey: ["session", sessionId] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      setResult({ bpm: res.bpm, bars: res.bars, kicks: res.kicks, snares: res.snares, sessionId: sessionId! });
      toast.show(`Pulse track added · ${res.bpm} BPM`, "success");
    } catch (e: any) {
      toast.show(e?.message?.replace(/^\{.*"detail":"|"\}$/g, "") || "Couldn't build drums from that", "error");
      setPhase("idle");
      return;
    }
    setPhase("idle");
  };

  const recording = phase === "recording";

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.back} onPress={() => router.back()} testID="hum-back" hitSlop={8}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>HUM TO DRUMS</Text>
          <Text style={styles.subtitle}>HUM OR TAP A GROOVE · GET A DRUM TRACK IN TIME</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stage} testID="hum-screen">
        <View style={[styles.ring, { borderColor: recording ? colors.error : colors.brandSecondary }, glow(recording ? colors.error : colors.brandSecondary, 26, 0.8)]}>
          <Pulse size={34} color={recording ? colors.error : colors.brandSecondary} weight="fill" />
          <Text style={styles.time} testID="hum-time">{recording ? fmt(recState.durationMillis || 0) : result ? `${result.bpm}` : "--:--"}</Text>
          <Text style={styles.status}>{recording ? "LISTENING" : phase === "analysing" ? "FINDING THE GROOVE" : result ? "BPM" : "READY"}</Text>
        </View>

        <Text style={styles.hint}>
          {result
            ? `${result.bars} bars · ${result.kicks} kicks · ${result.snares} snares. Low sounds became kicks, sharp sounds became snares.`
            : "Hum \"boom‑ka boom‑boom‑ka\" or tap the table for 4–8 beats. Low sounds become kicks, sharp sounds become snares — hats fill in automatically."}
        </Text>

        <Pressable onPress={recording ? stopAndAnalyse : start} disabled={phase === "analysing"}
          style={[styles.recBtn, { backgroundColor: recording ? colors.error : colors.brandPrimary }, glow(recording ? colors.error : colors.brandPrimary, 20, 0.9), phase === "analysing" && { opacity: 0.5 }]}
          testID="hum-record">
          {recording ? <Stop size={32} color="#fff" weight="fill" /> : <Microphone size={32} color={colors.onBrandPrimary} weight="fill" />}
        </Pressable>

        {result && (
          <View style={{ gap: 10, width: "100%" }}>
            <NeonButton label="Open Session & Play" onPress={() => router.replace(`/session/${result.sessionId}`)} testID="hum-open-session" />
            <NeonButton label="Try Another Groove" variant="secondary" onPress={() => setResult(null)} testID="hum-retry" />
          </View>
        )}
      </View>

      <View style={{ paddingBottom: insets.bottom + 4 }}><GrooveWatermark /></View>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.7)", borderWidth: 1, borderColor: colors.border },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 2 },
  subtitle: { fontFamily: fonts.textMedium, fontSize: 9, color: colors.onSurfaceSecondary, letterSpacing: 1.5, marginTop: 2 },
  stage: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 20, gap: 22 },
  ring: { width: 200, height: 200, borderRadius: 100, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.75)", gap: 6 },
  time: { fontFamily: fonts.numeric, fontSize: 36, color: colors.onSurface },
  status: { fontFamily: fonts.textMedium, fontSize: 10, color: colors.onSurfaceSecondary, letterSpacing: 3 },
  hint: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, textAlign: "center", maxWidth: 320, lineHeight: 19 },
  recBtn: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
}));
