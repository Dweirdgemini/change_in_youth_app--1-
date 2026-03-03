import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useBranding } from "@/lib/branding-provider";
import { useAuth } from "@/hooks/use-auth";
import { canAccessFinancials, canAccessProjects, canAccessSocialMedia } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";

export default function TabLayout() {
  const colors = useColors();
  const { primaryColor } = useBranding();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 16 : Math.max(insets.bottom, 12);
  const tabBarHeight = 70 + bottomPadding;

  const userRole = (user?.role as UserRole) || "student";

  // Determine which tabs to show based on role
  const showFinance = canAccessFinancials(userRole);
  const showProjects = canAccessProjects(userRole);
  const showSocialMedia = canAccessSocialMedia(userRole);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 12,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          href: showProjects ? undefined : null, // Hide for finance-only users
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          href: showProjects ? undefined : null, // Hide for finance-only users
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checkmark.circle.fill" color={color} />,
          href: showProjects ? undefined : null, // Hide for finance-only users
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dollarsign.circle.fill" color={color} />,
          href: showFinance ? undefined : null, // Hide for non-finance users (admin, etc.)
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="ellipsis.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
