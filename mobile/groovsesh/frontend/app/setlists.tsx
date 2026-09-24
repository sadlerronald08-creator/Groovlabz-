import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, Modal, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CaretLeft, Plus, Trash, ListNumbers, Play, CaretUp, CaretDown, CaretRight, X } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, glow } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark, NeonButton } from "@/src/components/ui";
import { useSongbook, useSetlists, newId, Setlist } from "@/src/library";

export default function SetlistsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const songs = useSongbook();
  const sets = useSetlists();
  const [editing, setEditing] = useState<Setlist | null>(null);
  const [running, setRunning] = useState<Setlist | null>(null);
  const [idx, setIdx] = useState(0);

  const songById = useMemo(() => Object.fromEntries(songs.items.map((s) => [s.id, s])), [songs.items]);
  const startNew = () => setEditing({ id: newId(), name: "", song_ids: [], created_at: new Date().toISOString() });

  const move = (list: string[], i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  const runSongs = running ? running.song_ids.map((id) => songById[id]).filter(Boolean) : [];
  const current = runSongs[idx];

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.back} onPress={() => router.back()} testID="setlists-back" hitSlop={8}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>SETLISTS</Text>
          <Text style={styles.subtitle}>GIG-READY · START TO FINISH</Text>
        </View>
        <Pressable style={styles.back} onPress={startNew} testID="setlist-add" hitSlop={8}>
          <Plus size={22} color={colors.brandSecondary} weight="bold" />
        </Pressable>
      </View>

      <FlatList
        data={sets.items}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24, flexGrow: 1 }}
        ListEmptyComponent={
          sets.loaded ? (
            <View style={styles.center}>
              <View style={[styles.iconCircle, glow(colors.info, 22, 0.8)]}>
                <ListNumbers size={40} color={colors.info} weight="fill" />
              </View>
              <Text style={styles.empty}>No setlists yet.</Text>
              <Text style={styles.emptySub}>
                {songs.items.length === 0 ? "Add songs to your Songbook first, then arrange them into a set." : "Arrange songs from your Songbook into a set and run it on stage."}
              </Text>
              {songs.items.length === 0 ? (
                <NeonButton label="Open Songbook" onPress={() => router.push("/songbook")} style={{ marginTop: 18 }} testID="setlist-open-songbook" />
              ) : (
                <NeonButton label="Create a Setlist" onPress={startNew} style={{ marginTop: 18 }} testID="setlist-add-first" />
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => setEditing(item)} style={styles.row} testID={`setlist-row-${item.id}`}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.rowSub}>{item.song_ids.length} {item.song_ids.length === 1 ? "song" : "songs"}</Text>
            </View>
            <Pressable onPress={() => { setRunning(item); setIdx(0); }} disabled={item.song_ids.length === 0} style={[styles.playCircle, item.song_ids.length === 0 && { opacity: 0.35 }]} hitSlop={6} testID={`setlist-run-${item.id}`}>
              <Play size={18} color={colors.brandSecondary} weight="fill" />
            </Pressable>
            <Pressable onPress={() => sets.remove(item.id)} hitSlop={8} testID={`setlist-delete-${item.id}`}><Trash size={18} color={colors.error} /></Pressable>
          </Pressable>
        )}
      />

      <View style={{ paddingBottom: insets.bottom + 2 }}><GrooveWatermark /></View>

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        {editing && (
          <View style={styles.modalWrap}>
            <View style={[styles.modalCard, { maxHeight: "85%" }]}>
              <Text style={styles.modalTitle}>{sets.items.some((s) => s.id === editing.id) ? "Edit Setlist" : "New Setlist"}</Text>
              <TextInput value={editing.name} onChangeText={(t) => setEditing({ ...editing, name: t })} style={styles.input} placeholder="Setlist name (e.g. Friday · The Basement)" placeholderTextColor={colors.muted} autoFocus testID="setlist-name-input" />
              <Text style={styles.section}>IN THIS SET</Text>
              <ScrollView style={{ maxHeight: 180 }}>
                {editing.song_ids.length === 0 && <Text style={styles.rowSub}>Tap songs below to add them.</Text>}
                {editing.song_ids.map((id, i) => songById[id] ? (
                  <View key={id} style={styles.setRow}>
                    <Text style={styles.num}>{i + 1}</Text>
                    <Text style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1}>{songById[id].title}</Text>
                    <Pressable onPress={() => setEditing({ ...editing, song_ids: move(editing.song_ids, i, -1) })} hitSlop={6} testID={`setlist-up-${id}`}><CaretUp size={18} color={colors.muted} /></Pressable>
                    <Pressable onPress={() => setEditing({ ...editing, song_ids: move(editing.song_ids, i, 1) })} hitSlop={6} testID={`setlist-down-${id}`}><CaretDown size={18} color={colors.muted} /></Pressable>
                    <Pressable onPress={() => setEditing({ ...editing, song_ids: editing.song_ids.filter((x) => x !== id) })} hitSlop={6} testID={`setlist-remove-${id}`}><X size={18} color={colors.error} /></Pressable>
                  </View>
                ) : null)}
              </ScrollView>
              <Text style={styles.section}>SONGBOOK</Text>
              <ScrollView style={{ maxHeight: 160 }}>
                {songs.items.filter((s) => !editing.song_ids.includes(s.id)).map((s) => (
                  <Pressable key={s.id} onPress={() => setEditing({ ...editing, song_ids: [...editing.song_ids, s.id] })} style={styles.setRow} testID={`setlist-pick-${s.id}`}>
                    <Plus size={16} color={colors.brandSecondary} weight="bold" />
                    <Text style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.rowSub}>{s.key}</Text>
                  </Pressable>
                ))}
                {songs.items.length === 0 && <Text style={styles.rowSub}>Your Songbook is empty — add songs there first.</Text>}
              </ScrollView>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <Pressable style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setEditing(null)} testID="setlist-cancel"><Text style={styles.modalBtnText}>Cancel</Text></Pressable>
                <Pressable style={[styles.modalBtn, { backgroundColor: colors.brandSecondary, borderColor: colors.brandSecondary }, !editing.name.trim() && { opacity: 0.5 }]} disabled={!editing.name.trim()}
                  onPress={() => { sets.upsert({ ...editing, name: editing.name.trim() }); setEditing(null); }} testID="setlist-save">
                  <Text style={[styles.modalBtnText, { color: colors.onBrandSecondary }]}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Modal>

      <Modal visible={!!running} animationType="slide" onRequestClose={() => setRunning(null)}>
        <GalaxyBackground>
          <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16, paddingHorizontal: 20 }} testID="setlist-run-screen">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable style={styles.back} onPress={() => setRunning(null)} testID="setlist-run-close" hitSlop={8}><X size={22} color={colors.onSurface} weight="bold" /></Pressable>
              <Text style={[styles.subtitle, { flex: 1, textAlign: "center" }]}>{running?.name.toUpperCase()} · {idx + 1} / {runSongs.length}</Text>
              <View style={{ width: 40 }} />
            </View>
            <View style={{ flex: 1, justifyContent: "center" }}>
              {current ? (
                <>
                  <Text style={styles.runKey}>KEY OF {current.key}{current.bpm ? ` · ${current.bpm} BPM` : ""}</Text>
                  <Text style={styles.runTitle} testID="setlist-run-title">{current.title}</Text>
                  <Text style={styles.rowSub}>{current.artist || ""}</Text>
                  <ScrollView style={{ marginTop: 18, maxHeight: 320 }}><Text style={styles.notes}>{current.notes || "No chords or lyrics saved for this song."}</Text></ScrollView>
                </>
              ) : (
                <Text style={styles.empty}>This set has no songs.</Text>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <NeonButton label="Previous" variant="secondary" onPress={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} style={{ flex: 1 }} testID="setlist-run-prev" />
              <NeonButton label={idx >= runSongs.length - 1 ? "Finish Set" : "Next Song"} onPress={() => (idx >= runSongs.length - 1 ? setRunning(null) : setIdx((i) => i + 1))} style={{ flex: 1 }} icon={<CaretRight size={16} color={colors.onBrandPrimary} weight="bold" />} testID="setlist-run-next" />
            </View>
          </View>
        </GalaxyBackground>
      </Modal>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.7)", borderWidth: 1, borderColor: colors.border },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 2 },
  subtitle: { fontFamily: fonts.textMedium, fontSize: 10, color: colors.onSurfaceSecondary, letterSpacing: 2, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: colors.info, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.7)", marginBottom: 16 },
  empty: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface, textAlign: "center" },
  emptySub: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 6, maxWidth: 300 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, marginBottom: 10, backgroundColor: "rgba(7,26,43,0.7)", borderWidth: 1, borderColor: colors.divider },
  rowTitle: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.onSurface },
  rowSub: { fontFamily: fonts.text, fontSize: 11, color: colors.muted, marginTop: 2 },
  playCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.brandSecondary, backgroundColor: "rgba(2,8,16,0.6)" },
  section: { fontFamily: fonts.textMedium, fontSize: 10, color: colors.onSurfaceSecondary, letterSpacing: 2, marginTop: 8 },
  setRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  num: { fontFamily: fonts.numeric, fontSize: 12, color: colors.brandSecondary, width: 18 },
  runKey: { fontFamily: fonts.textMedium, fontSize: 11, color: colors.brandSecondary, letterSpacing: 2 },
  runTitle: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.onSurface, marginTop: 6 },
  notes: { fontFamily: fonts.text, fontSize: 17, color: colors.onSurface, lineHeight: 27 },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 22 },
  modalCard: { width: "100%", backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 8 },
  modalTitle: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.onSurface },
  input: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 48, color: colors.onSurface, fontFamily: fonts.text, fontSize: 15 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.onSurface },
}));
