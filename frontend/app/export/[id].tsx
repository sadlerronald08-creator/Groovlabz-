import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Platform, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";
import { downloadAsync, cacheDirectory } from "expo-file-system/legacy";
import { CaretLeft, DownloadSimple, ShareNetwork, WaveTriangle, Lock, MusicNotes } from "phosphor-react-native";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GrooveWatermark } from "@/src/components/ui";
import { apiFetch, audioSource } from "@/src/api";
import { useToast } from "@/src/components/toast";
import { useSubscription } from "@/lib/revenuecat";

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

  const exportAudio = async () => {
    if (tracks.length === 0) { toast.show("Add a track first", "error"); return; }
    setBusy("audio");
    try {
      const src = await audioSource(tracks[0].audio_url);
      if (Platform.OS === "web") {
        Linking.openURL(src.uri);
        toast.show("Download started", "success");
      } else {
        const target = `${cacheDirectory}${data.title.replace(/[^a-z0-9]/gi, "_")}.m4a`;
        const res = await downloadAsync(src.uri, target);
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(res.uri);
        toast.show("Mixdown exported", "success");
      }
    } catch {
      toast.show("Export failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const proAction = (label: string) => {
    if (!isSubscribed) { router.push("/paywall?reason=wav"); return; }
    toast.show(label, "success");
  };

  const stems = () => {
    if (!isSubscribed) { router.push("/paywall?reason=stems"); return; }
    toast.show("Stems sent to GroovTracks", "success");
  };

  if (isLoading || !data) {
    return <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} testID="export-back" hitSlop={10} style={styles.iconBtn}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Export & Share</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.summary}>
          <MusicNotes size={22} color={colors.brandSecondary} weight="fill" />
          <Text style={styles.summaryText}>{data.title} · {tracks.length} {tracks.length === 1 ? "track" : "tracks"}</Text>
        </View>

        <ExportOption
          icon={DownloadSimple}
          title="Export Audio File"
          desc="Compressed mixdown (M4A) — share or save to your device"
          onPress={exportAudio}
          loading={busy === "audio"}
          testID="export-audio"
        />

        <ExportOption
          icon={ShareNetwork}
          title="Send Stems to GroovTracks"
          desc="Hand off individual track stems to your GroovTracks project"
          onPress={stems}
          locked={!isSubscribed}
          testID="export-stems"
        />

        <ExportOption
          icon={WaveTriangle}
          title="Lossless WAV Export"
          desc="Studio-quality uncompressed WAV mixdown"
          onPress={() => proAction("WAV export started")}
          locked={!isSubscribed}
          testID="export-wav"
        />
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 4 }}>
        <GrooveWatermark />
      </View>
    </View>
  );
}

function ExportOption({ icon: Icon, title, desc, onPress, locked, loading, testID }: any) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} testID={testID} style={styles.option}>
      <View style={styles.optIcon}>
        {loading ? <ActivityIndicator color={colors.brandSecondary} /> : <Icon size={26} color={colors.brandSecondary} weight="fill" />}
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
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 1 },
  summary: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
  summaryText: { fontFamily: fonts.textMedium, fontSize: 15, color: colors.onSurface },
  option: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16 },
  optIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "rgba(6,182,212,0.12)", alignItems: "center", justifyContent: "center" },
  optTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  optTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.onSurface },
  optDesc: { fontFamily: fonts.text, fontSize: 12.5, color: colors.muted, marginTop: 3, lineHeight: 17 },
  proTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandPrimary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  proTagText: { fontFamily: fonts.displayBold, fontSize: 10, color: colors.onBrandPrimary, letterSpacing: 1 },
}));
