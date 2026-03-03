import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function ExportChatScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const channelId = parseInt(id || "0");
  
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  const summarizeMutation = trpc.teamChats.summarizeConversation.useMutation();
  const exportQuery = trpc.teamChats.exportChannelHistory.useQuery({ channelId });

  const handleSummarize = async (range: "week" | "month" | "all") => {
    const now = new Date();
    let from: Date | undefined;
    
    if (range === "week") {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "month") {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    try {
      await summarizeMutation.mutateAsync({
        channelId,
        dateFrom: from,
        dateTo: now,
      });
    } catch (error) {
      console.error("Failed to generate summary:", error);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border flex-row items-center gap-3">
          
          <Text className="text-lg font-bold text-foreground flex-1">
            Export & Summarize
          </Text>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* AI Summarization */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-foreground mb-3">
              AI Conversation Summary
            </Text>
            <Text className="text-sm text-muted mb-4">
              Generate an AI-powered summary of team conversations for reports and documentation
            </Text>
            
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => handleSummarize("week")}
                disabled={summarizeMutation.isPending}
                className="bg-surface rounded-xl p-4 border border-border active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      Last 7 Days
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      Summarize conversations from the past week
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSummarize("month")}
                disabled={summarizeMutation.isPending}
                className="bg-surface rounded-xl p-4 border border-border active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      Last 30 Days
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      Summarize conversations from the past month
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSummarize("all")}
                disabled={summarizeMutation.isPending}
                className="bg-surface rounded-xl p-4 border border-border active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      All Time
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      Summarize all conversations in this channel
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>
            </View>

            {summarizeMutation.isPending && (
              <View className="mt-4 bg-primary/10 rounded-xl p-4 flex-row items-center gap-3">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-sm text-primary font-medium">
                  Generating AI summary...
                </Text>
              </View>
            )}

            {summarizeMutation.data && (
              <View className="mt-4 bg-surface rounded-xl p-4 border border-border">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Summary Generated
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  {summarizeMutation.data.summary}
                </Text>
                
                {summarizeMutation.data.keyPoints && summarizeMutation.data.keyPoints.length > 0 && (
                  <View className="mt-4">
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      Key Points:
                    </Text>
                    {summarizeMutation.data.keyPoints.map((point, index) => (
                      <Text key={index} className="text-sm text-muted leading-relaxed mb-1">
                        • {point}
                      </Text>
                    ))}
                  </View>
                )}

                {summarizeMutation.data.actionItems && summarizeMutation.data.actionItems.length > 0 && (
                  <View className="mt-4">
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      Action Items:
                    </Text>
                    {summarizeMutation.data.actionItems.map((item, index) => (
                      <Text key={index} className="text-sm text-muted leading-relaxed mb-1">
                        • {item}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Export Full History */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              Export Full History
            </Text>
            <Text className="text-sm text-muted mb-4">
              Download complete chat history for documentation and records
            </Text>

            {exportQuery.isLoading ? (
              <View className="bg-surface rounded-xl p-6 items-center border border-border">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-sm text-muted mt-2">Loading history...</Text>
              </View>
            ) : exportQuery.data ? (
              <View className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base font-semibold text-foreground">
                    {exportQuery.data.channelName}
                  </Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    {exportQuery.data.messageCount} messages
                  </Text>
                </View>
                
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-sm text-muted leading-relaxed">
                    {exportQuery.data.dateRange.from} - {exportQuery.data.dateRange.to}
                  </Text>
                </View>

                <TouchableOpacity
                  className="bg-primary rounded-lg py-3 items-center active:opacity-70"
                >
                  <Text className="text-white font-semibold">
                    Download as Text File
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-surface rounded-xl p-6 items-center border border-border">
                <Text className="text-sm text-muted leading-relaxed">No messages to export</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
