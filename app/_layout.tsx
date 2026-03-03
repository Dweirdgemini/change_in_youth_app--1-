import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { BrandingProvider } from "@/lib/branding-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <BrandingProvider>
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="oauth/callback" />
            {/* Modal screens with headers - hide custom back buttons */}
            <Stack.Screen
              name="create-task"
              options={{
                headerShown: true,
                title: "Create Task",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="create-session"
              options={{
                headerShown: true,
                title: "Create Session",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="create-video-meeting"
              options={{
                headerShown: true,
                title: "Create Meeting",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="consent-forms-list"
              options={{
                headerShown: true,
                title: "Consent Forms",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="evaluation-forms"
              options={{
                headerShown: true,
                title: "Evaluation Forms",
                headerBackTitle: "Back",
              }}
            />
            {/* Detail screens with headers */}
            <Stack.Screen
              name="jobs/[id]"
              options={{
                headerShown: true,
                title: "Job Details",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="schedule/[id]"
              options={{
                headerShown: true,
                title: "Schedule Details",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="messages/[userId]"
              options={{
                headerShown: true,
                title: "Messages",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="team/[userId]"
              options={{
                headerShown: true,
                title: "Team Member",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="user/[id]"
              options={{
                headerShown: true,
                title: "User Profile",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="meeting-requests/[id]"
              options={{
                headerShown: true,
                title: "Meeting Request",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="project-chats/[chatId]"
              options={{
                headerShown: true,
                title: "Project Chat",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="team-chat/[id]"
              options={{
                headerShown: true,
                title: "Team Chat",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="finance/invoice/[id]"
              options={{
                headerShown: true,
                title: "Invoice",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="consent/[projectId]"
              options={{
                headerShown: true,
                title: "Consent",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="deliverables/[sessionId]"
              options={{
                headerShown: true,
                title: "Deliverables",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="development/[userId]"
              options={{
                headerShown: true,
                title: "Development",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="feedback/submit/[sessionId]"
              options={{
                headerShown: true,
                title: "Submit Feedback",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="register-ocr/[sessionId]"
              options={{
                headerShown: true,
                title: "Register",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="super-admin/organizations/[id]"
              options={{
                headerShown: true,
                title: "Organization",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="video-call/[sessionId]"
              options={{
                headerShown: true,
                title: "Video Call",
                headerBackTitle: "Back",
              }}
            />
          </Stack>
          <StatusBar style="auto" />
          </BrandingProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
