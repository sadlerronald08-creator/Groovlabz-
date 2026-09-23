import React from "react";
import { ListNumbers } from "phosphor-react-native";
import { ToolScreen } from "@/src/components/tool-screen";
import { useTheme } from "@/src/theme";

export default function SetlistsScreen() {
  const { colors } = useTheme();
  return (
    <ToolScreen
      title="SETLISTS"
      subtitle="Arrange songs into a gig-ready setlist and run it start to finish. Coming soon."
      Icon={ListNumbers}
      accent={colors.info}
      testID="setlists-screen"
    />
  );
}
