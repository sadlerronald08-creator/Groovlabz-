import React from "react";
import { useRouter } from "expo-router";
import { SlidersHorizontal } from "phosphor-react-native";
import { ToolScreen } from "@/src/components/tool-screen";

export default function MixerScreen() {
  const router = useRouter();
  return (
    <ToolScreen
      title="MIXER / STUDIO"
      subtitle="Tone & effects. Open a session to balance levels, mute/solo lanes and dial in EQ, reverb and gain."
      Icon={SlidersHorizontal}
      testID="mixer-screen"
      cta={{ label: "Open a Session", onPress: () => router.push("/sessions") }}
    />
  );
}
