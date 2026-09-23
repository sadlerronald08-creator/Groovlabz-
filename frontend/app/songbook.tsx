import React from "react";
import { BookOpen } from "phosphor-react-native";
import { ToolScreen } from "@/src/components/tool-screen";
import { useTheme } from "@/src/theme";

export default function SongbookScreen() {
  const { colors } = useTheme();
  return (
    <ToolScreen
      title="SONGBOOK"
      subtitle="Chords, tabs and lyrics for your set — keep every song you're learning in one place. Coming soon."
      Icon={BookOpen}
      accent={colors.brandTertiary}
      testID="songbook-screen"
    />
  );
}
