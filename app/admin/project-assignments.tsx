import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ProjectAssignmentsScreen() {
  const colors = useColors();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: projects, refetch } = (trpc.projectAssignments as any).getAllProjectsWithUsers.useQuery();
  const { data: unassignedUsers } = trpc.projectAssignments.getUnassignedUsers.useQuery(
    { projectId: selectedProject! },
    { enabled: !!selectedProject && showAddModal }
  );

  const assignMutation = trpc.projectAssignments.assignUser.useMutation();
  const removeMutation = trpc.projectAssignments.removeUser.useMutation();

  const handleAssignUser = async (userId: number) => {
    if (!selectedProject) return;

    try {
      await assignMutation.mutateAsync({
        projectId: selectedProject,
        userId,
      });
      setShowAddModal(false);
      refetch();
    } catch (error: any) {
      alert(error.message || "Failed to assign user");
    }
  };

  const handleRemoveUser = async (projectId: number, userId: number) => {
    try {
      await removeMutation.mutateAsync({
        projectId,
        userId,
      });
      refetch();
    } catch (error: any) {
      alert(error.message || "Failed to remove user");
    }
  };

  const selectedProjectData = projects?.find((p) => p.id === selectedProject);

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Project Assignments</Text>
            <Text className="text-sm text-muted mt-1">
              Assign team members to projects
            </Text>
          </View>

          {/* Projects List */}
          {!projects ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <View className="gap-4">
              {projects.map((project) => (
                <View
                  key={project.id}
                  className="bg-surface rounded-2xl p-4 border border-border"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground">
                        {project.name}
                      </Text>
                      {project.description && (
                        <Text className="text-sm text-muted mt-1">
                          {project.description}
                        </Text>
                      )}
                    </View>
                    <View
                      style={{ backgroundColor: colors.primary }}
                      className="px-3 py-1 rounded-full"
                    >
                      <Text className="text-white text-xs font-bold">
                        {project.assignedUsers?.length || 0}
                      </Text>
                    </View>
                  </View>

                  {/* Assigned Users */}
                  {project.assignedUsers && project.assignedUsers.length > 0 ? (
                    <View className="gap-2 mb-3">
                      {project.assignedUsers.map((user) => (
                        <View
                          key={user.userId}
                          className="flex-row justify-between items-center bg-background rounded-lg p-3"
                        >
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-foreground">
                              {user.userName}
                            </Text>
                            {user.userEmail && (
                              <Text className="text-xs text-muted leading-relaxed mt-0.5">
                                {user.userEmail}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemoveUser(project.id, user.userId)}
                            className="px-3 py-1 bg-error rounded-lg"
                          >
                            <Text className="text-white text-xs font-medium">Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View className="bg-background rounded-lg p-4 mb-3">
                      <Text className="text-muted text-center text-sm">
                        No team members assigned yet
                      </Text>
                    </View>
                  )}

                  {/* Add User Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedProject(project.id);
                      setShowAddModal(true);
                    }}
                    style={{ backgroundColor: colors.primary }}
                    className="py-2 rounded-lg items-center"
                  >
                    <Text className="text-white font-medium">+ Assign Team Member</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.background }} className="rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-foreground mb-2">
              Assign Team Member
            </Text>
            {selectedProjectData && (
              <Text className="text-sm text-muted mb-4">
                to {selectedProjectData.name}
              </Text>
            )}

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {!unassignedUsers ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : unassignedUsers.length === 0 ? (
                <View className="bg-surface rounded-2xl p-6 items-center">
                  <Text className="text-muted text-center">
                    All users are already assigned to this project
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {unassignedUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => handleAssignUser(user.id)}
                      className="bg-surface rounded-lg p-4 border border-border"
                    >
                      <Text className="text-base font-medium text-foreground">
                        {user.name}
                      </Text>
                      {user.email && (
                        <Text className="text-sm text-muted mt-1">{user.email}</Text>
                      )}
                      <View className="flex-row items-center gap-2 mt-2">
                        <View
                          style={{ backgroundColor: colors.primary }}
                          className="px-2 py-1 rounded"
                        >
                          <Text className="text-white text-xs font-medium">
                            {user.role?.toUpperCase() || "USER"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              className="mt-4 py-3 rounded-lg items-center border border-border"
            >
              <Text className="text-foreground font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
