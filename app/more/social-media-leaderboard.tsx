import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type RankingTab = "quality" | "reach";

export default function SocialMediaLeaderboard() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<RankingTab>("quality");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  // Fetch quality rankings
  const qualityQuery = trpc.socialMedia.getQualityRankings.useQuery({
    month,
  });

  // Fetch reach rankings
  const reachQuery = trpc.socialMedia.getReachRankings.useQuery({
    month,
  });

  const isLoading = qualityQuery.isLoading || reachQuery.isLoading;
  const qualityRankings = qualityQuery.data || [];
  const reachRankings = reachQuery.data || [];

  const getMedalEmoji = (rank: number | undefined) => {
    if (!rank) return "";
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  const RankingCard = ({
    rank,
    name,
    value,
    unit,
    bonus,
  }: {
    rank: number | undefined;
    name: string | null;
    value: string | number;
    unit: string;
    bonus?: boolean;
  }) => (
    <View
      className="flex-row items-center justify-between p-4 mb-3 rounded-lg"
      style={{
        backgroundColor: colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32",
      }}
    >
      <View className="flex-row items-center flex-1">
        <Text className="text-2xl mr-3">{getMedalEmoji(rank)}</Text>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{name || "Unknown"}</Text>
          <Text className="text-sm text-muted leading-relaxed">
            {value} {unit}
          </Text>
        </View>
      </View>
      {bonus && (
        <View className="bg-green-500 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">£50 BONUS</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Social Media Leaderboard
          </Text>
          <Text className="text-muted">{month}</Text>
        </View>

        {/* Tab Buttons */}
        <View className="flex-row gap-2 mb-4">
          <View
            className={`flex-1 py-3 rounded-lg items-center ${
              activeTab === "quality"
                ? "bg-primary"
                : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`font-semibold ${
                activeTab === "quality" ? "text-white" : "text-foreground"
              }`}
              onPress={() => setActiveTab("quality")}
            >
              ⭐ Quality
            </Text>
          </View>
          <View
            className={`flex-1 py-3 rounded-lg items-center ${
              activeTab === "reach"
                ? "bg-primary"
                : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`font-semibold ${
                activeTab === "reach" ? "text-white" : "text-foreground"
              }`}
              onPress={() => setActiveTab("reach")}
            >
              📈 Reach
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-2">Loading rankings...</Text>
          </View>
        )}

        {/* Quality Rankings */}
        {!isLoading && activeTab === "quality" && (
          <View>
            <Text className="text-lg font-semibold text-foreground mb-4">
              Ranked by Star Rating
            </Text>
            {qualityRankings.length === 0 ? (
              <Text className="text-muted text-center py-8">
                No rankings yet. Start submitting content!
              </Text>
            ) : (
              qualityRankings.map((ranking) => (
                <RankingCard
                  key={ranking.userId}
                  rank={ranking.rank}
                  name={ranking.userName}
                  value={ranking.averageQualityRating}
                  unit="⭐ avg"
                  bonus={ranking.bonusAwarded}
                />
              ))
            )}
          </View>
        )}

        {/* Reach Rankings */}
        {!isLoading && activeTab === "reach" && (
          <View>
            <Text className="text-lg font-semibold text-foreground mb-4">
              Ranked by Total Reach
            </Text>
            {reachRankings.length === 0 ? (
              <Text className="text-muted text-center py-8">
                No rankings yet. Start submitting content!
              </Text>
            ) : (
              reachRankings.map((ranking) => (
                <RankingCard
                  key={ranking.userId}
                  rank={ranking.rank}
                  name={ranking.userName}
                  value={ranking.totalReach}
                  unit="reach"
                  bonus={ranking.bonusAwarded}
                />
              ))
            )}
          </View>
        )}

        {/* Stats Summary */}
        {!isLoading && (
          <View className="mt-8 pt-6 border-t border-border">
            <Text className="text-sm font-semibold text-muted uppercase mb-3">
              Monthly Bonus Info
            </Text>
            <View className="bg-blue-50 p-4 rounded-lg">
              <Text className="text-sm text-foreground leading-relaxed">
                🏆 Top performer in each category wins £50 monthly bonus
              </Text>
              <Text className="text-sm text-muted mt-2">
                Quality: Based on average star rating from Tobe
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                Reach: Based on total engagement (likes, shares, reach)
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
