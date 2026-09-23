import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, FlatList, RefreshControl, ActivityIndicator, Modal, TextInput, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CaretLeft, Play, Pause, DotsThreeVertical, PencilSimple, Sparkle, Plus, Export as ExportIcon, Trash } from "phosphor-react-native";
import { apiFetch } from "@/src/api";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark } from "@/src/components/ui";
import { Waveform } from "@/src/components/waveform";

type Session = { id: string; title: string; created_at: string; track_count: number; bpm?: number };

const TABS = ["ALL", "FAVORITES", "SESSIONS", "COLLABS"] as const;

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function QuickJams() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const qc = useQueryClient();

  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Session | null>(null);
  const [renameText, setRenameText] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: () => apiFetch("/sessions"),
  });

  const rename = useMutation({
    mutationFn: (p: { id: string; title: string }) => apiFetch(`/sessions/${p.id}`, { method: "PATCH", body: JSON.stringify({ title: p.title }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sessions"] }); setRenaming(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => apiFetch(`/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sessions"] }); setSelected(null); },
  });

  const list = useMemo(() => {
    const all = data ?? [];
    if (tab === "ALL" || tab === "SESSIONS") return all;
    return []; // FAVORITES / COLLABS not tracked yet — honest empty state
  }, [data, tab]);

  const sel = list.find((s) => s.id === selected) || null;

  const act = {
    play: () => sel && router.push(`/session/${sel.id}`),
    rename: () => { if (sel) { setRenameText(sel.title); setRenaming(sel); } },
    neural: () => sel && router.push("/neural"),
    studio: () => sel && router.push(`/session/${sel.id}`),
    export: () => sel && router.push(`/export/${sel.id}`),
    delete: () => sel && del.mutate(sel.id),
  };

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.back} onPress={() => router.back()} testID="qj-back" hitSlop={8}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>QUICK JAMS</Text>
          <Text style={styles.subtitle}>YOUR RECORDINGS. ANYTIME.</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((t) => {
            const on = t === tab;
            return (
              <Pressable key={t} onPress={() => setTab(t)} testID={`qj-tab-${t.toLowerCase()}`}
                style={[styles.chip, on && { backgroundColor: colors.brandSecondary, borderColor: colors.brandSecondary }]}>
                <Text style={[styles.chipText, { color: on ? colors.onBrandSecondary : colors.onSurfaceSecondary }]}>{t}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandSecondary} /></View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandSecondary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>{tab === "ALL" || tab === "SESSIONS" ? "No recordings yet — tap RECORD to capture your first take." : `No ${tab.toLowerCase()} yet.`}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const on = item.id === selected;
            return (
              <Pressable onPress={() => setSelected(on ? null : item.id)} style={[styles.row, on && styles.rowActive]} testID={`qj-row-${item.id}`}>
                <Pressable onPress={() => router.push(`/session/${item.id}`)} style={[styles.playCircle, on && { backgroundColor: colors.brandSecondary }]} testID={`qj-play-${item.id}`} hitSlop={6}>
                  {on ? <Pause size={18} color={colors.onBrandSecondary} weight="fill" /> : <Play size={18} color={colors.brandSecondary} weight="fill" />}
                </Pressable>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.rowDate} numberOfLines={1}>{fmtDate(item.created_at)}</Text>
                </View>
                <View style={{ width: 78, height: 26, overflow: "hidden" }}>
                  <Waveform seed={item.id} color={on ? colors.brandSecondary : colors.brandTertiary} height={26} bars={12} />
                </View>
                <Text style={styles.rowMeta}>{item.track_count}★</Text>
                <DotsThreeVertical size={20} color={colors.muted} weight="bold" />
              </Pressable>
            );
          }}
        />
      )}

      {/* Action bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        {([
          { k: "play", label: "Play", Icon: Play },
          { k: "rename", label: "Rename", Icon: PencilSimple },
          { k: "neural", label: "Neural\nClean", Icon: Sparkle },
          { k: "studio", label: "Add to\nStudio", Icon: Plus },
          { k: "export", label: "Export to\nGroovMash", Icon: ExportIcon, hi: true },
          { k: "delete", label: "Delete", Icon: Trash },
        ] as const).map((a) => (
          <Pressable key={a.k} disabled={!sel} onPress={() => (act as any)[a.k]()} testID={`qj-action-${a.k}`}
            style={[styles.action, a.hi && sel && styles.actionHi, !sel && { opacity: 0.35 }]}>
            <a.Icon size={20} color={a.k === "delete" ? colors.error : a.hi && sel ? colors.onBrandSecondary : colors.brandSecondary} weight="fill" />
            <Text style={[styles.actionLabel, a.hi && sel && { color: colors.onBrandSecondary }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ paddingBottom: insets.bottom + 2 }}><GrooveWatermark /></View>

      <Modal visible={!!renaming} transparent animationType="fade" onRequestClose={() => setRenaming(null)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename Recording</Text>
            <TextInput value={renameText} onChangeText={setRenameText} style={styles.input} placeholder="Title" placeholderTextColor={colors.muted}
              autoFocus testID="qj-rename-input" />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setRenaming(null)} testID="qj-rename-cancel">
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.brandSecondary, borderColor: colors.brandSecondary }]}
                onPress={() => renaming && renameText.trim() && rename.mutate({ id: renaming.id, title: renameText.trim() })} testID="qj-rename-save">
                <Text style={[styles.modalBtnText, { color: colors.onBrandSecondary }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.7)", borderWidth: 1, borderColor: colors.border },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 2 },
  subtitle: { fontFamily: fonts.textMedium, fontSize: 10, color: colors.onSurfaceSecondary, letterSpacing: 2, marginTop: 2 },
  tabsWrap: { height: 52, justifyContent: "center" },
  tabsRow: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  chip: { flexShrink: 0, height: 34, paddingHorizontal: 16, borderRadius: 17, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.6)" },
  chipText: { fontFamily: fonts.displayBold, fontSize: 12, letterSpacing: 1 },
  center: { alignItems: "center", justifyContent: "center", padding: 40 },
  empty: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 16, marginBottom: 10, backgroundColor: "rgba(7,26,43,0.7)", borderWidth: 1, borderColor: colors.divider },
  rowActive: { borderColor: colors.brandSecondary, backgroundColor: "rgba(45,164,255,0.12)" },
  playCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.brandSecondary, backgroundColor: "rgba(2,8,16,0.6)" },
  rowTitle: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.onSurface },
  rowDate: { fontFamily: fonts.text, fontSize: 11, color: colors.muted, marginTop: 2 },
  rowMeta: { fontFamily: fonts.numeric, fontSize: 12, color: colors.onSurfaceSecondary },
  actionBar: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-start", paddingTop: 12, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: "rgba(2,8,16,0.9)" },
  action: { alignItems: "center", gap: 4, width: 58 },
  actionHi: { backgroundColor: colors.brandSecondary, borderRadius: 12, paddingVertical: 6 },
  actionLabel: { fontFamily: fonts.textMedium, fontSize: 9, color: colors.onSurfaceSecondary, textAlign: "center", letterSpacing: 0.3 },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 30 },
  modalCard: { width: "100%", backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.onSurface, marginBottom: 14 },
  input: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 48, color: colors.onSurface, fontFamily: fonts.text, fontSize: 15 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.onSurface },
}));
