import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";

export default function MaterialsScreen() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: projects, isLoading: projectsLoading } = (trpc.finance as any).getProjects.useQuery();
  const { data: materials, isLoading: materialsLoading } = trpc.materials.getProjectMaterials.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  if (projectsLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!selectedProjectId) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="p-6 gap-4">
            <View>
              <Text className="text-2xl font-bold text-foreground">Project Materials</Text>
              <Text className="text-base text-muted mt-1">
                Select a project to view materials and resources
              </Text>
            </View>

            <View className="gap-3">
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                    onPress={() => setSelectedProjectId(project.id)}
                  >
                    <Text className="text-lg font-semibold text-foreground">{project.name}</Text>
                    <Text className="text-sm text-muted mt-1">{project.description}</Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <View
                        className={`px-3 py-1 rounded-full ${
                          project.status === "active"
                            ? "bg-success/20"
                            : project.status === "completed"
                            ? "bg-muted/20"
                            : "bg-warning/20"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium capitalize ${
                            project.status === "active"
                              ? "text-success"
                              : project.status === "completed"
                              ? "text-muted"
                              : "text-warning"
                          }`}
                        >
                          {project.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                  <Text className="text-muted text-center">No projects available</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (materialsLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header with Back Button */}
          <View>
            <TouchableOpacity
              className="bg-surface px-4 py-2 rounded-lg self-start active:opacity-70 mb-4"
              onPress={() => setSelectedProjectId(null)}
            >
              <Text className="text-foreground font-semibold">← Back to Projects</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">{materials?.project.name}</Text>
            <Text className="text-base text-muted mt-1">{materials?.project.description}</Text>
          </View>

          {/* Project Documents */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Project Documents</Text>
            {materials && materials.documents.length > 0 ? (
              materials.documents.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                  onPress={() => {
                    // Open document (would use Linking.openURL in production)
                    console.log("Open document:", doc.fileUrl);
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">{doc.title}</Text>
                      {doc.description && (
                        <Text className="text-sm text-muted mt-1">{doc.description}</Text>
                      )}
                      <View className="flex-row items-center gap-2 mt-2">
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                          <Text className="text-xs text-primary font-medium capitalize">
                            {doc.type}
                          </Text>
                        </View>
                        <Text className="text-xs text-muted leading-relaxed">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-2xl text-primary ml-4">→</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <Text className="text-muted text-center">No documents available</Text>
              </View>
            )}
          </View>

          {/* Your Sessions */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Your Sessions</Text>
            {materials && materials.sessions.length > 0 ? (
              materials.sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                  onPress={() => router.push(`/materials/session?id=${session.id}` as any)}
                >
                  <Text className="text-base font-semibold text-foreground">{session.title}</Text>
                  <Text className="text-sm text-muted mt-1">{session.venue}</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    {new Date(session.startTime).toLocaleString()}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-2">
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-xs text-primary font-medium">
                        Session {session.sessionNumber} of {session.totalSessions}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <Text className="text-muted text-center">No sessions assigned</Text>
              </View>
            )}
          </View>

          {/* Invoice Instructions */}
          <TouchableOpacity
            className="bg-primary rounded-2xl p-4 active:opacity-80"
            onPress={() => router.push("/materials/invoice-help" as any)}
          >
            <Text className="text-background font-semibold text-base text-center">
              How to Invoice
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
