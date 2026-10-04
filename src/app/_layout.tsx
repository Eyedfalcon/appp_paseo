import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Providers } from "../state/AppState";
import { C } from "../lib/theme";
export default function Root() {
  return (
    <SafeAreaProvider>
      <Providers>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.ivory },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ presentation: "modal" }} />
          <Stack.Screen name="scan" options={{ presentation: "modal" }} />
        </Stack>
      </Providers>
    </SafeAreaProvider>
  );
}
