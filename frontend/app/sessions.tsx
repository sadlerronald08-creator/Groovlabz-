import React from "react";
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CaretLeft, Trash, MusicNotes, Plus } from "phosphor-react-native";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GrooveWatermark, SessionCover } from "@/src/components/ui";
import { apiFetch } from "@/src/api";
import { queryClient } from "@/src/query-client";
import { useToast } from "@/src/components/toast";

export default function Sessions() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiFetch<any[]>("/sessions"),
  });

  const create = useMutation({
    mutationFn: () => apiFetch<any>("/sessions", { method: "POST", body: JSON.stringify({ title: `Session ${new Date().toLocaleDateString()}`, bpm: 90, count_in: true }) }),
    onSuccess: (s) => { queryClient.invalidateQueries({ queryKey: ["sessions"] }); router.push(`/session/${s.id}`); },
  });

  const del = useMutation({
    mutationFn: (id: string) => apiFetch(`/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sessions"] }); toast.show("Session deleted", "success"); },
  });

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} testID="sessions-back" hitSlop={10} style={styles.iconBtn}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.title}>My Sessions</Text>
        <Pressable onPress={() => create.mutate()} testID="sessions-new" hitSlop={10} style={styles.iconBtn}>
          <Plus size={22} color={colors.brandPrimary} weight="bold" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centerFill}><ActivityIndicator color={colors.brandPrimary} /></View>
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MusicNotes size={60} color={colors.brandTertiary} weight="duotone" />
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyText}>Start your first jam and it will show up here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/session/${item.id}`)} testID={`session-card-${item.id}`}>
              <SessionCover id={item.id} title={item.title} size={52} radius={12} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.track_count} {item.track_count === 1 ? "track" : "tracks"} · {new Date(item.updated_at).toLocaleDateString()}
                </Text>
              </View>
              <Pressable onPress={() => del.mutate(item.id)} hitSlop={10} testID={`session-delete-${item.id}`} style={styles.delBtn}>
                <Trash size={18} color={colors.error} />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <View style={{ paddingBottom: insets.bottom + 4 }}>
        <GrooveWatermark />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 1 },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 90, gap: 12 },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface },
  emptyText: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "center", maxWidth: 260 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: fonts.textMedium, fontSize: 16, color: colors.onSurface },
  cardMeta: { fontFamily: fonts.display, fontSize: 13, color: colors.muted, marginTop: 2, letterSpacing: 0.5 },
  delBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
}));
