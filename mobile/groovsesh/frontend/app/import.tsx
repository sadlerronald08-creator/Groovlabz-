import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { CaretLeft, UploadSimple, FileAudio } from "phosphor-react-native";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark, NeonButton } from "@/src/components/ui";
import { apiFetch, uploadTrack } from "@/src/api";
import { queryClient } from "@/src/query-client";
import { useToast } from "@/src/components/toast";

export default function Import() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      setBusy(true);
      const session = await apiFetch<any>("/sessions", {
        method: "POST",
        body: JSON.stringify({ title: asset.name?.replace(/\.[^.]+$/, "") || "Imported audio", bpm: 90, count_in: true }),
      });
      await uploadTrack(session.id, asset.uri, {
        name: asset.name || "Imported",
        source: "import",
        duration: 0,
        color: 1,
      });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.show("Audio imported", "success");
      router.replace(`/session/${session.id}`);
    } catch (e: any) {
      toast.show(e?.message || "Import failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} testID="import-back" hitSlop={10} style={styles.iconBtn}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Import Audio</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <FileAudio size={64} color={colors.brandSecondary} weight="duotone" />
        </View>
        <Text style={styles.big}>Bring in existing audio</Text>
        <Text style={styles.sub}>Import a WAV, MP3 or M4A file to start a new session with it as your first layer.</Text>
        {busy ? (
          <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 20 }} />
        ) : (
          <NeonButton label="Choose a file" onPress={pick} icon={<UploadSimple size={20} color={colors.onBrandPrimary} weight="bold" />} testID="import-pick" style={{ marginTop: 20 }} />
        )}
      </View>

      <View style={{ paddingBottom: insets.bottom + 6 }}>
        <GrooveWatermark />
      </View>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 8 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(6,182,212,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  big: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.onSurface, textAlign: "center" },
  sub: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "center", maxWidth: 300 },
}));
