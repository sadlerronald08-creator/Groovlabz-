import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { GoogleLogo, EnvelopeSimple, LockKey, User as UserIcon } from "phosphor-react-native";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { GalaxyBackground, InfinityLogo, NeonButton, GrooveWatermark } from "@/src/components/ui";
import { useAuth } from "@/src/auth";
import { useToast } from "@/src/components/toast";

export default function Login() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password || (mode === "signup" && !name)) {
      toast.show("Please fill in all fields", "error");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") await signInEmail(email.trim(), password);
      else await signUpEmail(name.trim(), email.trim(), password);
    } catch (e: any) {
      toast.show(e?.message || "Authentication failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      await signInGoogle();
    } catch (e: any) {
      toast.show(e?.message || "Google sign-in failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GalaxyBackground>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <InfinityLogo size={44} />
        <Text style={styles.tagline}>MULTITRACK RECORDING STUDIO</Text>

        <View style={styles.card}>
          <Text style={styles.title}>{mode === "signin" ? "Welcome back" : "Create account"}</Text>
          <Text style={styles.subtitle}>Your universal GroovLabz account</Text>

          {mode === "signup" && (
            <View style={styles.inputWrap}>
              <UserIcon size={18} color={colors.muted} />
              <TextInput
                testID="name-input"
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}
          <View style={styles.inputWrap}>
            <EnvelopeSimple size={18} color={colors.muted} />
            <TextInput
              testID="email-input"
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputWrap}>
            <LockKey size={18} color={colors.muted} />
            <TextInput
              testID="password-input"
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <NeonButton
            label={mode === "signin" ? "Sign In" : "Sign Up"}
            onPress={submit}
            loading={busy}
            testID="auth-submit-button"
            style={{ marginTop: 8 }}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <Pressable onPress={google} disabled={busy} style={styles.googleBtn} testID="google-signin-button">
            <GoogleLogo size={20} color={colors.onSurface} weight="bold" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          testID="toggle-auth-mode"
          style={{ paddingVertical: 12 }}
        >
          <Text style={styles.switchText}>
            {mode === "signin" ? "New to GroovLabz? " : "Already have an account? "}
            <Text style={styles.switchLink}>{mode === "signin" ? "Create account" : "Sign in"}</Text>
          </Text>
        </Pressable>

        <GrooveWatermark />
      </KeyboardAwareScrollView>
    </GalaxyBackground>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center", gap: 8 },
  tagline: { fontFamily: fonts.text, fontSize: 11, color: colors.muted, letterSpacing: 3, marginTop: 4, marginBottom: 24 },
  card: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "rgba(26,26,36,0.82)",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.onSurface },
  subtitle: { fontFamily: fonts.text, fontSize: 13, color: colors.muted, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.onSurface, fontFamily: fonts.text, fontSize: 15 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.divider },
  orText: { color: colors.muted, fontFamily: fonts.text, fontSize: 12 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  googleText: { color: colors.onSurface, fontFamily: fonts.textMedium, fontSize: 15 },
  switchText: { color: colors.muted, fontFamily: fonts.text, fontSize: 14 },
  switchLink: { color: colors.brandSecondary, fontFamily: fonts.textMedium },
}));
