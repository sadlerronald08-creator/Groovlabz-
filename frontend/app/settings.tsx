import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CaretLeft, Crown, ArrowClockwise, SignOut, User as UserIcon, ShieldCheck, CircleNotch } from "phosphor-react-native";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GrooveWatermark, NeonButton, GalaxyBackground } from "@/src/components/ui";
import { useAuth } from "@/src/auth";
import { useSubscription } from "@/lib/revenuecat";
import { useToast } from "@/src/components/toast";

export default function Settings() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isSubscribed, restore, isRestoring, rcEnabled } = useSubscription();
  const toast = useToast();

  const doRestore = async () => {
    try {
      await restore();
      toast.show("Purchases restored", "success");
    } catch {
      toast.show("Nothing to restore", "info");
    }
  };

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} testID="settings-back" hitSlop={10} style={styles.iconBtn}>
          <CaretLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.profile}>
          <View style={styles.avatar}><UserIcon size={30} color={colors.onBrandSecondary} weight="fill" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <View style={[styles.planCard, isSubscribed && { borderColor: colors.brandPrimary }]}>
          <View style={styles.planTop}>
            <Crown size={26} color={isSubscribed ? colors.warning : colors.muted} weight="fill" />
            <Text style={styles.planTitle}>{isSubscribed ? "GroovSesh Pro" : "Free Plan"}</Text>
          </View>
          <Text style={styles.planDesc}>
            {isSubscribed
              ? "Unlimited tracks, full effects, lossless WAV export and stem hand-off are unlocked."
              : "Up to 4 tracks, compressed export and basic gain. Upgrade for the full studio."}
          </Text>
          {!isSubscribed && (
            <NeonButton label="Upgrade to Pro" onPress={() => router.push("/paywall?reason=settings")} testID="settings-upgrade" icon={<Crown size={18} color={colors.onBrandPrimary} weight="fill" />} style={{ marginTop: 12 }} />
          )}
        </View>

        <Pressable onPress={doRestore} disabled={isRestoring || !rcEnabled} style={styles.row} testID="restore-purchases">
          {isRestoring ? <CircleNotch size={22} color={colors.onSurface} /> : <ArrowClockwise size={22} color={colors.onSurface} />}
          <Text style={styles.rowText}>Restore Purchases</Text>
        </Pressable>

        <View style={styles.row}>
          <ShieldCheck size={22} color={colors.onSurface} />
          <Text style={styles.rowText}>Privacy & Data</Text>
        </View>

        <Pressable onPress={signOut} style={[styles.row, { borderColor: colors.error }]} testID="sign-out">
          <SignOut size={22} color={colors.error} />
          <Text style={[styles.rowText, { color: colors.error }]}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>GroovSesh v1.0.0</Text>
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 4 }}>
        <GrooveWatermark />
      </View>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, letterSpacing: 1 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface },
  email: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, marginTop: 2 },
  planCard: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, padding: 16 },
  planTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  planTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface, letterSpacing: 0.5 },
  planDesc: { fontFamily: fonts.text, fontSize: 13, color: colors.onSurfaceSecondary, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surfaceSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16 },
  rowText: { fontFamily: fonts.textMedium, fontSize: 15, color: colors.onSurface },
  version: { fontFamily: fonts.display, fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 8 },
}));
