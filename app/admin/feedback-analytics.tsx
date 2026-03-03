import { View, Text, ScrollView, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function FeedbackAnalyticsScreen() {
  const colors = useColors();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { data: projects } = (trpc.scheduling as any).getAllProjects.useQuery();
  const { data: projectInsights } = (trpc.feedback as any).getProjectInsights.useQuery(
    { projectId: selectedProject! },
    { enabled: !!selectedProject }
  );
  // Note: getFacilitatorPerformance requires userId, not projectId
  // This query is disabled until proper userId is available
  const { data: facilitatorPerformance } = trpc.feedback.getFacilitatorPerformance.useQuery(
    { userId: 0 },
    { enabled: false }
  );

  const StatCard = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <View className="bg-surface rounded-xl p-4 border border-border flex-1">
      <Text className="text-sm text-muted mb-1">{label}</Text>
      <Text
        className="text-2xl font-bold"
        style={{ color: color || colors.foreground }}
      >
        {value}
      </Text>
    </View>
  );

  const RatingBar = ({ label, rating }: { label: string; rating: number }) => {
    const percentage = (rating / 5) * 100;
    const color =
      rating >= 4.5 ? "#22C55E" : rating >= 3.5 ? "#F59E0B" : "#EF4444";

    return (
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          <Text className="text-sm font-bold" style={{ color }}>
            {rating.toFixed(1)} / 5.0
          </Text>
        </View>
        <View className="h-3 bg-surface rounded-full overflow-hidden border border-border">
          <View
            className="h-full rounded-full"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </View>
      </View>
    );
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
            <Text className="text-2xl font-bold text-foreground">Feedback Analytics</Text>
          </View>
          <Text className="text-base text-muted">
            Team member insights and performance tracking
          </Text>
        </View>

        {/* Project Selector */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Select Project</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
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

        {!selectedProject ? (
          <View className="bg-surface rounded-xl p-8 items-center border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2 text-center">
              Select a Project
            </Text>
            <Text className="text-sm text-muted text-center">
              Choose a project above to view feedback analytics
            </Text>
          </View>
        ) : projectInsights ? (
          <>
            {/* Summary Stats */}
            <View className="flex-row gap-3 mb-4">
              <StatCard
                label="Total Feedback"
                value={projectInsights.totalFeedback}
                color={colors.primary}
              />
              <StatCard
                label="Avg Rating"
                value={projectInsights.averageSessionQuality.toFixed(1)}
                color={
                  projectInsights.averageSessionQuality >= 4.5
                    ? "#22C55E"
                    : projectInsights.averageSessionQuality >= 3.5
                    ? "#F59E0B"
                    : "#EF4444"
                }
              />
            </View>

            {/* Average Ratings */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-lg font-bold text-foreground mb-4">Average Ratings</Text>

              <RatingBar
                label="Session Quality"
                rating={projectInsights.averageSessionQuality}
              />
              <RatingBar
                label="Facilitator Performance"
                rating={projectInsights.averageFacilitatorPerformance}
              />
              {projectInsights.averageVenueRating && (
                <RatingBar
                  label="Venue & Environment"
                  rating={projectInsights.averageVenueRating}
                />
              )}
              {projectInsights.averageParticipantEngagement && (
                <RatingBar
                  label="Participant Engagement"
                  rating={projectInsights.averageParticipantEngagement}
                />
              )}
            </View>

            {/* Facilitator Performance */}
            {Array.isArray(facilitatorPerformance) && facilitatorPerformance.length > 0 && (
              <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
                <Text className="text-lg font-bold text-foreground mb-4">
                  Facilitator Performance
                </Text>

                {Array.isArray(facilitatorPerformance) && facilitatorPerformance.map((facilitator: any) => (
                  <View
                    key={facilitator.facilitatorId}
                    className="mb-4 pb-4 border-b border-border last:border-b-0"
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-base font-semibold text-foreground">
                        Facilitator #{facilitator.facilitatorId}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm text-muted leading-relaxed">
                          {facilitator.feedbackCount} reviews
                        </Text>
                        <Text
                          className="text-lg font-bold"
                          style={{
                            color:
                              facilitator.averageRating >= 4.5
                                ? "#22C55E"
                                : facilitator.averageRating >= 3.5
                                ? "#F59E0B"
                                : "#EF4444",
                          }}
                        >
                          {facilitator.averageRating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <View className="h-2 bg-background rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${(facilitator.averageRating / 5) * 100}%`,
                          backgroundColor:
                            facilitator.averageRating >= 4.5
                              ? "#22C55E"
                              : facilitator.averageRating >= 3.5
                              ? "#F59E0B"
                              : "#EF4444",
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Common Themes */}
            {projectInsights.commonThemes && projectInsights.commonThemes.length > 0 && (
              <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
                <Text className="text-lg font-bold text-foreground mb-4">
                  Common Feedback Themes
                </Text>
                {projectInsights.commonThemes.map((theme, index) => (
                  <View key={index} className="mb-3">
                    <View className="flex-row items-start gap-2">
                      <Text className="text-2xl">💡</Text>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground mb-1">
                          {theme.category}
                        </Text>
                        <Text className="text-sm text-muted leading-relaxed">{theme.summary}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View className="bg-surface rounded-xl p-8 items-center border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2 text-center">
              Loading Analytics...
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
