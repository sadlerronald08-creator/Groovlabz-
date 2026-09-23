import "react-native-gesture-handler";
import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator, LogBox } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Purchases from "react-native-purchases";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AuthProvider, useAuth } from "@/src/auth";
import { ToastProvider } from "@/src/components/toast";
import { GalaxyBackground, InfinityLogo } from "@/src/components/ui";
import { initializeRevenueCat, SubscriptionProvider, rcEnabled } from "@/lib/revenuecat";
import { fontMap } from "@/src/fonts";
import { useTheme } from "@/src/theme";

LogBox.ignoreAllLogs(true);

try {
  initializeRevenueCat();
} catch (err) {
  console.warn("RevenueCat unavailable:", err);
}

function Splash() {
  const { colors } = useTheme();
  return (
    <GalaxyBackground>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 28 }}>
        <InfinityLogo size={48} />
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    </GalaxyBackground>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rcIdentityRef = useRef<string | null>(null);

  useEffect(() => {
    if (!rcEnabled) return;
    (async () => {
      try {
        if (user?.id && rcIdentityRef.current !== user.id) {
          await Purchases.logIn(user.id);
          rcIdentityRef.current = user.id;
        } else if (!user?.id && rcIdentityRef.current) {
          await Purchases.logOut();
          rcIdentityRef.current = null;
        }
      } catch (e) {
        console.warn("[RevenueCat] identity error:", e);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "login";
    if (!user && !inAuth) router.replace("/login");
    else if (user && inAuth) router.replace("/");
  }, [user, loading, segments]);

  if (loading) return <Splash />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D12" }, animation: "fade" }}>
      <Stack.Screen name="jam" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
      <Stack.Screen name="clip/[id]" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap); // local bundled fonts — load fast & reliably

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <BottomSheetModalProvider>
                <AuthProvider>
                  <SubscriptionProvider>
                    <ToastProvider>
                      <StatusBar style="light" />
                      {fontsLoaded ? <AuthGate /> : <Splash />}
                    </ToastProvider>
                  </SubscriptionProvider>
                </AuthProvider>
              </BottomSheetModalProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
