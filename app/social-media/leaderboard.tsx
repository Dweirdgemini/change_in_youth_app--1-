import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function SocialMediaLeaderboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("month");

  const { data: leaderboard, isLoading } = trpc.socialMedia.getLeaderboard.useQuery({
    month: selectedPeriod === "month" ? new Date().toISOString().slice(0, 7) : undefined,
    // TODO: Add period field to schema or use month filter
  });

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        
        <Text className="text-xl font-bold text-foreground flex-1">
          Performance Leaderboard
        </Text>
      </View>

      {/* Period Selector */}
      <View className="flex-row p-2 border-b border-border">
        <TouchableOpacity
          onPress={() => setSelectedPeriod("week")}
          className={`flex-1 py-3 rounded-lg ${
            selectedPeriod === "week" ? "bg-primary" : "bg-transparent"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              selectedPeriod === "week" ? "text-white" : "text-muted"
            }`}
          >
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedPeriod("month")}
          className={`flex-1 py-3 rounded-lg ${
            selectedPeriod === "month" ? "bg-primary" : "bg-transparent"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              selectedPeriod === "month" ? "text-white" : "text-muted"
            }`}
          >
            This Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedPeriod("all")}
          className={`flex-1 py-3 rounded-lg ${
            selectedPeriod === "all" ? "bg-primary" : "bg-transparent"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              selectedPeriod === "all" ? "text-white" : "text-muted"
            }`}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !leaderboard || leaderboard.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="trophy-outline" size={64} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4">
            No Data Yet
          </Text>
          <Text className="text-sm text-muted text-center mt-2">
            Post performance data will appear here once content is approved and published.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          <View className="p-4">
            {/* Info Banner */}
            <View className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
              <Text className="text-sm text-foreground">
                🏆 Top content creators are recognized for their engagement! Keep creating
                quality content to climb the leaderboard.
              </Text>
            </View>

            {/* Leaderboard */}
            {leaderboard.map((entry, index) => (
              <View
                key={entry.userId}
                className={`rounded-xl border p-4 mb-3 ${
                  index < 3
                    ? "bg-primary/5 border-primary/30"
                    : "bg-surface border-border"
                }`}
              >
                <View className="flex-row items-center">
                  {/* Rank */}
                  <View className="w-12 items-center mr-3">
                    <Text className="text-2xl">{getMedalEmoji(index + 1)}</Text>
                  </View>

                  {/* User Info */}
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {entry.userName}
                    </Text>
                    <Text className="text-xs text-muted leading-relaxed mt-1">
                      {entry.totalSubmissions} {entry.totalSubmissions === 1 ? "post" : "posts"}
                    </Text>
                  </View>

                  {/* Stats */}
                  <View className="items-end">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="heart" size={14} color={colors.error} />
                      <Text className="text-sm font-semibold text-foreground ml-1">
                        {formatNumber(entry.totalLikes)}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="eye" size={14} color={colors.primary} />
                      <Text className="text-sm text-muted ml-1">
                        {formatNumber(entry.totalViews)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="share-social" size={14} color={colors.success} />
                      <Text className="text-sm text-muted ml-1">
                        {formatNumber(entry.totalEngagement)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Engagement Rate */}
                <View className="mt-3 pt-3 border-t border-border/50">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-muted leading-relaxed">Engagement Rate</Text>
                    <Text className="text-sm font-semibold text-primary">
                      {((entry.totalEngagement / Math.max(entry.totalReach, 1)) * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View className="h-2 bg-surface rounded-full mt-2 overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min((entry.totalEngagement / Math.max(entry.totalReach, 1)) * 100, 100)}%` }}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
