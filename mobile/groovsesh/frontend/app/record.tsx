import React from "react";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Microphone } from "phosphor-react-native";
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
  return (
    <ToolScreen
      title="RECORD SOMETHING"
      subtitle="Capture the moment. Start a fresh session and lay down your first take."
      Icon={Microphone}
      testID="record-screen"
      cta={{ label: "Start New Session", onPress: () => create.mutate(), loading: create.isPending }}
    />
  );
}
