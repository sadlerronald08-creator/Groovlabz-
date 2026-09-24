import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, glow } from "@/src/theme";
import { GalaxyBackground, GrooveWatermark, NeonButton } from "@/src/components/ui";

export function ToolScreen({
  title,
  subtitle,
  Icon,
  accent,
  cta,
  children,
  testID,
}: {
  title: string;
  subtitle: string;
  Icon: any;
  accent?: string;
  cta?: { label: string; onPress: () => void; loading?: boolean };
  children?: React.ReactNode;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = accent ?? colors.brandSecondary;
  return (
    <GalaxyBackground>
      <View style={{ flex: 1, paddingTop: insets.top + 8 }} testID={testID}>
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()} testID="tool-back" hitSlop={8}>
            <CaretLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={[styles.iconCircle, { borderColor: c }, glow(c, 22, 0.8)]}>
            <Icon size={44} color={c} weight="fill" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
          {cta && (
            <NeonButton label={cta.label} onPress={cta.onPress} loading={cta.loading} style={{ marginTop: 20, minWidth: 240 }} testID="tool-cta" />
          )}
        </ScrollView>
        <View style={{ paddingBottom: insets.bottom + 4 }}>
          <GrooveWatermark />
        </View>
      </View>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 48 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: fonts.displayBold, fontSize: 16, color: colors.onSurface, letterSpacing: 1 },
  body: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 6 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", borderWidth: 2, backgroundColor: "rgba(6,24,42,0.7)", marginBottom: 14 },
  title: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.onSurface, letterSpacing: 1, textAlign: "center" },
  subtitle: { fontFamily: fonts.text, fontSize: 14, color: colors.onSurfaceSecondary, textAlign: "center", maxWidth: 300, marginTop: 4 },
}));
