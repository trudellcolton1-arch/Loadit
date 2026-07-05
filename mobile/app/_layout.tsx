import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/lib/authContext";
import { ThemeProvider, useTheme } from "@/lib/theme";

function ThemedStack() {
  const { theme } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={theme.mode === "light" ? "dark" : "light"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Loadit" }} />
        <Stack.Screen name="load" options={{ headerShown: false }} />
        <Stack.Screen name="hq" options={{ title: "HQ — your AI" }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="buy" options={{ title: "Buy" }} />
        <Stack.Screen name="quote" options={{ title: "Live quote" }} />
        <Stack.Screen name="moneygram" options={{ title: "Cash → crypto" }} />
        <Stack.Screen name="register" options={{ title: "Cash at any register" }} />
        <Stack.Screen name="appearance" options={{ title: "Appearance" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
