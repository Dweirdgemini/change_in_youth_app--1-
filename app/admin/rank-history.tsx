import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function RankHistoryScreen() {
  const colors = useColors();
  
  const { data: history, isLoading } = trpc.teamRanking.getRankHistory.useQuery({ userId: 0 });

  const rankOptions = {
    probationary: { label: "Probationary", color: "#EF4444", icon: "⚠️" },
    standard: { label: "Standard", color: colors.muted, icon: "👤" },
    high_performer: { label: "High Performer", color: "#8B5CF6", icon: "⭐" },
    trusted: { label: "Trusted", color: "#10B981", icon: "✅" },
  };

  const getRankInfo = (ranking: string | null) => {
    return rankOptions[ranking as keyof typeof rankOptions] || rankOptions.standard;
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="active:opacity-50">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">
              Ranking History
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              All rank changes timeline
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {history && history.length > 0 ? (
            <View className="gap-3">
              {history.map((entry, index) => {
                const oldRankInfo = getRankInfo(entry.oldRank);
                const newRankInfo = getRankInfo(entry.newRank);
                const isPromotion = entry.newRank && entry.oldRank && 
                  ["probationary", "standard", "high_performer", "trusted"].indexOf(entry.newRank) >
                  ["probationary", "standard", "high_performer", "trusted"].indexOf(entry.oldRank);
                
                return (
                  <View 
                    key={entry.id}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    {/* User and Date */}
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-base font-semibold text-foreground">
                        {entry.userName || `User #${entry.userId}`}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "Unknown date"}
                      </Text>
                    </View>

                    {/* Rank Change */}
                    <View className="flex-row items-center gap-3 mb-3">
                      {/* Old Rank */}
                      {entry.oldRank && (
                        <View 
                          className="px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: `${oldRankInfo.color}20` }}
                        >
                          <Text 
                            className="text-xs font-semibold"
                            style={{ color: oldRankInfo.color }}
                          >
                            {oldRankInfo.icon} {oldRankInfo.label}
                          </Text>
                        </View>
                      )}

                      {/* Arrow */}
                      <Text className="text-lg" style={{ color: isPromotion ? "#10B981" : "#EF4444" }}>
                        {isPromotion ? "→" : "↓"}
                      </Text>

                      {/* New Rank */}
                      <View 
                        className="px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: `${newRankInfo.color}20` }}
                      >
                        <Text 
                          className="text-xs font-semibold"
                          style={{ color: newRankInfo.color }}
                        >
                          {newRankInfo.icon} {newRankInfo.label}
                        </Text>
                      </View>
                    </View>

                    {/* Reason */}
                    {entry.reason && (
                      <View className="bg-background rounded-lg p-3 mb-2">
                        <Text className="text-xs text-muted leading-relaxed mb-1">Reason:</Text>
                        <Text className="text-sm text-foreground">
                          {entry.reason}
                        </Text>
                      </View>
                    )}

                    {/* Changed By */}
                    <View className="flex-row items-center gap-2 pt-2 border-t border-border">
                      <Text className="text-xs text-muted leading-relaxed">
                        Changed by admin
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-4">
                <Text className="text-3xl">📊</Text>
              </View>
              <Text className="text-lg font-semibold text-foreground">
                No History Yet
              </Text>
              <Text className="text-sm text-muted text-center mt-2">
                Rank changes will appear here
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
