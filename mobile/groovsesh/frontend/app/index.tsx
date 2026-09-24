import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  Play,
  Microphone,
  MusicNotes,
  Sparkle,
  SlidersHorizontal,
  Stack,
  UsersThree,
  Gear,
  House,
  Waveform as WaveIcon,
  Metronome,
  Repeat,
  BookOpen,
  ListNumbers,
  CaretRight,
  Lightning,
} from "phosphor-react-native";
import { makeStyles, useTheme, fonts, glow } from "@/src/theme";
import { GalaxyBackground, InfinityLogo } from "@/src/components/ui";

const GUITAR = require("../assets/images/flying-v.png");

export default function Home() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const nodes = [
    { key: "jam", label: "JAM NOW", sub: "OPEN TUNER & METRONOME", icon: Play, color: colors.brandPrimary, route: "/jam", primary: true, testID: "jam-now-button" },
    { key: "record", label: "RECORD SOMETHING", sub: "CAPTURE THE MOMENT", icon: Microphone, color: colors.brandSecondary, route: "/record", testID: "node-record" },
    { key: "review", label: "REVIEW TAKES", sub: "LISTEN & MANAGE", icon: MusicNotes, color: colors.info, route: "/sessions", testID: "node-review" },
    { key: "neural", label: "NEURAL CLEAN", sub: "REDUCE NOISE & WIND", icon: Sparkle, color: colors.brandTertiary, route: "/neural", testID: "node-neural" },
    { key: "mixer", label: "MIXER / STUDIO", sub: "TONE & EFFECTS", icon: SlidersHorizontal, color: colors.brandSecondary, route: "/mixer", testID: "node-mixer" },
    { key: "reel", label: "SESSION REEL", sub: "BUILD & ARRANGE", icon: Stack, color: colors.info, route: "/reel", testID: "node-reel" },
    { key: "collab", label: "COLLAB", sub: "SHARE & PLAY TOGETHER", icon: UsersThree, color: colors.success, route: "/collab", testID: "node-collab" },
  ];

  const tabs = [
    { key: "home", label: "HOME", icon: House, route: "/", active: true },
    { key: "tuner", label: "TUNER", icon: WaveIcon, route: "/tuner" },
    { key: "metronome", label: "METRO", icon: Metronome, route: "/metronome" },
    { key: "looper", label: "LOOPER", icon: Repeat, route: "/looper" },
    { key: "songbook", label: "SONGS", icon: BookOpen, route: "/songbook" },
    { key: "setlists", label: "SETS", icon: ListNumbers, route: "/setlists" },
  ];

  return (
    <GalaxyBackground>
      <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.presents}>GROOVLABZ PRESENTS</Text>
            <InfinityLogo height={40} />
            <Text style={styles.tagline}>CAPTURE · CREATE · PLAY · REPEAT</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 10 }}>
            <Pressable style={styles.gear} onPress={() => router.push("/settings")} testID="home-settings" hitSlop={8}>
              <Gear size={22} color={colors.onSurfaceSecondary} weight="fill" />
            </Pressable>
            <Pressable style={styles.quickJams} onPress={() => router.push("/sessions")} testID="home-quickjams" hitSlop={8}>
              <Lightning size={14} color={colors.onBrandSecondary} weight="fill" />
              <Text style={styles.quickJamsText}>QUICK JAMS</Text>
            </Pressable>
          </View>
        </View>

        {/* Hero + node menu */}
        <View style={styles.stage}>
          <Image source={GUITAR} style={styles.guitar} contentFit="contain" />
          <View style={styles.nodes}>
            {nodes.map((n) => {
              const Icon = n.icon;
              return (
                <Pressable
                  key={n.key}
                  testID={n.testID}
                  onPress={() => router.push(n.route as any)}
                  style={({ pressed }) => [styles.nodeRow, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                >
                  <View
                    style={[
                      styles.nodeCircle,
                      { borderColor: n.color, backgroundColor: n.primary ? n.color : "rgba(6,24,42,0.9)" },
                      glow(n.color, n.primary ? 16 : 10, n.primary ? 0.9 : 0.6),
                    ]}
                  >
                    <Icon size={n.primary ? 24 : 20} color={n.primary ? colors.onBrandPrimary : n.color} weight="fill" />
                  </View>
                  <View style={styles.nodeText}>
                    <Text style={[styles.nodeLabel, n.primary && { color: colors.onSurface, fontSize: 17 }]} numberOfLines={1}>
                      {n.label}
                    </Text>
                    <Text style={styles.nodeSub} numberOfLines={1}>
                      {n.sub}
                    </Text>
                  </View>
                  <CaretRight size={16} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Bottom tab bar */}
        <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = !!t.active;
            return (
              <Pressable
                key={t.key}
                testID={`tab-${t.key}`}
                style={styles.tab}
                onPress={() => (t.active ? null : router.push(t.route as any))}
                hitSlop={6}
              >
                <Icon size={22} color={active ? colors.brandSecondary : colors.muted} weight={active ? "fill" : "regular"} />
                <Text style={[styles.tabLabel, { color: active ? colors.brandSecondary : colors.muted }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", paddingHorizontal: 20, alignItems: "flex-start", gap: 12 },
  presents: { fontFamily: fonts.textMedium, fontSize: 10, color: colors.onSurfaceSecondary, letterSpacing: 3, marginBottom: 2 },
  tagline: { fontFamily: fonts.text, fontSize: 10, color: colors.muted, letterSpacing: 2, marginTop: 4 },
  gear: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(6,24,42,0.7)" },
  quickJams: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brandSecondary,
    ...(glow(colors.brandSecondary, 10, 0.6) as any),
  },
  quickJamsText: { fontFamily: fonts.displayBold, fontSize: 11, color: colors.onBrandSecondary, letterSpacing: 1 },

  stage: { flex: 1, position: "relative", justifyContent: "center" },
  guitar: { position: "absolute", left: 2, top: 4, bottom: 4, width: 168, height: "94%", alignSelf: "center" },
  nodes: { marginLeft: 168, marginRight: 16, gap: 10 },
  nodeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  nodeCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  nodeText: { flex: 1 },
  nodeLabel: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.onSurface, letterSpacing: 0.5 },
  nodeSub: { fontFamily: fonts.text, fontSize: 10, color: colors.muted, letterSpacing: 1, marginTop: 2 },

  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: "rgba(2,8,16,0.85)",
  },
  tab: { alignItems: "center", gap: 3, minWidth: 44 },
  tabLabel: { fontFamily: fonts.displayBold, fontSize: 9, letterSpacing: 1 },
}));
