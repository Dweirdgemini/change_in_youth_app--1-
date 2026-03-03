import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useAuth } from "@/hooks/use-auth";

export default function PerformanceLeaderboardScreen() {
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = trpc.performanceRanking.getPerformanceLeaderboard.useQuery();

  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  if (!isAdmin) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-lg text-muted text-center">
          You don't have permission to view the performance leaderboard.
        </Text>
        
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 4.0) return "text-blue-600";
    if (score >= 3.0) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <ScreenContainer>
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="mb-4">
          
          <Text className="text-2xl font-bold text-foreground mb-2">
            Performance Leaderboard
          </Text>
          <Text className="text-base text-muted">
            Team members ranked by overall performance scores
          </Text>
        </View>

        {/* Legend */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Score Ranges:
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <Text className="text-xs text-muted leading-relaxed">4.5+ Trusted</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
              <Text className="text-xs text-muted leading-relaxed">4.0+ High Performer</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
              <Text className="text-xs text-muted leading-relaxed">3.0+ Standard</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-gray-500 mr-2" />
              <Text className="text-xs text-muted leading-relaxed">&lt;3.0 Probationary</Text>
            </View>
          </View>
        </View>

        {/* Leaderboard List */}
        {leaderboard && leaderboard.length > 0 ? (
          <FlatList
            data={leaderboard}
            keyExtractor={(item) => item.userId.toString()}
            renderItem={({ item, index }) => (
              <View
                className={`bg-surface rounded-2xl p-4 mb-3 border border-border ${
                  index < 3 ? "border-2 border-primary" : ""
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-2xl mr-3 w-10">
                      {getMedalEmoji(index)}
                    </Text>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {item.name}
                      </Text>
                      <Text className="text-sm text-muted leading-relaxed">
                        {item.email}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed capitalize mt-1">
                        {item.role}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className={`text-3xl font-bold ${getScoreColor(item.overallScore)}`}>
                      {item.overallScore.toFixed(1)}
                    </Text>
                    <Text className="text-xs text-muted leading-relaxed">/ 5.0</Text>
                  </View>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg text-muted text-center">
              No performance data available yet.
            </Text>
            <Text className="text-sm text-muted text-center mt-2">
              Team members need to complete sessions and receive feedback to appear on the leaderboard.
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
