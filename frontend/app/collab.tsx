import React from "react";
import { Share } from "react-native";
import { UsersThree } from "phosphor-react-native";
import { ToolScreen } from "@/src/components/tool-screen";
import { useTheme } from "@/src/theme";
import { useToast } from "@/src/components/toast";

export default function CollabScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const invite = async () => {
    try {
      await Share.share({ message: "Jam with me on GroovSesh — part of the GroovLabz suite. 🎸∞" });
    } catch {
      toast.show("Could not open share", "error");
    }
  };
  return (
    <ToolScreen
      title="COLLAB"
      subtitle="Share & play together. Invite a bandmate to jam on your session."
      Icon={UsersThree}
      accent={colors.success}
      testID="collab-screen"
      cta={{ label: "Invite a Bandmate", onPress: invite }}
    />
  );
}
