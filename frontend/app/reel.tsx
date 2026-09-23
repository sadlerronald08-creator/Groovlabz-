import React from "react";
import { useRouter } from "expo-router";
import { Stack } from "phosphor-react-native";
import { ToolScreen } from "@/src/components/tool-screen";
import { useTheme } from "@/src/theme";

export default function ReelScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <ToolScreen
      title="SESSION REEL"
      subtitle="Build & arrange. Stack your takes into layers and shape a full multitrack session."
      Icon={Stack}
      accent={colors.info}
      testID="reel-screen"
      cta={{ label: "Build From Takes", onPress: () => router.push("/sessions") }}
    />
  );
}
