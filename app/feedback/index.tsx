import { View, Text, ScrollView, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function FeedbackListScreen() {
  const colors = useColors();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { data: projects } = (trpc.scheduling as any).getAllProjects.useQuery();
  const { data: feedbackList } = (trpc.feedback as any).getAllFeedback.useQuery(
    { projectId: selectedProject! },
    { enabled: !!selectedProject }
  );

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "#22C55E";
    if (rating >= 3.5) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header with Back Button */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <IconSymbol name="chevron.left" size={28} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Team Feedback</Text>
          </View>
          <Text className="text-base text-muted">
            View all submitted feedback by project
          </Text>
        </View>

        {/* Project Selector */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Filter by Project</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
            <View className="flex-row gap-2 pr-12">
              <Pressable
                onPress={() => setSelectedProject(null)}
                className={`px-4 py-2 rounded-full ${
                  selectedProject === null
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedProject === null ? "text-background" : "text-foreground"
                  }`}
                >
                  All Projects
                </Text>
              </Pressable>
              {projects?.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() => setSelectedProject(project.id)}
                  className={`px-4 py-2 rounded-full ${
                    selectedProject === project.id
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedProject === project.id ? "text-background" : "text-foreground"
                    }`}
                  >
                    {project.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Feedback List */}
        <View className="gap-3 mb-4">
          {feedbackList && feedbackList.length > 0 ? (
            feedbackList.map((feedback) => (
              <View key={feedback.id} className="bg-surface rounded-xl p-4 border border-border">
                {/* Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-semibold text-foreground">
                      Session #{feedback.sessionId}
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">
                      Submitted: {new Date(feedback.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center gap-1">
                      <Text
                        className="text-2xl font-bold"
                        style={{ color: getRatingColor(feedback.sessionQuality) }}
                      >
                        {feedback.sessionQuality.toFixed(1)}
                      </Text>
                      <Text className="text-sm text-muted leading-relaxed">/ 5</Text>
                    </View>
                    <Text className="text-xs text-muted leading-relaxed">Overall</Text>
                  </View>
                </View>

                {/* Ratings Grid */}
                <View className="flex-row flex-wrap gap-3 mb-3">
                  <View className="flex-1 min-w-[45%]">
                    <Text className="text-xs text-muted leading-relaxed mb-1">Facilitator</Text>
                    <View className="flex-row items-center gap-1">
                      <Text
                        className="text-lg font-bold"
                        style={{ color: getRatingColor(feedback.facilitatorPerformance) }}
                      >
                        {feedback.facilitatorPerformance.toFixed(1)}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">/ 5</Text>
                    </View>
                  </View>

                  {feedback.venueRating && (
                    <View className="flex-1 min-w-[45%]">
                      <Text className="text-xs text-muted leading-relaxed mb-1">Venue</Text>
                      <View className="flex-row items-center gap-1">
                        <Text
                          className="text-lg font-bold"
                          style={{ color: getRatingColor(feedback.venueRating) }}
                        >
                          {feedback.venueRating.toFixed(1)}
                        </Text>
                        <Text className="text-xs text-muted leading-relaxed">/ 5</Text>
                      </View>
                    </View>
                  )}

                  {feedback.participantEngagement && (
                    <View className="flex-1 min-w-[45%]">
                      <Text className="text-xs text-muted leading-relaxed mb-1">Engagement</Text>
                      <View className="flex-row items-center gap-1">
                        <Text
                          className="text-lg font-bold"
                          style={{ color: getRatingColor(feedback.participantEngagement) }}
                        >
                          {feedback.participantEngagement.toFixed(1)}
                        </Text>
                        <Text className="text-xs text-muted leading-relaxed">/ 5</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Qualitative Feedback */}
                {feedback.whatWorkedWell && (
                  <View className="mb-3 pt-3 border-t border-border">
                    <Text className="text-xs font-semibold text-foreground mb-1">
                      ✅ What Worked Well:
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">{feedback.whatWorkedWell}</Text>
                  </View>
                )}

                {feedback.whatCouldImprove && (
                  <View className="mb-3 pt-3 border-t border-border">
                    <Text className="text-xs font-semibold text-foreground mb-1">
                      💡 What Could Improve:
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">{feedback.whatCouldImprove}</Text>
                  </View>
                )}

                {feedback.additionalComments && (
                  <View className="pt-3 border-t border-border">
                    <Text className="text-xs font-semibold text-foreground mb-1">
                      📝 Additional Comments:
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">{feedback.additionalComments}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center border border-border">
              <Text className="text-lg font-semibold text-foreground mb-2 text-center">
                No Feedback Yet
              </Text>
              <Text className="text-sm text-muted text-center">
                {selectedProject
                  ? "No feedback has been submitted for this project"
                  : "No feedback has been submitted yet"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
