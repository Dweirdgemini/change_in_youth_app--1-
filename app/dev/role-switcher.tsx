import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/contexts/auth-context";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { setItem, removeItem } from '@/lib/storage';

const ROLES = [
  { id: "admin", label: "Admin", icon: "shield-checkmark", description: "Full system access" },
  { id: "finance", label: "Finance", icon: "cash", description: "Financial management" },
  { id: "team_member", label: "Team Member", icon: "people", description: "Session delivery" },
  { id: "student", label: "Student", icon: "school", description: "Participant access" },
];

export default function RoleSwitcherScreen() {
  const colors = useColors();
  const { user, loading } = useAuthContext();
  const [switching, setSwitching] = useState(false);

  const handleRoleSwitch = async (roleId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Switch to ${roleId} role for testing?`);
      if (!confirmed) return;
      
      setSwitching(true);
      try {
        // Use platform-safe storage
        await setItem("test_role", roleId);
        window.alert(`Role switched to ${roleId}! The page will reload.`);
        setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        console.error('Role switch error:', error);
        window.alert("Failed to switch role: " + error);
      } finally {
        setSwitching(false);
      }
    } else {
      Alert.alert(
        "Switch Role",
        `Switch to ${roleId} role for testing?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Switch",
            onPress: async () => {
              setSwitching(true);
              try {
                await SecureStore.setItemAsync("test_role", roleId);
                Alert.alert(
                  "Role Switched",
                  `You are now in ${roleId} mode. The app will reload automatically.`,
                  [
                    {
                      text: "OK",
                      onPress: () => router.replace('/'),
                    },
                  ]
                );
              } catch (error) {
                Alert.alert("Error", "Failed to switch role");
              } finally {
                setSwitching(false);
              }
            },
          },
        ]
      );
    }
  };

  const clearTestRole = async () => {
    try {
      if (Platform.OS === 'web') {
        await removeItem("test_role");
        window.alert("Test mode cleared! The page will reload.");
        setTimeout(() => window.location.reload(), 500);
      } else {
        await SecureStore.deleteItemAsync("test_role");
        Alert.alert(
          "Test Mode Cleared",
          "Restart the app to return to your actual role.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert("Failed to clear test mode");
      } else {
        Alert.alert("Error", "Failed to clear test mode");
      }
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Back Button */}
          

          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Role Switcher</Text>
            <Text className="text-base text-muted mt-1">
              Test different user roles (Development Only)
            </Text>
          </View>

          {/* Warning Banner */}
          <View className="bg-warning/10 rounded-2xl p-4 border border-warning/20">
            <View className="flex-row items-start gap-3">
              <Ionicons name="warning" size={24} color={colors.warning} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground mb-1">
                  Development Feature
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  This feature is for testing only. Role changes require app restart to take effect.
                </Text>
              </View>
            </View>
          </View>

          {/* Current Role */}
          {user && (
            <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
              <Text className="text-sm text-primary mb-1">Current Role</Text>
              <Text className="text-xl font-bold text-foreground capitalize">
                {user.role}
              </Text>
              <Text className="text-sm text-muted mt-1">{user.name}</Text>
            </View>
          )}

          {/* Role Options */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Select Test Role</Text>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.id}
                onPress={() => handleRoleSwitch(role.id)}
                disabled={switching}
                className={`bg-surface rounded-2xl p-4 border border-border active:opacity-70 ${
                  user?.role === role.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      user?.role === role.id ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <Ionicons
                      name={role.icon as any}
                      size={24}
                      color={user?.role === role.id ? "#fff" : colors.foreground}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {role.label}
                    </Text>
                    <Text className="text-sm text-muted mt-1">{role.description}</Text>
                  </View>
                  {user?.role === role.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Clear Test Mode */}
          <TouchableOpacity
            onPress={clearTestRole}
            disabled={switching}
            className="bg-error/10 border border-error/20 rounded-full py-4 active:opacity-70"
          >
            <Text className="text-center text-error font-semibold text-base">
              Clear Test Mode & Return to Actual Role
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
