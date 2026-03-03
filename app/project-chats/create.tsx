import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";

export default function CreateProjectChatScreen() {
  const colors = useColors();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projects, isLoading: loadingProjects, error: projectsError } = (trpc.scheduling as any).getAllProjects.useQuery();
  const { data: users, isLoading: loadingUsers, error: usersError } = trpc.adminUsers.getAllUsers.useQuery();
  const createChatMutation = trpc.projectChat.createChat.useMutation();
  const utils = trpc.useUtils();

  // Debug logging
  useEffect(() => {
    console.log('[CreateProjectChat] Projects:', projects?.length || 0, 'Loading:', loadingProjects, 'Error:', projectsError);
    console.log('[CreateProjectChat] Users:', users?.length || 0, 'Loading:', loadingUsers, 'Error:', usersError);
  }, [projects, users, loadingProjects, loadingUsers, projectsError, usersError]);

  // Auto-select current user
  const { data: currentUser } = trpc.auth.me.useQuery();
  
  useEffect(() => {
    if (currentUser && users && users.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers([currentUser.id]);
    }
  }, [currentUser, users]);

  const toggleMember = (userId: number) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a chat name");
      } else {
        Alert.alert("Error", "Please enter a chat name");
      }
      return;
    }

    if (!selectedProjectId) {
      if (Platform.OS === "web") {
        alert("Please select a project");
      } else {
        Alert.alert("Error", "Please select a project");
      }
      return;
    }

    if (selectedMembers.length === 0) {
      if (Platform.OS === "web") {
        alert("Please select at least one member");
      } else {
        Alert.alert("Error", "Please select at least one member");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createChatMutation.mutateAsync({
        projectId: selectedProjectId,
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMembers,
      });

      // Invalidate queries to refresh the list
      await utils.projectChat.getMyChats.invalidate();

      if (Platform.OS === "web") {
        alert("Project chat created successfully!");
      } else {
        Alert.alert("Success", "Project chat created successfully!");
      }

      // Navigate to the new chat
      router.replace(`/project-chats/${result.chatId}`);
    } catch (error: any) {
      console.error("Failed to create project chat:", error);
      if (Platform.OS === "web") {
        alert(error.message || "Failed to create project chat");
      } else {
        Alert.alert("Error", error.message || "Failed to create project chat");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-center gap-3">
            
            <Text className="text-2xl font-bold text-foreground">Create Project Chat</Text>
          </View>
        </View>

        <ScrollView className="flex-1">
          <View className="p-6 gap-4">
            {/* Chat Name */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Chat Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Positive ID Team, Social Media Preneur"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                }}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Description (Optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What is this chat for?"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                maxLength={500}
              />
            </View>

            {/* Project Selection */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Select Project *
              </Text>
              {loadingProjects ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View className="gap-2">
                  {projects && projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      onPress={() => setSelectedProjectId(project.id)}
                      style={{
                        backgroundColor: selectedProjectId === project.id ? colors.primary + "20" : colors.surface,
                        borderColor: selectedProjectId === project.id ? colors.primary : colors.border,
                        borderWidth: 2,
                        borderRadius: 12,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{
                        color: selectedProjectId === project.id ? colors.primary : colors.foreground,
                        fontWeight: selectedProjectId === project.id ? "600" : "400",
                      }}>
                        {project.name}
                      </Text>
                      {selectedProjectId === project.id && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Member Selection */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Select Members * ({selectedMembers.length} selected)
              </Text>
              {loadingUsers ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View className="gap-2">
                  {users && users.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => toggleMember(user.id)}
                      style={{
                        backgroundColor: selectedMembers.includes(user.id) ? colors.primary + "20" : colors.surface,
                        borderColor: selectedMembers.includes(user.id) ? colors.primary : colors.border,
                        borderWidth: 2,
                        borderRadius: 12,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View>
                        <Text style={{
                          color: selectedMembers.includes(user.id) ? colors.primary : colors.foreground,
                          fontWeight: selectedMembers.includes(user.id) ? "600" : "400",
                        }}>
                          {user.name}
                        </Text>
                        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                          {user.email}
                        </Text>
                      </View>
                      {selectedMembers.includes(user.id) && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Info Box */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text className="text-sm text-muted leading-relaxed">
                ℹ️ Project chats are private to selected members. Only admins can create project chats.
              </Text>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              onPress={handleCreate}
              disabled={isSubmitting || !name.trim() || !selectedProjectId || selectedMembers.length === 0}
              style={{
                backgroundColor: (!name.trim() || !selectedProjectId || selectedMembers.length === 0 || isSubmitting) ? colors.muted : colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                opacity: (!name.trim() || !selectedProjectId || selectedMembers.length === 0 || isSubmitting) ? 0.5 : 1,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Create Project Chat
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
