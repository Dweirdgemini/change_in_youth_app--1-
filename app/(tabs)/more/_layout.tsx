import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function MoreStackLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerBackTitle: "Back",
      }}
    >
      {/* Main More screen - no header */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      {/* Nested screens with headers */}
      <Stack.Screen
        name="performance-metrics"
        options={{
          title: "Performance Metrics",
          headerBackTitle: "More",
        }}
      />

      <Stack.Screen
        name="performance-leaderboard"
        options={{
          title: "Performance Leaderboard",
          headerBackTitle: "More",
        }}
      />

      <Stack.Screen
        name="super-admin-dashboard"
        options={{
          title: "Admin Dashboard",
          headerBackTitle: "More",
        }}
      />

      <Stack.Screen
        name="role-permissions-guide"
        options={{
          title: "Role Permissions",
          headerBackTitle: "More",
        }}
      />
    </Stack>
  );
}
