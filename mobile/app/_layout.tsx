import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/lib/authContext";
import { BRAND } from "@/lib/config";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: BRAND.bg },
            headerTintColor: BRAND.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: BRAND.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Loadit" }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="buy" options={{ title: "Buy" }} />
          <Stack.Screen name="receive" options={{ title: "Cash QR" }} />
          <Stack.Screen name="register" options={{ title: "Cash at any register" }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
