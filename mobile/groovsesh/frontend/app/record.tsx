import React from "react";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Microphone, Pulse } from "phosphor-react-native";
import { Pressable, Text } from "react-native";
import { useTheme, fonts } from "@/src/theme";
import { ToolScreen } from "@/src/components/tool-screen";
import { apiFetch } from "@/src/api";
import { useToast } from "@/src/components/toast";

export default function RecordScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const create = useMutation({
    mutationFn: () =>
      apiFetch<any>("/sessions", {
        method: "POST",
        body: JSON.stringify({ title: `Take ${new Date().toLocaleDateString()}`, bpm: 100, count_in: true }),
      }),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      router.replace(`/session/${s.id}`);
    },
    onError: (e: any) => toast.show(e?.message || "Could not start", "error"),
  });
  const { colors } = useTheme();
  return (
    <ToolScreen
      title="RECORD SOMETHING"
      subtitle="Capture the moment. Start a fresh session and lay down your first take."
      Icon={Microphone}
      testID="record-screen"
      cta={{ label: "Start New Session", onPress: () => create.mutate(), loading: create.isPending }}
    >
      <Pressable onPress={() => router.push("/hum")} testID="record-hum-link" style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18 }}>
        <Pulse size={18} color={colors.brandSecondary} weight="fill" />
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 13, color: colors.brandSecondary, letterSpacing: 1 }}>OR HUM A GROOVE → DRUM TRACK</Text>
      </Pressable>
    </ToolScreen>
  );
}
