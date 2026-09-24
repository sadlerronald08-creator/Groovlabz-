import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Platform, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";
import { downloadAsync, cacheDirectory } from "expo-file-system/legacy";
import { CaretLeft, DownloadSimple, ShareNetwork, WaveTriangle, Lock, MusicNotes } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, glow } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark } from "@/src/components/ui";
import { apiFetch, audioSource } from "@/src/api";
import { useToast } from "@/src/components/toast";
import { useSubscription } from "@/lib/revenuecat";

const safeName = (t: string) => (t || "session").replace(/[^a-z0-9]/gi, "_");

export default function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { isSubscribed } = useSubscription();
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: () => apiFetch<any>(`/sessions/${id}`),
    enabled: !!id,
  });

  const tracks = data?.tracks || [];

  const deliver = async (uri: string, filename: string, doneMsg: string) => {
    if (Platform.OS === "web") {
      Linking.openURL(uri);
    } else {
      const r = await downloadAsync(uri, `${cacheDirectory}${filename}`);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(r.uri);
    }
    toast.show(doneMsg, "success");
  };

  const mixdown = async (fmt: "mp3" | "wav") => {
    if (fmt === "wav" && !isSubscribed) { router.push("/paywall?reason=wav"); return; }
    if (tracks.length === 0) { toast.show("Add a track first", "error"); return; }
    setBusy(fmt);
    try {
      const res = await apiFetch<any>(`/sessions/${id}/mixdown?format=${fmt}`, { method: "POST" });
      const src = await audioSource(res.audio_url);
      await deliver(src.uri, `${safeName(data.title)}.${fmt}`, fmt === "wav" ? "Lossless WAV exported" : "Mixdown exported");
    } catch (e: any) {
      toast.show(e?.message || "Export failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const stems = async () => {
    if (!isSubscribed) { router.push("/paywall?reason=stems"); return; }
    if (tracks.length === 0) { toast.show("Add a track first", "error"); return; }
    setBusy("stems");
    try {
      const res = await apiFetch<any>(`/sessions/${id}/stems`, { method: "POST" });
      const src = await audioSource(res.stems_url);
      await deliver(src.uri, `${safeName(data.title)}-stems.zip`, `${res.count} stems packed for GroovMash`);
    } catch (e: any) {
      toast.show(e?.message || "Stem export failed", "error");
    } finally {
      setBusy(null);
    }
  };

  if (isLoading || !data) {
    return (
      <GalaxyBackground>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brandSecondary} /></View>
      </GalaxyBackground>
    );
  }

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} testID="export-back" hitSlop={10} style={styles.iconBtn}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>EXPORT & SHARE</Text>
          <Text style={styles.subtitle}>MIX IT DOWN OR HAND OFF TO GROOVMASH</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.summary}>
          <MusicNotes size={22} color={colors.brandSecondary} weight="fill" />
          <Text style={styles.summaryText} numberOfLines={1}>{data.title} · {tracks.length} {tracks.length === 1 ? "track" : "tracks"}</Text>
        </View>

        <ExportOption icon={DownloadSimple} title="Export Audio File" desc="Combined mixdown (MP3) — share or save to your device"
          onPress={() => mixdown("mp3")} loading={busy === "mp3"} testID="export-audio" />

        <ExportOption icon={ShareNetwork} title="Send Stems to GroovMash" desc="Packs every track as a WAV stem (.zip) ready to open in GroovMash"
          onPress={stems} loading={busy === "stems"} locked={!isSubscribed} highlight testID="export-stems" />

        <ExportOption icon={WaveTriangle} title="Lossless WAV Export" desc="Studio-quality uncompressed WAV mixdown"
          onPress={() => mixdown("wav")} loading={busy === "wav"} locked={!isSubscribed} testID="export-wav" />
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 4 }}>
        <GrooveWatermark />
      </View>
    </GalaxyBackground>
  );
}

function ExportOption({ icon: Icon, title, desc, onPress, locked, loading, highlight, testID }: any) {
  const styles = useStyles();
  const { colors } = useTheme();
  const c = highlight ? colors.brandSecondary : colors.brandSecondary;
  return (
    <Pressable onPress={onPress} testID={testID} disabled={loading}
      style={({ pressed }) => [styles.option, highlight && styles.optionHi, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.optIcon, { borderColor: c }, glow(c, highlight ? 14 : 8, 0.6)]}>
        {loading ? <ActivityIndicator color={c} /> : <Icon size={24} color={c} weight="fill" />}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.optTitleRow}>
          <Text style={styles.optTitle}>{title}</Text>
          {locked && (
            <View style={styles.proTag}>
              <Lock size={11} color={colors.onBrandPrimary} weight="fill" />
              <Text style={styles.proTagText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={styles.optDesc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.7)", borderWidth: 1, borderColor: colors.border },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 2 },
  subtitle: { fontFamily: fonts.textMedium, fontSize: 10, color: colors.onSurfaceSecondary, letterSpacing: 2, marginTop: 2 },
  summary: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(7,26,43,0.7)", borderRadius: 14, borderWidth: 1, borderColor: colors.divider, padding: 14 },
  summaryText: { fontFamily: fonts.textMedium, fontSize: 15, color: colors.onSurface, flex: 1 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(7,26,43,0.7)", borderRadius: 16, borderWidth: 1, borderColor: colors.divider, padding: 16 },
  optionHi: { borderColor: colors.brandSecondary, backgroundColor: "rgba(45,164,255,0.12)" },
  optIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, backgroundColor: "rgba(2,8,16,0.6)", alignItems: "center", justifyContent: "center" },
  optTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  optTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.onSurface },
  optDesc: { fontFamily: fonts.text, fontSize: 12.5, color: colors.muted, marginTop: 3, lineHeight: 17 },
  proTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandPrimary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  proTagText: { fontFamily: fonts.displayBold, fontSize: 10, color: colors.onBrandPrimary, letterSpacing: 1 },
}));
