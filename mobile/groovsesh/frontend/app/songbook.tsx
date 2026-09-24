import React, { useState } from "react";
import { View, Text, Pressable, FlatList, Modal, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CaretLeft, Plus, Trash, PencilSimple, BookOpen } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, glow } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark, NeonButton } from "@/src/components/ui";
import { useSongbook, newId, Song } from "@/src/library";

const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B", "Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm"];

export default function SongbookScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, loaded, upsert, remove } = useSongbook();
  const [editing, setEditing] = useState<Song | null>(null);
  const [open, setOpen] = useState<Song | null>(null);

  const startNew = () => setEditing({ id: newId(), title: "", artist: "", key: "C", notes: "", created_at: new Date().toISOString() });

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.back} onPress={() => router.back()} testID="songbook-back" hitSlop={8}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>SONGBOOK</Text>
          <Text style={styles.subtitle}>CHORDS · KEYS · LYRICS · NOTES</Text>
        </View>
        <Pressable style={styles.back} onPress={startNew} testID="songbook-add" hitSlop={8}>
          <Plus size={22} color={colors.brandSecondary} weight="bold" />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24, flexGrow: 1 }}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.center}>
              <View style={[styles.iconCircle, glow(colors.brandTertiary, 22, 0.8)]}>
                <BookOpen size={40} color={colors.brandTertiary} weight="fill" />
              </View>
              <Text style={styles.empty}>Your songbook is empty.</Text>
              <Text style={styles.emptySub}>Add the songs you're learning — title, key, chords and lyrics — and build setlists from them.</Text>
              <NeonButton label="Add Your First Song" onPress={startNew} style={{ marginTop: 18 }} testID="songbook-add-first" />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => setOpen(item)} style={styles.row} testID={`song-row-${item.id}`}>
            <View style={styles.keyBadge}><Text style={styles.keyText}>{item.key}</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{item.artist || "—"}{item.bpm ? ` · ${item.bpm} BPM` : ""}</Text>
            </View>
            <Pressable onPress={() => setEditing(item)} hitSlop={8} testID={`song-edit-${item.id}`}><PencilSimple size={18} color={colors.muted} /></Pressable>
            <Pressable onPress={() => remove(item.id)} hitSlop={8} testID={`song-delete-${item.id}`}><Trash size={18} color={colors.error} /></Pressable>
          </Pressable>
        )}
      />

      <View style={{ paddingBottom: insets.bottom + 2 }}><GrooveWatermark /></View>

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        {editing && (
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{items.some((s) => s.id === editing.id) ? "Edit Song" : "New Song"}</Text>
              <TextInput value={editing.title} onChangeText={(t) => setEditing({ ...editing, title: t })} style={styles.input} placeholder="Song title" placeholderTextColor={colors.muted} autoFocus testID="song-title-input" />
              <TextInput value={editing.artist} onChangeText={(t) => setEditing({ ...editing, artist: t })} style={styles.input} placeholder="Artist (optional)" placeholderTextColor={colors.muted} testID="song-artist-input" />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput value={editing.bpm ? String(editing.bpm) : ""} onChangeText={(t) => setEditing({ ...editing, bpm: parseInt(t, 10) || undefined })} style={[styles.input, { flex: 1 }]} placeholder="BPM" keyboardType="number-pad" placeholderTextColor={colors.muted} testID="song-bpm-input" />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }}>
                {KEYS.map((k) => {
                  const on = k === editing.key;
                  return (
                    <Pressable key={k} onPress={() => setEditing({ ...editing, key: k })} style={[styles.chip, on && { backgroundColor: colors.brandSecondary, borderColor: colors.brandSecondary }]} testID={`song-key-${k}`}>
                      <Text style={[styles.chipText, { color: on ? colors.onBrandSecondary : colors.onSurfaceSecondary }]}>{k}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <TextInput value={editing.notes} onChangeText={(t) => setEditing({ ...editing, notes: t })} style={[styles.input, { height: 120, paddingTop: 12 }]} multiline placeholder="Chords, lyrics, notes…" placeholderTextColor={colors.muted} testID="song-notes-input" />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <Pressable style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setEditing(null)} testID="song-cancel"><Text style={styles.modalBtnText}>Cancel</Text></Pressable>
                <Pressable style={[styles.modalBtn, { backgroundColor: colors.brandSecondary, borderColor: colors.brandSecondary }, !editing.title.trim() && { opacity: 0.5 }]} disabled={!editing.title.trim()}
                  onPress={() => { upsert({ ...editing, title: editing.title.trim() }); setEditing(null); }} testID="song-save">
                  <Text style={[styles.modalBtnText, { color: colors.onBrandSecondary }]}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Modal>

      <Modal visible={!!open} transparent animationType="slide" onRequestClose={() => setOpen(null)}>
        {open && (
          <View style={styles.modalWrap}>
            <View style={[styles.modalCard, { maxHeight: "80%" }]}>
              <Text style={styles.modalTitle}>{open.title}</Text>
              <Text style={styles.rowSub}>{open.artist || "—"} · Key of {open.key}{open.bpm ? ` · ${open.bpm} BPM` : ""}</Text>
              <ScrollView style={{ marginTop: 12 }}><Text style={styles.notes} testID="song-notes-view">{open.notes || "No chords or lyrics yet — tap the pencil to add them."}</Text></ScrollView>
              <Pressable style={[styles.modalBtn, { borderColor: colors.border, marginTop: 14 }]} onPress={() => setOpen(null)} testID="song-close"><Text style={styles.modalBtnText}>Close</Text></Pressable>
            </View>
          </View>
        )}
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
  iconCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.7)", marginBottom: 16 },
  empty: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface, textAlign: "center" },
  emptySub: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 6, maxWidth: 300 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, marginBottom: 10, backgroundColor: "rgba(7,26,43,0.7)", borderWidth: 1, borderColor: colors.divider },
  keyBadge: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.brandSecondary, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,8,16,0.6)" },
  keyText: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.brandSecondary },
  rowTitle: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.onSurface },
  rowSub: { fontFamily: fonts.text, fontSize: 11, color: colors.muted, marginTop: 2 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,24,42,0.6)" },
  chipText: { fontFamily: fonts.displayBold, fontSize: 12 },
  notes: { fontFamily: fonts.text, fontSize: 15, color: colors.onSurface, lineHeight: 24 },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 22 },
  modalCard: { width: "100%", backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 10 },
  modalTitle: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.onSurface },
  input: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 48, color: colors.onSurface, fontFamily: fonts.text, fontSize: 15 },
  modalBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.onSurface },
}));
