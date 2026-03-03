import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function TeamRankingScreen() {
  const colors = useColors();
  
  const { data: teamMembers, isLoading, refetch } = (trpc.teamRanking as any).getAllTeamRanks.useQuery();
  const { data: stats } = (trpc.teamRanking as any).getRankStatistics.useQuery();
  const updateRankMutation = (trpc.teamRanking as any).updateRank.useMutation();

  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const rankOptions = [
    { value: "probationary" as const, label: "Probationary", color: "#EF4444", icon: "⚠️" },
    { value: "standard" as const, label: "Standard", color: colors.muted, icon: "👤" },
    { value: "high_performer" as const, label: "High Performer", color: "#8B5CF6", icon: "⭐" },
    { value: "trusted" as const, label: "Trusted", color: "#10B981", icon: "✅" },
  ];

  const getRankInfo = (ranking: string) => {
    return rankOptions.find(r => r.value === ranking) || rankOptions[1];
  };

  const handleUpdateRank = async (userId: number, ranking: "probationary" | "standard" | "high_performer" | "trusted") => {
    try {
      await updateRankMutation.mutateAsync({ userId, ranking });
      setEditingUserId(null);
      await refetch();
    } catch (error) {
      console.error("Failed to update rank:", error);
    }
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
              Team Rankings
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              Manage team member performance ranks
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1">
          {/* Statistics */}
          {stats && (
            <View className="p-4">
              <Text className="text-base font-semibold text-foreground mb-3">
                Rank Distribution
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {rankOptions.map((rank) => {
                  const count = stats[rank.value] || 0;
                  const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <View 
                      key={rank.value}
                      className="bg-surface rounded-xl p-3 border border-border"
                      style={{ width: "48%" }}
                    >
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-lg">{rank.icon}</Text>
                        <Text className="text-sm font-semibold text-foreground">
                          {rank.label}
                        </Text>
                      </View>
                      <Text className="text-2xl font-bold text-foreground">
                        {count}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">
                        {percentage}% of team
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Team Members */}
          <View className="px-4 pb-4">
            <Text className="text-base font-semibold text-foreground mb-3">
              Team Members ({teamMembers?.length || 0})
            </Text>
            
            {teamMembers && teamMembers.length > 0 ? (
              <View className="gap-3">
                {teamMembers.map((member) => {
                  const rankInfo = getRankInfo(member.ranking);
                  const isEditing = editingUserId === member.id;
                  
                  return (
                    <View 
                      key={member.id}
                      className="bg-surface rounded-xl p-4 border border-border"
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">
                            {member.name}
                          </Text>
                          <Text className="text-sm text-muted mt-0.5">
                            {member.email}
                          </Text>
                          <View className="mt-2">
                            <View 
                              className="px-3 py-1 rounded-full self-start"
                              style={{ backgroundColor: `${rankInfo.color}20` }}
                            >
                              <Text 
                                className="text-xs font-semibold"
                                style={{ color: rankInfo.color }}
                              >
                                {rankInfo.icon} {rankInfo.label}
                              </Text>
                            </View>
                          </View>
                        </View>
                        
                        {!isEditing && (
                          <TouchableOpacity
                            onPress={() => setEditingUserId(member.id)}
                            className="bg-primary/10 px-3 py-2 rounded-lg active:opacity-70"
                          >
                            <Text className="text-primary font-semibold text-sm">
                              Change
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {isEditing && (
                        <View className="mt-3 pt-3 border-t border-border">
                          <Text className="text-sm font-semibold text-foreground mb-2">
                            Select New Rank:
                          </Text>
                          <View className="gap-2">
                            {rankOptions.map((rank) => (
                              <TouchableOpacity
                                key={rank.value}
                                onPress={() => handleUpdateRank(member.id, rank.value)}
                                disabled={updateRankMutation.isPending}
                                className="flex-row items-center justify-between p-3 rounded-lg border border-border active:opacity-70"
                                style={{
                                  backgroundColor: member.ranking === rank.value ? `${rank.color}10` : "transparent",
                                  borderColor: member.ranking === rank.value ? rank.color : colors.border,
                                }}
                              >
                                <View className="flex-row items-center gap-2">
                                  <Text className="text-lg">{rank.icon}</Text>
                                  <Text 
                                    className="text-sm font-semibold"
                                    style={{ 
                                      color: member.ranking === rank.value ? rank.color : colors.foreground 
                                    }}
                                  >
                                    {rank.label}
                                  </Text>
                                </View>
                                {member.ranking === rank.value && (
                                  <IconSymbol name="checkmark.circle.fill" size={20} color={rank.color} />
                                )}
                              </TouchableOpacity>
                            ))}
                          </View>
                          <TouchableOpacity
                            onPress={() => setEditingUserId(null)}
                            className="mt-2 bg-surface rounded-lg py-2 items-center border border-border active:opacity-70"
                          >
                            <Text className="text-foreground font-semibold text-sm">
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="bg-surface rounded-xl p-8 items-center border border-border">
                <Text className="text-sm text-muted leading-relaxed">No team members found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
