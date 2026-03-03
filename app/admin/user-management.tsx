import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useState } from "react";

export default function UserManagementScreen() {
  const colors = useColors();
  const { data: users, isLoading, refetch } = trpc.adminUsers.getAllUsers.useQuery();
  const createUserMutation = trpc.adminUsers.createUser.useMutation();
  const updateUserMutation = trpc.adminUsers.updateUser.useMutation();
  const deleteUserMutation = trpc.adminUsers.deleteUser.useMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "team_member" as "admin" | "finance" | "safeguarding" | "team_member",
  });

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await createUserMutation.mutateAsync(newUser);
      Alert.alert("Success", `User ${newUser.name} added successfully`);
      setShowAddModal(false);
      setNewUser({ name: "", email: "", role: "team_member" });
      refetch();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add user");
    }
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUserMutation.mutateAsync({ userId });
              Alert.alert("Success", "User deleted");
              refetch();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View style={{ gap: 24 }}>
          {/* Header */}
          <View>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginBottom: 16 }}
            >
              <Text style={{ fontSize: 16, color: colors.primary }}>← Back</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground }}>
                  User Management
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                  {users?.length || 0} team members
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: colors.background, fontWeight: "600" }}>+ Add User</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Users List */}
          {users?.map((user: any) => (
            <View
              key={user.id}
              style={{
                backgroundColor: colors.surface,
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
                    {user.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                    {user.email}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary + "20",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      alignSelf: "flex-start",
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary, textTransform: "capitalize" }}>
                      {user.role}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteUser(user.id, user.name)}
                  style={{
                    backgroundColor: colors.error + "20",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.error, fontWeight: "600" }}>Delete</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>Last Sign In</Text>
                  <Text style={{ fontSize: 14, color: colors.foreground, marginTop: 2 }}>
                    {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : "Never"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>Joined</Text>
                  <Text style={{ fontSize: 14, color: colors.foreground, marginTop: 2 }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Can Post Jobs Toggle */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>Can Post Jobs</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Allow this user to create job postings</Text>
                </View>
                <Switch
                  value={user.canPostJobs || false}
                  onValueChange={async (value) => {
                    try {
                      await updateUserMutation.mutateAsync({
                        userId: user.id,
                        canPostJobs: value,
                      });
                      refetch();
                    } catch (error: any) {
                      Alert.alert("Error", error.message || "Failed to update permission");
                    }
                  }}
                  trackColor={{ false: colors.border, true: colors.primary + "80" }}
                  thumbColor={user.canPostJobs ? colors.primary : colors.muted}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              gap: 20,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
              Add New User
            </Text>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                  Full Name
                </Text>
                <TextInput
                  value={newUser.name}
                  onChangeText={(text) => setNewUser({ ...newUser, name: text })}
                  placeholder="John Doe"
                  placeholderTextColor={colors.muted}
                  style={{
                    padding: 16,
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    fontSize: 16,
                  }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                  Email Address
                </Text>
                <TextInput
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                  placeholder="john@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    padding: 16,
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.foreground,
                    fontSize: 16,
                  }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                  Role
                </Text>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {(["team_member", "admin", "finance", "safeguarding"] as const).map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setNewUser({ ...newUser, role })}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: newUser.role === role ? colors.primary : colors.surface,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: newUser.role === role ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: newUser.role === role ? colors.background : colors.foreground,
                          textTransform: "capitalize",
                        }}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: 16,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddUser}
                disabled={createUserMutation.isPending}
                style={{
                  flex: 1,
                  padding: 16,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  alignItems: "center",
                  opacity: createUserMutation.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.background }}>
                  {createUserMutation.isPending ? "Adding..." : "Add User"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
