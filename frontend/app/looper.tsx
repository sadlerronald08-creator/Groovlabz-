import React from "react";
import { Repeat } from "phosphor-react-native";
import { ToolScreen } from "@/src/components/tool-screen";

export default function LooperScreen() {
  return (
    <ToolScreen
      title="LOOPER"
      subtitle="Layer loops on the fly. Capture a phrase and stack overdubs in time — coming soon to your rig."
      Icon={Repeat}
      testID="looper-screen"
    />
  );
}
