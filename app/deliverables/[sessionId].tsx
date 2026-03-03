import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function DeliverablesScreen() {
  const colors = useColors();
  const { sessionId } = useLocalSearchParams();
  const sessionIdNum = parseInt(sessionId as string);

  const { data: session } = (trpc.sessions as any).getSessionById.useQuery({ sessionId: sessionIdNum });
  const { data: completedDeliverables } = (trpc as any).deliverables.getSessionDeliverables.useQuery({
    sessionId: sessionIdNum,
  });

  const markComplete = (trpc as any).deliverables.markDeliverableComplete.useMutation();
  const utils = trpc.useContext();

  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (completedDeliverables) {
      setLocalCompleted(new Set(completedDeliverables.map((d) => d.deliverableType)));
    }
  }, [completedDeliverables]);

  const deliverableTypes = [
    { type: "register", label: "Register", icon: "📋", description: "Attendance register completed" },
    { type: "evaluation_forms", label: "Evaluation Forms", icon: "📝", description: "Participant evaluation forms collected" },
    { type: "photos", label: "Photos", icon: "📸", description: "Session photos uploaded" },
    { type: "videos", label: "Videos", icon: "🎥", description: "Session videos uploaded" },
    { type: "team_feedback", label: "Team Feedback", icon: "💬", description: "Team member feedback submitted" },
  ];

  const requiredDeliverables = session?.requiredDeliverables
    ? JSON.parse(session.requiredDeliverables as string)
    : [];

  const handleToggleDeliverable = async (type: string) => {
    const isCompleted = localCompleted.has(type);

    if (isCompleted) {
      Alert.alert(
        "Remove Completion",
        "Are you sure you want to mark this deliverable as incomplete?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes",
            onPress: async () => {
              try {
                // In a real implementation, you'd have an API to remove completion
                const newSet = new Set(localCompleted);
                newSet.delete(type);
                setLocalCompleted(newSet);
                Alert.alert("Success", "Deliverable marked as incomplete");
              } catch (error) {
                Alert.alert("Error", "Failed to update deliverable status");
              }
            },
          },
        ]
      );
    } else {
      try {
        await markComplete.mutateAsync({
          sessionId: sessionIdNum,
          deliverableType: type,
        });

        const newSet = new Set(localCompleted);
        newSet.add(type);
        setLocalCompleted(newSet);

        (utils as any).deliverables.getSessionDeliverables.invalidate({ sessionId: sessionIdNum });
        Alert.alert("Success", "Deliverable marked as complete");
      } catch (error) {
        Alert.alert("Error", "Failed to mark deliverable as complete");
        console.error(error);
      }
    }
  };

  const completionPercentage =
    requiredDeliverables.length > 0
      ? Math.round((localCompleted.size / requiredDeliverables.length) * 100)
      : 100;

  const canSubmitInvoice = requiredDeliverables.length === 0 || completionPercentage === 100;

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
            <Text className="text-2xl font-bold text-foreground">Deliverables</Text>
          </View>
          <Text className="text-base text-muted">
            Track required items for this session
          </Text>
        </View>

        {/* Session Info */}
        {session && (
          <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-1">
              {session.title}
            </Text>
            <Text className="text-sm text-muted leading-relaxed">
              {new Date(session.date).toLocaleDateString()} at {session.venue}
            </Text>
          </View>
        )}

        {/* Progress Card */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-foreground">Completion Progress</Text>
            <Text
              className="text-2xl font-bold"
              style={{
                color: completionPercentage === 100 ? "#22C55E" : colors.primary,
              }}
            >
              {completionPercentage}%
            </Text>
          </View>

          <View className="h-3 bg-background rounded-full overflow-hidden mb-3">
            <View
              className="h-full rounded-full"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: completionPercentage === 100 ? "#22C55E" : colors.primary,
              }}
            />
          </View>

          <Text className="text-sm text-muted leading-relaxed">
            {localCompleted.size} of {requiredDeliverables.length} deliverables completed
          </Text>

          {!canSubmitInvoice && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-sm font-semibold text-warning">
                ⚠️ Complete all deliverables before submitting invoice
              </Text>
            </View>
          )}

          {canSubmitInvoice && requiredDeliverables.length > 0 && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-sm font-semibold text-success">
                ✅ All deliverables complete! You can now submit your invoice.
              </Text>
            </View>
          )}
        </View>

        {/* Deliverables List */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">Required Deliverables</Text>

          {requiredDeliverables.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 items-center border border-border">
              <Text className="text-base font-semibold text-foreground mb-2">
                No Deliverables Required
              </Text>
              <Text className="text-sm text-muted text-center">
                This session has no required deliverables. You can submit your invoice immediately.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {deliverableTypes
                .filter((d) => requiredDeliverables.includes(d.type))
                .map((deliverable) => {
                  const isCompleted = localCompleted.has(deliverable.type);

                  return (
                    <Pressable
                      key={deliverable.type}
                      onPress={() => handleToggleDeliverable(deliverable.type)}
                      className={`bg-surface rounded-xl p-4 border ${
                        isCompleted ? "border-success" : "border-border"
                      }`}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 mr-3">
                          <Text className="text-3xl mr-3">{deliverable.icon}</Text>
                          <View className="flex-1">
                            <Text className="text-base font-semibold text-foreground">
                              {deliverable.label}
                            </Text>
                            <Text className="text-sm text-muted leading-relaxed">
                              {deliverable.description}
                            </Text>
                          </View>
                        </View>

                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center ${
                            isCompleted ? "bg-success" : "bg-surface border-2 border-border"
                          }`}
                        >
                          {isCompleted && (
                            <Text className="text-background font-bold">✓</Text>
                          )}
                        </View>
                      </View>

                      {isCompleted && completedDeliverables && (
                        <View className="mt-3 pt-3 border-t border-border">
                          <Text className="text-xs text-success">
                            Completed:{" "}
                            {new Date(
                              completedDeliverables.find(
                                (d) => d.deliverableType === deliverable.type
                              )?.completedAt || ""
                            ).toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {requiredDeliverables.length > 0 && (
          <View className="gap-3 mb-4">
            {deliverableTypes
              .filter((d) => requiredDeliverables.includes(d.type))
              .map((deliverable) => {
                if (deliverable.type === "team_feedback" && !localCompleted.has("team_feedback")) {
                  return (
                    <Pressable
                      key="feedback-button"
                      onPress={() => router.push(`/feedback/submit/${sessionIdNum}`)}
                      className="bg-primary rounded-xl p-4"
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-background font-bold text-center text-base">
                        Submit Team Feedback
                      </Text>
                    </Pressable>
                  );
                }
                return null;
              })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
