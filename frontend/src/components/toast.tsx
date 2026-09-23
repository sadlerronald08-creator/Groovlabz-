import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import { View, Text, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, useTheme, fonts } from "@/src/theme";

type ToastType = "success" | "error" | "info";
type ToastCtx = { show: (msg: string, type?: ToastType) => void };

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<string>("");
  const [type, setType] = useState<ToastType>("info");
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (m: string, t: ToastType = "info") => {
      setMsg(m);
      setType(t);
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== "web" }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: Platform.OS !== "web" }).start();
      }, 2600);
    },
    [opacity],
  );

  const barColor = type === "success" ? colors.success : type === "error" ? colors.error : colors.brandSecondary;

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[styles.wrap, { opacity, top: insets.top + 12 }]}
        testID="app-toast"
      >
        <View style={[styles.toast, { borderLeftColor: barColor }]}>
          <Text style={styles.text}>{msg}</Text>
        </View>
      </Animated.View>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) return { show: () => {} };
  return ctx;
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    backgroundColor: colors.surfaceTertiary,
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: 460,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { color: colors.onSurface, fontFamily: fonts.text, fontSize: 14 },
}));
