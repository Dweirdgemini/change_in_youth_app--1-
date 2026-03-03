import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function LeaderboardScreen() {
  const colors = useColors();

  const { data: leaderboard, isLoading } = trpc.contentSharing.getEngagementLeaderboard.useQuery();
  const { data: myStats } = trpc.contentSharing.getMyContentStats.useQuery();

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Engagement Leaderboard
          </Text>
          <Text className="text-sm text-muted leading-relaxed">
            Top content contributors this month
          </Text>
        </View>

        {/* My Stats Card */}
        {myStats && (
          <View className="bg-primary/10 rounded-xl p-4 mb-4 border border-primary">
            <Text className="text-primary font-bold text-lg mb-3">Your Stats</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted">Total Posts</Text>
              <Text className="text-foreground font-semibold">{myStats.totalPosts}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted">Approved</Text>
              <Text className="text-success font-semibold">{myStats.approvedPosts}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted">Total Views</Text>
              <Text className="text-foreground font-semibold">
                {myStats.totalViews?.toLocaleString() || 0}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted">Total Reach</Text>
              <Text className="text-primary font-bold text-lg">
                {myStats.totalReach?.toLocaleString() || 0}
              </Text>
            </View>
          </View>
        )}

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 ? (
          <View className="gap-3">
            {leaderboard.map((entry, index) => {
              const isTopThree = index < 3;
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

              return (
                <View
                  key={entry.userId}
                  className={`rounded-xl p-4 border ${
                    isTopThree
                      ? "bg-primary/5 border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <View className="flex-row items-center mb-3">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        isTopThree ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <Text
                        className={`font-bold ${
                          isTopThree ? "text-white" : "text-foreground"
                        }`}
                      >
                        {medal || `#${index + 1}`}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {entry.userName || "Unknown"}
                      </Text>
                      <Text className="text-sm text-muted leading-relaxed">
                        {entry.totalPosts} post{entry.totalPosts !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-primary">
                        {entry.totalReach?.toLocaleString() || 0}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">reach</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between pt-3 border-t border-border">
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-foreground">
                        {entry.totalPosts}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">Posts</Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-foreground">
                        {entry.totalViews?.toLocaleString() || 0}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">Views</Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-primary">
                        {entry.totalReach?.toLocaleString() || 0}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">Reach</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="items-center justify-center py-12">
            <Text className="text-6xl mb-4">📊</Text>
            <Text className="text-base text-muted text-center leading-relaxed">
              No content shared yet
            </Text>
            <Text className="text-sm text-muted text-center mt-2">
              Be the first to share content and climb the leaderboard!
            </Text>
          </View>
        )}

        {/* Info Box */}
        <View className="bg-success/10 rounded-xl p-4 mt-4">
          <Text className="text-success font-semibold mb-2">🏆 Monthly Rewards</Text>
          <Text className="text-muted text-sm leading-relaxed">
            The team member with the highest reach each month wins a reward! Keep sharing relevant, engaging content to increase your chances of winning.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
