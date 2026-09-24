import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import Slider from "@react-native-community/slider";
import { X, Lock, Waveform as WaveIcon, Sparkle, Faders, Check } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, trackColors } from "@/src/theme";
import { Waveform } from "@/src/components/waveform";
import { NeonButton } from "@/src/components/ui";
import { apiFetch } from "@/src/api";
import { queryClient } from "@/src/query-client";
import { useToast } from "@/src/components/toast";
import { useSubscription } from "@/lib/revenuecat";

export default function ClipEditing() {
  const { id, session } = useLocalSearchParams<{ id: string; session: string }>();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { isSubscribed } = useSubscription();

  const { data, isLoading } = useQuery({
    queryKey: ["session", session],
    queryFn: () => apiFetch<any>(`/sessions/${session}`),
    enabled: !!session,
  });

  const track = useMemo(() => (data?.tracks || []).find((t: any) => t.id === id), [data, id]);

  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [gain, setGain] = useState(1);
  const [eq, setEq] = useState(false);
  const [reverb, setReverb] = useState(false);
  const [inited, setInited] = useState(false);

  if (track && !inited) {
    setTrimStart(track.effects.trim_start || 0);
    setTrimEnd(track.effects.trim_end || 0);
    setGain(track.effects.gain || 1);
    setEq(track.effects.eq || false);
    setReverb(track.effects.reverb || false);
    setInited(true);
  }

  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/tracks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ effects: { eq, reverb, gain, trim_start: trimStart, trim_end: trimEnd } }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", session] });
      toast.show("Clip saved", "success");
      router.back();
    },
    onError: () => toast.show("Could not save", "error"),
  });

  const requirePro = (fn: () => void) => {
    if (!isSubscribed) { router.push("/paywall?reason=effects"); return; }
    fn();
  };

  if (isLoading || !track) {
    return <View style={[styles.root, styles.center]}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  const col = trackColors[track.color % trackColors.length];
  const dur = track.duration || 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} testID="clip-close" hitSlop={10} style={styles.iconBtn}>
          <X size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{track.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.zoomWave}>
          <Waveform seed={track.id} color={col} height={140} bars={64} />
          {dur > 0 && (
            <>
              <View style={[styles.trimHandle, { left: `${(trimStart / dur) * 100}%`, borderColor: colors.brandPrimary }]} />
              <View style={[styles.trimHandle, { left: `${100 - (trimEnd / dur) * 100}%`, borderColor: colors.brandPrimary }]} />
            </>
          )}
        </View>

        {/* Trim (Pro) */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Trim / Cut</Text>
            {!isSubscribed && <ProTag />}
          </View>
          <Text style={styles.rowLabel}>Start · {trimStart.toFixed(1)}s</Text>
          <Slider style={{ height: 32 }} minimumValue={0} maximumValue={Math.max(dur, 1)} value={trimStart}
            disabled={!isSubscribed}
            minimumTrackTintColor={colors.brandPrimary} maximumTrackTintColor={colors.border} thumbTintColor={colors.brandPrimary}
            onValueChange={setTrimStart} testID="trim-start" />
          <Text style={styles.rowLabel}>End trim · {trimEnd.toFixed(1)}s</Text>
          <Slider style={{ height: 32 }} minimumValue={0} maximumValue={Math.max(dur, 1)} value={trimEnd}
            disabled={!isSubscribed}
            minimumTrackTintColor={colors.brandPrimary} maximumTrackTintColor={colors.border} thumbTintColor={colors.brandPrimary}
            onValueChange={setTrimEnd} testID="trim-end" />
          {!isSubscribed && (
            <Pressable style={styles.lockOverlay} onPress={() => router.push("/paywall?reason=effects")} testID="trim-lock" />
          )}
        </View>

        {/* Effects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Effects</Text>
          <View style={styles.fxRow}>
            <FxToggle label="EQ" icon={Faders} active={eq} locked={!isSubscribed} onPress={() => requirePro(() => setEq((v) => !v))} testID="fx-eq" />
            <FxToggle label="Reverb" icon={WaveIcon} active={reverb} locked={!isSubscribed} onPress={() => requirePro(() => setReverb((v) => !v))} testID="fx-reverb" />
          </View>
          <Text style={[styles.rowLabel, { marginTop: 10 }]}>Gain · {gain.toFixed(2)}x</Text>
          <Slider style={{ height: 32 }} minimumValue={0} maximumValue={2} value={gain}
            minimumTrackTintColor={colors.brandSecondary} maximumTrackTintColor={colors.border} thumbTintColor={colors.brandSecondary}
            onValueChange={setGain} testID="gain-slider" />
        </View>

        <NeonButton label="Save Clip" onPress={() => save.mutate()} loading={save.isPending} icon={<Check size={20} color={colors.onBrandPrimary} weight="bold" />} testID="clip-save" />
      </View>
    </View>
  );
}

function ProTag() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.proTag}>
      <Lock size={11} color={colors.onBrandPrimary} weight="fill" />
      <Text style={styles.proTagText}>PRO</Text>
    </View>
  );
}

function FxToggle({ label, icon: Icon, active, locked, onPress, testID }: any) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} testID={testID} style={[styles.fxToggle, active && { borderColor: colors.brandSecondary, backgroundColor: "rgba(6,182,212,0.15)" }]}>
      <Icon size={22} color={active ? colors.brandSecondary : colors.muted} weight={active ? "fill" : "regular"} />
      <Text style={[styles.fxLabel, { color: active ? colors.brandSecondary : colors.onSurface }]}>{label}</Text>
      {locked && <View style={styles.fxLock}><Lock size={12} color={colors.brandPrimary} weight="fill" /></View>}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface, flex: 1, textAlign: "center" },
  body: { padding: 16, gap: 16 },
  zoomWave: { height: 150, justifyContent: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, position: "relative", overflow: "hidden" },
  trimHandle: { position: "absolute", top: 0, bottom: 0, width: 3, borderLeftWidth: 3 },
  section: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4, position: "relative", overflow: "hidden" },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.onSurface, letterSpacing: 1 },
  rowLabel: { fontFamily: fonts.display, fontSize: 13, color: colors.onSurfaceSecondary, letterSpacing: 0.5 },
  lockOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  fxRow: { flexDirection: "row", gap: 12 },
  fxToggle: { flex: 1, height: 64, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center", gap: 4 },
  fxLabel: { fontFamily: fonts.textMedium, fontSize: 13 },
  fxLock: { position: "absolute", top: 6, right: 6 },
  proTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandPrimary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  proTagText: { fontFamily: fonts.displayBold, fontSize: 10, color: colors.onBrandPrimary, letterSpacing: 1 },
}));
