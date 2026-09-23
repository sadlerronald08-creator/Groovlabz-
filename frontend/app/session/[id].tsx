import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from "expo-audio";
import {
  CaretLeft, Play, Pause, Microphone, Metronome, Plus, SlidersHorizontal,
  Trash, Export as ExportIcon, X, Guitar,
} from "phosphor-react-native";
import { makeStyles, useTheme, fonts, trackColors } from "@/src/theme";
import { GrooveWatermark } from "@/src/components/ui";
import { Waveform } from "@/src/components/waveform";
import { apiFetch, uploadTrack } from "@/src/api";
import { queryClient } from "@/src/query-client";
import { useToast } from "@/src/components/toast";
import { useMultitrackPlayer, ensureRecordingMode, requestMicPermission, getMicPermission } from "@/src/audio/engine";
import { useSubscription } from "@/lib/revenuecat";
import { FREE_TRACK_LIMIT } from "@/src/config";

function fmt(sec: number) {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

type Track = {
  id: string; name: string; volume: number; muted: boolean; solo: boolean;
  duration: number; source: string; color: number; audio_url: string;
  effects: { eq: boolean; reverb: boolean; gain: number; trim_start: number; trim_end: number };
};

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { isSubscribed } = useSubscription();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 100);

  const [overrides, setOverrides] = useState<Record<string, Partial<Track>>>({});
  const [recording, setRecording] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [liveBars, setLiveBars] = useState<number[]>(new Array(40).fill(0.2));
  const barTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: () => apiFetch<any>(`/sessions/${id}`),
    enabled: !!id,
  });

  const tracks: Track[] = useMemo(() => {
    const base: Track[] = data?.tracks || [];
    return base.map((t) => ({ ...t, ...overrides[t.id] }));
  }, [data, overrides]);

  const player = useMultitrackPlayer(tracks);

  const patchTrack = useMutation({
    mutationFn: ({ trackId, body }: { trackId: string; body: any }) =>
      apiFetch(`/tracks/${trackId}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", id] }),
  });

  const delTrack = useMutation({
    mutationFn: (trackId: string) => apiFetch(`/tracks/${trackId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", id] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const patchSession = useMutation({
    mutationFn: (body: any) => apiFetch(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", id] }),
  });

  const setLocal = (trackId: string, patch: Partial<Track>) =>
    setOverrides((o) => ({ ...o, [trackId]: { ...o[trackId], ...patch } }));

  const toggleMute = (t: Track) => {
    if (player.isPlaying === false) {}
    Haptics.selectionAsync().catch(() => {});
    setLocal(t.id, { muted: !t.muted });
    patchTrack.mutate({ trackId: t.id, body: { muted: !t.muted } });
  };
  const toggleSolo = (t: Track) => {
    Haptics.selectionAsync().catch(() => {});
    setLocal(t.id, { solo: !t.solo });
    patchTrack.mutate({ trackId: t.id, body: { solo: !t.solo } });
  };

  useEffect(() => () => { if (barTimer.current) clearInterval(barTimer.current); }, []);

  const startRecording = async () => {
    if (!isSubscribed && tracks.length >= FREE_TRACK_LIMIT) {
      router.push("/paywall?reason=tracks");
      return;
    }
    let perm = await getMicPermission();
    if (!perm.granted) {
      if (perm.canAskAgain === false) { setBlocked(true); return; }
      perm = await requestMicPermission();
      if (!perm.granted) {
        if (!perm.canAskAgain) setBlocked(true);
        else toast.show("Microphone access is needed to record", "error");
        return;
      }
    }
    setBlocked(false);
    try {
      if (player.isPlaying) player.pause();
      await ensureRecordingMode();
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
      if (barTimer.current) clearInterval(barTimer.current);
      barTimer.current = setInterval(() => {
        setLiveBars((prev) => [...prev.slice(1), 0.25 + Math.random() * 0.75]);
      }, 110);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {
      toast.show("Could not start recording", "error");
    }
  };

  const stopRecording = async () => {
    if (barTimer.current) { clearInterval(barTimer.current); barTimer.current = null; }
    const dur = (recState.durationMillis || 0) / 1000;
    setRecording(false);
    setUploading(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        await uploadTrack(id!, uri, {
          name: `Take ${tracks.length + 1}`,
          source: "mic",
          duration: dur,
          color: tracks.length % trackColors.length,
        });
        queryClient.invalidateQueries({ queryKey: ["session", id] });
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
        toast.show("Track added", "success");
      }
    } catch (e: any) {
      toast.show(e?.message || "Could not save take", "error");
    } finally {
      setUploading(false);
      setLiveBars(new Array(40).fill(0.2));
    }
  };

  if (isLoading || !data) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  const metronomeOn = data.metronome;

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} testID="session-back-button" hitSlop={10} style={styles.iconBtn}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
          <Text style={styles.timecode}>{fmt(player.position)} / {fmt(player.maxDuration)}</Text>
        </View>
        <Pressable onPress={() => router.push(`/export/${id}`)} testID="session-export-button" hitSlop={10} style={styles.iconBtn}>
          <ExportIcon size={22} color={colors.brandSecondary} weight="bold" />
        </Pressable>
      </View>

      {/* Track lanes */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.lanes} showsVerticalScrollIndicator={false}>
        {tracks.length === 0 ? (
          <View style={styles.empty}>
            <Guitar size={64} color={colors.brandTertiary} weight="duotone" />
            <Text style={styles.emptyTitle}>No tracks yet</Text>
            <Text style={styles.emptyText}>Tap the record button below to lay down your first layer</Text>
          </View>
        ) : (
          tracks.map((t) => {
            const col = trackColors[t.color % trackColors.length];
            return (
              <View key={t.id} style={styles.lane} testID={`track-lane-${t.id}`}>
                <View style={styles.laneControls}>
                  <View style={styles.laneNameRow}>
                    <View style={[styles.colorDot, { backgroundColor: col }]} />
                    <Text style={styles.laneName} numberOfLines={1}>{t.name}</Text>
                  </View>
                  <View style={styles.msRow}>
                    <Pressable
                      onPress={() => toggleMute(t)}
                      testID={`mute-${t.id}`}
                      style={[styles.msBtn, t.muted && { backgroundColor: colors.warning, borderColor: colors.warning }]}
                    >
                      <Text style={[styles.msText, t.muted && { color: colors.onWarning }]}>M</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => toggleSolo(t)}
                      testID={`solo-${t.id}`}
                      style={[styles.msBtn, t.solo && { backgroundColor: colors.brandSecondary, borderColor: colors.brandSecondary }]}
                    >
                      <Text style={[styles.msText, t.solo && { color: colors.onBrandSecondary }]}>S</Text>
                    </Pressable>
                    <Pressable onPress={() => router.push(`/clip/${t.id}?session=${id}`)} testID={`edit-${t.id}`} style={styles.msBtn}>
                      <SlidersHorizontal size={15} color={colors.onSurface} />
                    </Pressable>
                    <Pressable onPress={() => delTrack.mutate(t.id)} testID={`delete-${t.id}`} style={styles.msBtn}>
                      <Trash size={15} color={colors.error} />
                    </Pressable>
                  </View>
                  <Slider
                    style={{ width: "100%", height: 28 }}
                    minimumValue={0}
                    maximumValue={1}
                    value={t.volume}
                    minimumTrackTintColor={col}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={col}
                    onValueChange={(v) => setLocal(t.id, { volume: v })}
                    onSlidingComplete={(v) => patchTrack.mutate({ trackId: t.id, body: { volume: v } })}
                    testID={`volume-${t.id}`}
                  />
                </View>
                <Pressable style={styles.laneWave} onPress={() => router.push(`/clip/${t.id}?session=${id}`)}>
                  <Waveform seed={t.id} color={col} height={56} bars={40} progress={player.maxDuration ? player.position / player.maxDuration : 0} />
                </Pressable>
              </View>
            );
          })
        )}

        {!isSubscribed && (
          <Pressable style={styles.limitBanner} onPress={() => router.push("/paywall?reason=tracks")} testID="track-limit-banner">
            <Text style={styles.limitText}>
              Free plan: {tracks.length}/{FREE_TRACK_LIMIT} tracks · <Text style={{ color: colors.brandPrimary }}>Go Pro for unlimited</Text>
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Recording overlay */}
      {recording && (
        <View style={styles.recOverlay} testID="recording-overlay">
          <View style={styles.recTimerRow}>
            <View style={styles.recDot} />
            <Text style={styles.recTimer}>{fmt((recState.durationMillis || 0) / 1000)}</Text>
          </View>
          <View style={styles.recWave}>
            <Waveform seed="rec" color={colors.error} height={70} bars={40} live={liveBars} />
          </View>
          <Pressable onPress={stopRecording} testID="stop-track-record" style={styles.recStop}>
            <View style={styles.recStopSquare} />
          </Pressable>
        </View>
      )}

      {/* Transport bar */}
      <View style={[styles.transport, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          onPress={() => { const v = !metronomeOn; patchSession.mutate({ metronome: v }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }}
          testID="metronome-toggle"
          style={[styles.transportBtn, metronomeOn && { borderColor: colors.brandSecondary }]}
        >
          <Metronome size={22} color={metronomeOn ? colors.brandSecondary : colors.muted} weight={metronomeOn ? "fill" : "regular"} />
          <Text style={[styles.tBpm, { color: metronomeOn ? colors.brandSecondary : colors.muted }]}>{data.bpm}</Text>
        </Pressable>

        <Pressable
          onPress={player.toggle}
          disabled={tracks.length === 0}
          testID="transport-play"
          style={[styles.playBtn, { opacity: tracks.length === 0 ? 0.4 : 1 }]}
        >
          {player.isPlaying ? <Pause size={30} color={colors.onSurface} weight="fill" /> : <Play size={30} color={colors.onSurface} weight="fill" />}
        </Pressable>

        <Pressable
          onPress={recording ? stopRecording : startRecording}
          disabled={uploading}
          testID="transport-record"
          style={[styles.recBtn, recording && { backgroundColor: colors.surfaceTertiary, borderColor: colors.error, borderWidth: 3 }]}
        >
          {uploading ? (
            <ActivityIndicator color={colors.onError} />
          ) : recording ? (
            <View style={styles.recStopSquareSm} />
          ) : (
            <Microphone size={26} color={colors.onError} weight="fill" />
          )}
        </Pressable>
      </View>

      {blocked && (
        <View style={styles.blockedBar} testID="mic-blocked-bar">
          <Text style={styles.blockedText}>Microphone blocked.</Text>
          <Pressable onPress={() => Linking.openSettings()}><Text style={styles.blockedLink}>Open Settings</Text></Pressable>
          <Pressable onPress={() => setBlocked(false)}><X size={16} color={colors.onSurface} /></Pressable>
        </View>
      )}

      <View style={{ paddingBottom: insets.bottom }}>
        <GrooveWatermark />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 8,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface, letterSpacing: 0.5, maxWidth: 220 },
  timecode: { fontFamily: fonts.display, fontSize: 13, color: colors.brandSecondary, letterSpacing: 1 },
  lanes: { padding: 12, gap: 10, paddingBottom: 20 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 70, gap: 12 },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface },
  emptyText: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "center", maxWidth: 260 },
  lane: {
    flexDirection: "row", backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 10, gap: 10, minHeight: 108,
  },
  laneControls: { width: 148, gap: 6 },
  laneNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  laneName: { fontFamily: fonts.textMedium, fontSize: 14, color: colors.onSurface, flex: 1 },
  msRow: { flexDirection: "row", gap: 6 },
  msBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  msText: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.onSurface },
  laneWave: { flex: 1, justifyContent: "center", backgroundColor: "rgba(13,13,18,0.4)", borderRadius: 10, paddingHorizontal: 8 },
  limitBanner: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  limitText: { fontFamily: fonts.text, fontSize: 13, color: colors.muted },
  recOverlay: {
    position: "absolute", left: 16, right: 16, bottom: 110, backgroundColor: colors.surfaceTertiary, borderRadius: 16,
    borderWidth: 1, borderColor: colors.error, padding: 14, gap: 10, alignItems: "center", zIndex: 20,
    shadowColor: colors.error, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  recTimerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.error },
  recTimer: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.onSurface, letterSpacing: 1 },
  recWave: { width: "100%", height: 70, justifyContent: "center" },
  recStop: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.error, alignItems: "center", justifyContent: "center" },
  recStopSquare: { width: 24, height: 24, borderRadius: 5, backgroundColor: colors.onError },
  recStopSquareSm: { width: 22, height: 22, borderRadius: 4, backgroundColor: colors.error },
  transport: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 24, paddingTop: 14,
    backgroundColor: colors.surfaceTertiary, borderTopWidth: 1, borderTopColor: colors.border,
  },
  transportBtn: { alignItems: "center", justifyContent: "center", gap: 2, width: 64, height: 56, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  tBpm: { fontFamily: fonts.display, fontSize: 12 },
  playBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", shadowColor: colors.brandTertiary, shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  recBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.error, alignItems: "center", justifyContent: "center", shadowColor: colors.error, shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  blockedBar: { position: "absolute", bottom: 100, left: 16, right: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.surfaceInverse, borderRadius: 12, padding: 12 },
  blockedText: { fontFamily: fonts.text, fontSize: 13, color: colors.onSurfaceInverse },
  blockedLink: { fontFamily: fonts.textMedium, fontSize: 13, color: colors.info },
}));
