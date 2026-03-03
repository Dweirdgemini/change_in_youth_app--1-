import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function PermissionManagementScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const { data: usersWithPermissions, refetch } = trpc.permissions.getAllUsersWithPermissions.useQuery();
  const { data: projects } = (trpc.finance as any).getProjects.useQuery();
  const updateRole = trpc.permissions.updateUserRole.useMutation();
  const assignPermission = trpc.permissions.assignPermission.useMutation();
  const removePermission = trpc.permissions.removePermission.useMutation();

  const roleColors = {
    super_admin: "#8B5CF6",
    admin: "#3B82F6",
    finance: "#10B981",
    safeguarding: "#F59E0B",
    facilitator: "#6366F1",
    student: "#6B7280",
  };

  const roleLabels = {
    super_admin: "Super Admin",
    admin: "Admin",
    finance: "Finance",
    safeguarding: "Safeguarding",
    facilitator: "Facilitator",
    student: "Student",
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    Alert.alert(
      "Update Role",
      `Change user role to ${roleLabels[newRole as keyof typeof roleLabels]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            await updateRole.mutateAsync({
              userId,
              role: newRole as any,
            });
            refetch();
            Alert.alert("Success", "User role updated");
          },
        },
      ]
    );
  };

  const handleAssignPermission = async (userId: number, projectId: number | null) => {
    Alert.alert("Assign Permission", "Select access level:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Read",
        onPress: async () => {
          await assignPermission.mutateAsync({
            userId,
            projectId,
            accessLevel: "read",
          });
          refetch();
        },
      },
      {
        text: "Write",
        onPress: async () => {
          await assignPermission.mutateAsync({
            userId,
            projectId,
            accessLevel: "write",
          });
          refetch();
        },
      },
      {
        text: "Admin",
        onPress: async () => {
          await assignPermission.mutateAsync({
            userId,
            projectId,
            accessLevel: "admin",
          });
          refetch();
        },
      },
    ]);
  };

  const handleRemovePermission = async (permissionId: number) => {
    Alert.alert("Remove Permission", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removePermission.mutateAsync({ permissionId });
          refetch();
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="p-6 border-b" style={{ borderBottomColor: colors.border }}>
        <View className="flex-row items-center gap-4">
          
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              Permission Management
            </Text>
            <Text className="text-sm" style={{ color: colors.muted }}>
              Manage user roles and project access
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        {usersWithPermissions?.map((user) => (
          <View
            key={user.id}
            className="mb-4 p-4 rounded-xl border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            {/* User Info */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                  {user.name || "Unnamed User"}
                </Text>
                <Text className="text-sm" style={{ color: colors.muted }}>
                  {user.email}
                </Text>
              </View>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: roleColors[user.role as keyof typeof roleColors] }}
              >
                <Text className="text-xs font-semibold text-white">
                  {roleLabels[user.role as keyof typeof roleLabels]}
                </Text>
              </View>
            </View>

            {/* Change Role Button */}
            <TouchableOpacity
              className="mb-3 p-3 rounded-lg border"
              style={{ borderColor: colors.border }}
              onPress={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                Change Role
              </Text>
            </TouchableOpacity>

            {/* Role Selection */}
            {selectedUser === user.id && (
              <View className="mb-3 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    className="p-2 mb-1 rounded"
                    style={{
                      backgroundColor: user.role === key ? roleColors[key as keyof typeof roleColors] : "transparent",
                    }}
                    onPress={() => handleUpdateRole(user.id, key)}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: user.role === key ? "#FFF" : colors.text }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Permissions List */}
            {user.permissions && user.permissions.length > 0 && (
              <View className="mt-2">
                <Text className="text-xs font-semibold mb-2" style={{ color: colors.muted }}>
                  PROJECT PERMISSIONS
                </Text>
                {user.permissions.map((perm: any) => (
                  <View
                    key={perm.id}
                    className="flex-row items-center justify-between p-2 mb-1 rounded"
                    style={{ backgroundColor: colors.background }}
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>
                        {perm.projectName || "All Projects"}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {perm.accessLevel}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemovePermission(perm.id)}>
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add Permission Button */}
            <TouchableOpacity
              className="mt-2 p-3 rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={() => handleAssignPermission(user.id, null)}
            >
              <Text className="text-sm font-semibold text-center text-white">
                + Add Project Permission
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
