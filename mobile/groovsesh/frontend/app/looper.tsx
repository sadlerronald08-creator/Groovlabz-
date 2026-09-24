import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, createAudioPlayer } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { CaretLeft, Repeat, Microphone, Stop, Play, Pause, Trash, Plus } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, glow } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark, NeonButton } from "@/src/components/ui";
import { ensureRecordingMode, ensurePlaybackMode, requestMicPermission } from "@/src/audio/engine";
import { useToast } from "@/src/components/toast";

type Layer = { id: string; uri: string; player: AudioPlayer; durationMs: number };

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

export default function LooperScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 100);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const loopTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopMs = layers[0]?.durationMs ?? 0;

  useEffect(() => () => {
    if (loopTimer.current) clearInterval(loopTimer.current);
    layers.forEach((l) => { try { l.player.remove(); } catch {} });
  }, []);

  const restartAll = (ls: Layer[]) => ls.forEach((l) => { try { l.player.seekTo(0); l.player.play(); } catch {} });

  const startLoop = (ls: Layer[]) => {
    if (ls.length === 0) return;
    if (loopTimer.current) clearInterval(loopTimer.current);
    restartAll(ls);
    loopTimer.current = setInterval(() => restartAll(ls), ls[0].durationMs);
    setPlaying(true);
  };

  const stopLoop = () => {
    if (loopTimer.current) clearInterval(loopTimer.current);
    loopTimer.current = null;
    layers.forEach((l) => { try { l.player.pause(); } catch {} });
    setPlaying(false);
  };

  const startRecording = async () => {
    const ok = await requestMicPermission();
    if (!ok) { toast.show("Microphone permission is needed to loop", "error"); return; }
    try {
      await ensureRecordingMode();
      await recorder.prepareToRecordAsync();
      if (layers.length > 0) startLoop(layers);
      recorder.record();
      setRecording(true);
    } catch {
      toast.show("Could not start recording", "error");
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      const dur = Math.max(250, Math.round(recState.durationMillis || 0));
      await ensurePlaybackMode();
      if (!uri) throw new Error("no audio");
      const player = createAudioPlayer({ uri });
      const layer: Layer = { id: `${Date.now()}`, uri, player, durationMs: layers[0]?.durationMs ?? dur };
      const next = [...layers, layer];
      setLayers(next);
      startLoop(next);
      toast.show(layers.length === 0 ? "Loop captured — it's rolling" : `Layer ${next.length} stacked`, "success");
    } catch {
      toast.show("Recording failed", "error");
    } finally {
      setRecording(false);
    }
  };

  const removeLayer = (id: string) => {
    const l = layers.find((x) => x.id === id);
    try { l?.player.remove(); } catch {}
    const next = layers.filter((x) => x.id !== id);
    setLayers(next);
    if (next.length === 0) stopLoop(); else if (playing) startLoop(next);
  };

  const clearAll = () => { stopLoop(); layers.forEach((l) => { try { l.player.remove(); } catch {} }); setLayers([]); };

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.back} onPress={() => router.back()} testID="looper-back" hitSlop={8}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>LOOPER</Text>
          <Text style={styles.subtitle}>CAPTURE A PHRASE · STACK LAYERS IN TIME</Text>
        </View>
        <Pressable style={styles.back} onPress={clearAll} disabled={layers.length === 0} testID="looper-clear" hitSlop={8}>
          <Trash size={20} color={layers.length ? colors.error : colors.muted} />
        </Pressable>
      </View>

      <View style={styles.stage} testID="looper-screen">
        <View style={[styles.ring, { borderColor: recording ? colors.error : colors.brandSecondary }, glow(recording ? colors.error : colors.brandSecondary, 26, 0.8)]}>
          <Repeat size={30} color={recording ? colors.error : colors.brandSecondary} weight="fill" />
          <Text style={styles.time} testID="looper-time">{recording ? fmt(recState.durationMillis || 0) : loopMs ? fmt(loopMs) : "--:--"}</Text>
          <Text style={styles.status}>{recording ? "RECORDING" : playing ? "LOOPING" : layers.length ? "STOPPED" : "READY"}</Text>
        </View>

        <Text style={styles.hint}>
          {layers.length === 0
            ? "Tap record, play a phrase, tap stop. The loop starts rolling instantly."
            : "The loop plays while you record — every new take stacks on top in time."}
        </Text>

        <View style={styles.controls}>
          <Pressable onPress={() => (playing ? stopLoop() : startLoop(layers))} disabled={layers.length === 0 || recording}
            style={[styles.ctl, (layers.length === 0 || recording) && { opacity: 0.35 }]} testID="looper-play">
            {playing ? <Pause size={22} color={colors.brandSecondary} weight="fill" /> : <Play size={22} color={colors.brandSecondary} weight="fill" />}
          </Pressable>
          <Pressable onPress={recording ? stopRecording : startRecording}
            style={[styles.recBtn, { backgroundColor: recording ? colors.error : colors.brandPrimary }, glow(recording ? colors.error : colors.brandPrimary, 20, 0.9)]} testID="looper-record">
            {recording ? <Stop size={30} color="#fff" weight="fill" /> : layers.length ? <Plus size={30} color={colors.onBrandPrimary} weight="bold" /> : <Microphone size={30} color={colors.onBrandPrimary} weight="fill" />}
          </Pressable>
          <View style={{ width: 56 }} />
        </View>

        <View style={styles.layers}>
          {layers.map((l, i) => (
            <View key={l.id} style={styles.layerRow} testID={`looper-layer-${i + 1}`}>
              <Text style={styles.layerNum}>{i + 1}</Text>
              <Text style={styles.layerText}>{i === 0 ? "Base loop" : `Layer ${i + 1}`} · {fmt(l.durationMs)}</Text>
              <Pressable onPress={() => removeLayer(l.id)} hitSlop={8} testID={`looper-layer-remove-${i + 1}`}><Trash size={16} color={colors.error} /></Pressable>
            </View>
          ))}
        </View>

        {layers.length > 0 && (
          <NeonButton label="Save Loop as a Take" variant="secondary" onPress={() => router.push("/record")} style={{ marginTop: 8 }} testID="looper-to-record" />
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
  subtitle: { fontFamily: fonts.textMedium, fontSize: 10, color: colors.onSurfaceSecondary, letterSpacing: 2, marginTop: 2 },
  stage: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 16, gap: 18 },
  ring: { width: 190, height: 190, borderRadius: 95, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.75)", gap: 6 },
  time: { fontFamily: fonts.numeric, fontSize: 34, color: colors.onSurface },
  status: { fontFamily: fonts.textMedium, fontSize: 10, color: colors.onSurfaceSecondary, letterSpacing: 3 },
  hint: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, textAlign: "center", maxWidth: 300 },
  controls: { flexDirection: "row", alignItems: "center", gap: 22 },
  ctl: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: colors.brandSecondary, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,8,16,0.6)" },
  recBtn: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  layers: { width: "100%", gap: 8 },
  layerRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, backgroundColor: "rgba(7,26,43,0.7)", borderWidth: 1, borderColor: colors.divider },
  layerNum: { fontFamily: fonts.numeric, fontSize: 13, color: colors.brandSecondary, width: 18 },
  layerText: { flex: 1, fontFamily: fonts.textMedium, fontSize: 14, color: colors.onSurface },
}));
