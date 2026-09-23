import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { X, Crown, Check, InfinityIcon, WaveTriangle, ShareNetwork, Faders } from "phosphor-react-native";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GalaxyBackground, NeonButton, GrooveWatermark } from "@/src/components/ui";
import { useSubscription } from "@/lib/revenuecat";
import { useToast } from "@/src/components/toast";

const REASON_COPY: Record<string, string> = {
  tracks: "You've hit the free 4-track limit",
  effects: "Trim, cut & full effects are a Pro feature",
  wav: "Lossless WAV export is a Pro feature",
  stems: "Stem hand-off to GroovTracks is Pro",
  settings: "Unlock the full GroovSesh studio",
};

const FEATURES = [
  { icon: InfinityIcon, text: "Unlimited multitrack layers" },
  { icon: Faders, text: "Trim, cut & full EQ / Reverb effects" },
  { icon: WaveTriangle, text: "Lossless WAV export" },
  { icon: ShareNetwork, text: "Send stems to GroovTracks" },
];

export default function Paywall() {
  const { reason } = useLocalSearchParams<{ reason: string }>();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { offerings, isSubscribed, purchase, isPurchasing, restore, identityReady, rcEnabled } = useSubscription();

  const [confirm, setConfirm] = useState<PurchasesPackage | null>(null);

  const packages = offerings?.current?.availablePackages || [];

  React.useEffect(() => {
    if (isSubscribed) {
      toast.show("You're Pro! Everything unlocked", "success");
      router.back();
    }
  }, [isSubscribed]);

  const doPurchase = async (pkg: PurchasesPackage) => {
    setConfirm(null);
    try {
      await purchase(pkg);
      toast.show("Welcome to Pro!", "success");
    } catch (e: any) {
      if (e?.userCancelled || String(e?.message).includes("cancel")) return;
      if (String(e?.message).includes("identity_not_ready")) {
        toast.show("Account not ready, try again", "error");
        return;
      }
      toast.show("Purchase could not complete", "error");
    }
  };

  const pkgLabel = (p: PurchasesPackage) => {
    const t = p.packageType;
    if (t === "ANNUAL") return "Yearly";
    if (t === "MONTHLY") return "Monthly";
    return p.identifier;
  };

  return (
    <GalaxyBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ width: 40 }} />
        <View style={styles.crownWrap}><Crown size={22} color={colors.warning} weight="fill" /></View>
        <Pressable onPress={() => router.back()} testID="paywall-close" hitSlop={12} style={styles.iconBtn}>
          <X size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>GroovSesh Pro</Text>
        <Text style={styles.reason}>{REASON_COPY[reason || "settings"] || REASON_COPY.settings}</Text>

        <View style={styles.featureCard}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <View key={f.text} style={styles.featureRow}>
                <View style={styles.featureIcon}><Icon size={20} color={colors.brandSecondary} weight="fill" /></View>
                <Text style={styles.featureText}>{f.text}</Text>
                <Check size={18} color={colors.success} weight="bold" />
              </View>
            );
          })}
        </View>

        {!rcEnabled || packages.length === 0 ? (
          <Text style={styles.unavailable}>Subscription options are unavailable right now. Please try again later.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {packages.map((p) => (
              <Pressable key={p.identifier} onPress={() => setConfirm(p)} disabled={isPurchasing} testID={`plan-${p.packageType}`} style={styles.planBtn}>
                <View>
                  <Text style={styles.planLabel}>{pkgLabel(p)}</Text>
                  <Text style={styles.planPeriod}>{p.product.title || "GroovSesh Pro"}</Text>
                </View>
                <Text style={styles.planPrice}>{p.product.priceString}</Text>
              </Pressable>
            ))}
            {isPurchasing && <ActivityIndicator color={colors.brandPrimary} />}
          </View>
        )}

        <Pressable onPress={async () => { try { await restore(); toast.show("Purchases restored", "success"); } catch { toast.show("Nothing to restore", "info"); } }} testID="paywall-restore">
          <Text style={styles.restore}>Restore Purchases</Text>
        </Pressable>

        <GrooveWatermark />
      </ScrollView>

      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm subscription</Text>
            <Text style={styles.modalText}>
              Subscribe to GroovSesh Pro ({confirm ? pkgLabel(confirm) : ""}) for {confirm?.product.priceString}?
            </Text>
            <Text style={styles.modalNote}>Test Store purchase in preview — no real charge.</Text>
            <View style={styles.modalBtns}>
              <Pressable onPress={() => setConfirm(null)} style={[styles.modalBtn, { backgroundColor: colors.surfaceTertiary }]} testID="confirm-cancel">
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => confirm && doPurchase(confirm)} style={[styles.modalBtn, { backgroundColor: colors.brandPrimary }]} testID="confirm-buy">
                <Text style={[styles.modalBtnText, { color: colors.onBrandPrimary }]}>Subscribe</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary },
  crownWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(245,158,11,0.15)", alignItems: "center", justifyContent: "center" },
  headline: { fontFamily: fonts.displayBold, fontSize: 34, color: colors.onSurface, textAlign: "center", letterSpacing: 1 },
  reason: { fontFamily: fonts.text, fontSize: 15, color: colors.brandPrimary, textAlign: "center", marginTop: -6 },
  featureCard: { backgroundColor: "rgba(26,26,36,0.85)", borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(6,182,212,0.12)", alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontFamily: fonts.text, fontSize: 14, color: colors.onSurface },
  planBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1.5, borderColor: colors.brandPrimary, padding: 16 },
  planLabel: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.onSurface },
  planPeriod: { fontFamily: fonts.text, fontSize: 12, color: colors.muted, marginTop: 2 },
  planPrice: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.brandSecondary },
  unavailable: { fontFamily: fonts.text, fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 20 },
  restore: { fontFamily: fonts.textMedium, fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 10 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 400, backgroundColor: colors.surfaceSecondary, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 8 },
  modalTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface },
  modalText: { fontFamily: fonts.text, fontSize: 14, color: colors.onSurfaceSecondary },
  modalNote: { fontFamily: fonts.text, fontSize: 12, color: colors.muted, fontStyle: "italic" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.onSurface, letterSpacing: 0.5 },
}));
