import React from "react";
import { useRouter } from "expo-router";
import { Sparkle } from "phosphor-react-native";
import { ToolScreen } from "@/src/components/tool-screen";
import { useTheme } from "@/src/theme";

export default function NeuralScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <ToolScreen
      title="NEURAL CLEAN"
      subtitle="Reduce noise, hum and wind from a take. Neural Clean runs on export to GroovMash — pick a take to clean and export."
      Icon={Sparkle}
      accent={colors.brandTertiary}
      testID="neural-screen"
      cta={{ label: "Choose a Take", onPress: () => router.push("/sessions") }}
    />
  );
}
