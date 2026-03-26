import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/contexts/auth-context";
import { router } from "expo-router";

export default function PerformanceMetricsScreen() {
  const { user } = useAuthContext();
  const { data: metrics, isLoading } = trpc.performanceRanking.getUserPerformanceMetrics.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  if (!metrics) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-lg text-muted text-center">
          No performance data available yet. Complete sessions and submit content to build your performance profile.
        </Text>
      </ScreenContainer>
    );
  }

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "trusted":
        return "bg-green-500";
      case "high_performer":
        return "bg-blue-500";
      case "standard":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRankLabel = (rank: string) => {
    switch (rank) {
      case "trusted":
        return "Trusted";
      case "high_performer":
        return "High Performer";
      case "standard":
        return "Standard";
      default:
        return "Probationary";
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="mb-4">
          
          <Text className="text-2xl font-bold text-foreground mb-2">
            My Performance Metrics
          </Text>
          <Text className="text-base text-muted">
            Track your performance across workshops, social media, and school feedback
          </Text>
        </View>

        {/* Overall Score Card */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Overall Performance Score
          </Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-5xl font-bold text-primary">
                {metrics.overallScore.toFixed(1)}
              </Text>
              <Text className="text-base text-muted mt-1">out of 5.0</Text>
            </View>
            <View className={`${getRankColor(metrics.suggestedRank)} px-4 py-2 rounded-full`}>
              <Text className="text-white font-semibold">
                {getRankLabel(metrics.suggestedRank)}
              </Text>
            </View>
          </View>
        </View>

        {/* Workshop Feedback */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            📝 Workshop Feedback Quality
          </Text>
          {metrics.workshopFeedback.count > 0 ? (
            <>
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Workshop Quality</Text>
                <Text className="text-foreground font-semibold">
                  {metrics.workshopFeedback.avgWorkshopQuality.toFixed(1)} / 5.0
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Facilitator Performance</Text>
                <Text className="text-foreground font-semibold">
                  {metrics.workshopFeedback.avgFacilitatorPerformance.toFixed(1)} / 5.0
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Venue Rating</Text>
                <Text className="text-foreground font-semibold">
                  {metrics.workshopFeedback.avgVenueRating.toFixed(1)} / 5.0
                </Text>
              </View>
              <Text className="text-sm text-muted mt-2">
                Based on {metrics.workshopFeedback.count} feedback submissions
              </Text>
            </>
          ) : (
            <Text className="text-muted">No workshop feedback yet</Text>
          )}
        </View>

        {/* Social Media Quality */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            📱 Social Media Post Quality
          </Text>
          {metrics.socialMedia.count > 0 ? (
            <>
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Average Quality Rating</Text>
                <Text className="text-foreground font-semibold">
                  {metrics.socialMedia.avgQualityRating.toFixed(1)} / 5.0
                </Text>
              </View>
              <Text className="text-sm text-muted mt-2">
                Based on {metrics.socialMedia.count} approved posts
              </Text>
            </>
          ) : (
            <Text className="text-muted">No approved social media posts yet</Text>
          )}
        </View>

        {/* School Feedback */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            🏫 School Feedback
          </Text>
          {metrics.schoolFeedback.count > 0 ? (
            <>
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Overall Rating</Text>
                <Text className="text-foreground font-semibold">
                  {metrics.schoolFeedback.avgOverallRating.toFixed(1)} / 5.0
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Delivery Quality</Text>
                <Text className="text-foreground font-semibold">
                  {metrics.schoolFeedback.avgDeliveryQuality.toFixed(1)} / 5.0
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Punctuality</Text>
                <Text className="text-foreground font-semibold">
                  {metrics.schoolFeedback.avgPunctuality.toFixed(1)} / 5.0
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Professionalism</Text>
                <Text className="text-foreground font-semibold">
                  {metrics.schoolFeedback.avgProfessionalism.toFixed(1)} / 5.0
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Student Engagement</Text>
                <Text className="text-foreground font-semibold">
                  {metrics.schoolFeedback.avgStudentEngagement.toFixed(1)} / 5.0
                </Text>
              </View>
              <Text className="text-sm text-muted mt-2">
                Based on {metrics.schoolFeedback.count} school reviews
              </Text>
            </>
          ) : (
            <Text className="text-muted">No school feedback yet</Text>
          )}
        </View>

        {/* Performance Tips */}
        <View className="bg-blue-50 rounded-2xl p-6 mb-4 border border-blue-200">
          <Text className="text-lg font-semibold text-blue-900 mb-3">
            💡 How to Improve Your Ranking
          </Text>
          <Text className="text-sm text-blue-800 mb-2">
            • Deliver high-quality workshops with engaging content
          </Text>
          <Text className="text-sm text-blue-800 mb-2">
            • Create compelling social media posts that get approved
          </Text>
          <Text className="text-sm text-blue-800 mb-2">
            • Maintain professionalism and punctuality at schools
          </Text>
          <Text className="text-sm text-blue-800">
            • Consistently receive positive feedback from participants
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
