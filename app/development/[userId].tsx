import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuthContext } from "@/contexts/auth-context";

export default function PersonalDevelopmentScreen() {
  const colors = useColors();
  const { user } = useAuthContext();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const targetUserId = parseInt(userId || "0");
  
  const { data: records, isLoading, refetch } = trpc.personalDevelopment.getDevelopmentRecords.useQuery({ 
    userId: targetUserId 
  });
  
  const { data: summary } = trpc.personalDevelopment.getDevelopmentSummary.useQuery({ 
    userId: targetUserId 
  });

  const updateStatusMutation = trpc.personalDevelopment.updateRecordStatus.useMutation();

  const isAdmin = user?.role === "admin" || user?.role === "finance";

  const handleStatusUpdate = async (recordId: number, status: "not_started" | "in_progress" | "completed" | "cancelled") => {
    try {
      await updateStatusMutation.mutateAsync({ recordId, status });
      await refetch();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case "skill": return colors.primary;
      case "goal": return "#10B981";
      case "feedback": return "#F59E0B";
      case "milestone": return "#8B5CF6";
      case "training": return "#3B82F6";
      default: return colors.muted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#10B981";
      case "in_progress": return colors.primary;
      case "not_started": return colors.muted;
      case "cancelled": return "#EF4444";
      default: return colors.muted;
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
          
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">
              Personal Development
            </Text>
            {summary && (
              <Text className="text-xs text-muted leading-relaxed">
                {summary.totalRecords} records • {(summary as any).byStatus?.completed || 0} completed
              </Text>
            )}
          </View>
          {isAdmin && (
            <TouchableOpacity 
              onPress={() => router.push(`/development/${targetUserId}/add` as any)}
              className="active:opacity-50"
            >
              <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView className="flex-1">
          {/* Summary Cards */}
          {summary && (
            <View className="p-4">
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-2xl font-bold text-foreground">
                    {(summary as any).byStatus?.in_progress || 0}
                  </Text>
                  <Text className="text-sm text-muted mt-1">In Progress</Text>
                </View>
                <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-2xl font-bold text-foreground">
                    {(summary as any).byStatus?.completed || 0}
                  </Text>
                  <Text className="text-sm text-muted mt-1">Completed</Text>
                </View>
              </View>

              {/* Type Breakdown */}
              <View className="bg-surface rounded-xl p-4 border border-border mb-4">
                <Text className="text-base font-semibold text-foreground mb-3">
                  Development Areas
                </Text>
                <View className="gap-2">
                  {Object.entries(summary.byType).map(([type, count]) => (
                    <View key={type} className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getRecordTypeColor(type) }}
                        />
                        <Text className="text-sm text-foreground capitalize">{type}</Text>
                      </View>
                      <Text className="text-sm font-semibold text-foreground">{count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Development Records */}
          <View className="px-4 pb-4">
            <Text className="text-lg font-bold text-foreground mb-3">
              Development Timeline
            </Text>
            
            {records && records.length > 0 ? (
              <View className="gap-3">
                {records.map((record) => (
                  <View 
                    key={record.id}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <View 
                            className="px-2 py-1 rounded-md"
                            style={{ backgroundColor: `${getRecordTypeColor(record.recordType)}20` }}
                          >
                            <Text 
                              className="text-xs font-semibold capitalize"
                              style={{ color: getRecordTypeColor(record.recordType) }}
                            >
                              {record.recordType}
                            </Text>
                          </View>
                          <View 
                            className="px-2 py-1 rounded-md"
                            style={{ backgroundColor: `${getStatusColor((record as any).status)}20` }}
                          >
                            <Text 
                              className="text-xs font-semibold capitalize"
                              style={{ color: getStatusColor((record as any).status) }}
                            >
                              {((record as any).status || 'unknown').replace("_", " ")}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-base font-semibold text-foreground">
                          {record.title}
                        </Text>
                        {record.description && (
                          <Text className="text-sm text-muted mt-1 leading-relaxed">
                            {record.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-border">
                      <Text className="text-xs text-muted leading-relaxed">
                        Added {new Date(record.createdAt).toLocaleDateString()}
                      </Text>
                      {(record as any).targetDate && (
                        <Text className="text-xs text-muted leading-relaxed">
                          Target: {new Date((record as any).targetDate).toLocaleDateString()}
                        </Text>
                      )}
                      {record.createdByName && (
                        <Text className="text-xs text-muted leading-relaxed">
                          By {record.createdByName}
                        </Text>
                      )}
                    </View>

                    {isAdmin && (record as any).status !== "completed" && (record as any).status !== "cancelled" && (
                      <View className="flex-row gap-2 mt-3">
                        <TouchableOpacity
                          onPress={() => handleStatusUpdate(record.id, "completed")}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 bg-primary/10 rounded-lg py-2 items-center active:opacity-70"
                        >
                          <Text className="text-primary font-semibold text-sm">
                            Mark Complete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-xl p-8 items-center border border-border">
                <View className="w-16 h-16 rounded-full bg-muted/20 items-center justify-center mb-3">
                  <IconSymbol name="chart.bar.fill" size={32} color={colors.muted} />
                </View>
                <Text className="text-base font-semibold text-foreground text-center">
                  No Development Records
                </Text>
                <Text className="text-sm text-muted text-center mt-1">
                  {isAdmin 
                    ? "Add development goals, skills, and feedback for this team member"
                    : "Your development records will appear here"
                  }
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
