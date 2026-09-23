import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Linking, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from "expo-audio";
import { X, Microphone, Check, ArrowCounterClockwise } from "phosphor-react-native";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark, NeonButton } from "@/src/components/ui";
import { Waveform } from "@/src/components/waveform";
import { ensureRecordingMode, requestMicPermission, getMicPermission } from "@/src/audio/engine";
import { apiFetch, uploadTrack } from "@/src/api";
import { queryClient } from "@/src/query-client";
import { useToast } from "@/src/components/toast";

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function Jam() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 100);

  const [phase, setPhase] = useState<"idle" | "recording" | "done">("idle");
  const [blocked, setBlocked] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [liveBars, setLiveBars] = useState<number[]>(new Array(48).fill(0.2));
  const barTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (barTimer.current) clearInterval(barTimer.current);
    };
  }, []);

  const startBars = () => {
    if (barTimer.current) clearInterval(barTimer.current);
    barTimer.current = setInterval(() => {
      setLiveBars((prev) => {
        const next = prev.slice(1);
        next.push(0.25 + Math.random() * 0.75);
        return next;
      });
    }, 110);
  };

  const stopBars = () => {
    if (barTimer.current) {
      clearInterval(barTimer.current);
      barTimer.current = null;
    }
  };

  const start = async () => {
    let perm = await getMicPermission();
    if (!perm.granted) {
      if (perm.canAskAgain === false) {
        setBlocked(true);
        return;
      }
      perm = await requestMicPermission();
      if (!perm.granted) {
        if (!perm.canAskAgain) setBlocked(true);
        else toast.show("Microphone access is needed to record", "error");
        return;
      }
    }
    setBlocked(false);
    try {
      await ensureRecordingMode();
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase("recording");
      startBars();
    } catch (e: any) {
      toast.show("Could not start recording", "error");
    }
  };

  const stop = async () => {
    stopBars();
    try {
      await recorder.stop();
      setDuration(recState.durationMillis || 0);
      setRecordedUri(recorder.uri || null);
      setPhase("done");
    } catch {
      toast.show("Recording error", "error");
      setPhase("idle");
    }
  };

  const retake = () => {
    setRecordedUri(null);
    setDuration(0);
    setPhase("idle");
    setLiveBars(new Array(48).fill(0.2));
  };

  const save = async () => {
    if (!recordedUri) return;
    setSaving(true);
    try {
      const session = await apiFetch<any>("/sessions", {
        method: "POST",
        body: JSON.stringify({ title: `Jam ${new Date().toLocaleString([], { hour: "2-digit", minute: "2-digit" })}`, bpm: 90, count_in: true }),
      });
      await uploadTrack(session.id, recordedUri, {
        name: "Take 1",
        source: "mic",
        duration: duration / 1000,
        color: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      router.replace(`/session/${session.id}`);
    } catch (e: any) {
      toast.show(e?.message || "Could not save jam", "error");
      setSaving(false);
    }
  };

  const currentMs = phase === "done" ? duration : recState.durationMillis || 0;

  return (
    <GalaxyBackground>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} testID="jam-close-button" hitSlop={12} style={styles.closeBtn}>
          <X size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={styles.recPill}>
          <View style={[styles.recDot, { backgroundColor: phase === "recording" ? colors.error : colors.muted }]} />
          <Text style={styles.recLabel}>{phase === "recording" ? "REC" : phase === "done" ? "READY" : "JAM NOW"}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.center}>
        <Text style={styles.timer} testID="jam-timer">
          {fmt(currentMs)}
        </Text>

        <View style={styles.waveBox}>
          <Waveform
            seed={recordedUri || "live"}
            color={phase === "recording" ? colors.error : colors.brandSecondary}
            height={120}
            bars={48}
            live={phase === "recording" ? liveBars : undefined}
          />
        </View>

        {blocked ? (
          <View style={styles.blockedBox}>
            <Text style={styles.blockedText}>Microphone access is blocked. Enable it in Settings to record.</Text>
            <NeonButton label="Open Settings" variant="outline" onPress={() => Linking.openSettings()} testID="open-settings-button" />
          </View>
        ) : phase === "idle" ? (
          <>
            <Text style={styles.hint}>Tap to start recording from your mic or plugged-in guitar</Text>
            <Pressable onPress={start} testID="start-record-button" style={({ pressed }) => [styles.bigRec, { opacity: pressed ? 0.85 : 1 }]}>
              <Microphone size={44} color={colors.onError} weight="fill" />
            </Pressable>
          </>
        ) : phase === "recording" ? (
          <Pressable onPress={stop} testID="stop-record-button" style={({ pressed }) => [styles.bigStop, { opacity: pressed ? 0.85 : 1 }]}>
            <View style={styles.stopSquare} />
          </Pressable>
        ) : (
          <View style={styles.doneRow}>
            <Pressable onPress={retake} testID="retake-button" style={styles.secondaryAction}>
              <ArrowCounterClockwise size={22} color={colors.onSurface} weight="bold" />
              <Text style={styles.secondaryText}>Retake</Text>
            </Pressable>
            <Pressable onPress={save} disabled={saving} testID="save-jam-button" style={styles.saveAction}>
              {saving ? <ActivityIndicator color={colors.onSuccess} /> : <Check size={26} color={colors.onSuccess} weight="bold" />}
              <Text style={styles.saveText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={{ paddingBottom: insets.bottom + 6 }}>
        <GrooveWatermark />
      </View>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  recPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surfaceSecondary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  recLabel: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.onSurface, letterSpacing: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28, paddingHorizontal: 24 },
  timer: { fontFamily: fonts.displayBold, fontSize: 72, color: colors.onSurface, letterSpacing: 2 },
  waveBox: { width: "100%", height: 130, justifyContent: "center", backgroundColor: "rgba(26,26,36,0.5)", borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border },
  hint: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "center", maxWidth: 300 },
  bigRec: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: colors.error, alignItems: "center", justifyContent: "center",
    shadowColor: colors.error, shadowOpacity: 0.7, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 12,
  },
  bigStop: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surfaceTertiary, borderWidth: 3, borderColor: colors.error,
    alignItems: "center", justifyContent: "center",
  },
  stopSquare: { width: 34, height: 34, borderRadius: 6, backgroundColor: colors.error },
  doneRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  secondaryAction: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, height: 56, borderRadius: 999, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border },
  secondaryText: { fontFamily: fonts.textMedium, fontSize: 16, color: colors.onSurface },
  saveAction: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 32, height: 56, borderRadius: 999, backgroundColor: colors.success, shadowColor: colors.success, shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  saveText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSuccess, letterSpacing: 1 },
  blockedBox: { gap: 16, alignItems: "center", maxWidth: 320 },
  blockedText: { fontFamily: fonts.text, fontSize: 14, color: colors.onSurfaceSecondary, textAlign: "center" },
}));
