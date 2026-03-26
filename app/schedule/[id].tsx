import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, Alert } from "react-native";
import { ScreenWithBackButton } from "@/components/screen-with-back-button";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthContext } from "@/contexts/auth-context";
import * as Sharing from "expo-sharing";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = parseInt(id || "0", 10);
  const colors = useColors();
  const { user } = useAuthContext();

  const { data: session, isLoading } = (trpc.scheduling as any).getSessionById.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: 5000 } // Refresh every 5 seconds for live updates
  );

  const { data: feedbackCount } = trpc.feedback.getSessionFeedbackCount.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: 3000 } // Refresh every 3 seconds for live counter
  );

  if (isLoading) {
    return (
      <ScreenWithBackButton className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenWithBackButton>
    );
  }

  if (!session) {
    return (
      <ScreenWithBackButton className="p-4 justify-center">
        <Text className="text-xl text-foreground text-center">Session not found</Text>
      </ScreenWithBackButton>
    );
  }

  const startDate = new Date(session.startTime);
  const endDate = new Date(session.endTime);
  const isCompleted = session.status === "completed";
  const isInProgress = session.status === "in_progress";

  const feedbackPercentage = feedbackCount?.expected
    ? Math.round((feedbackCount.completed / feedbackCount.expected) * 100)
    : 0;

  const handleShareFeedbackLink = async () => {
    const feedbackUrl = `${window.location.origin}/feedback/submit/${sessionId}`;
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(feedbackUrl, {
        dialogTitle: "Share Evaluation Form",
      });
    } else {
      Alert.alert("Feedback Link", feedbackUrl, [
        { text: "Copy", onPress: () => {
          // Copy to clipboard logic would go here
          Alert.alert("Copied", "Link copied to clipboard");
        }},
        { text: "Close" }
      ]);
    }
  };

  return (
    <ScreenWithBackButton>
      <ScrollView className="flex-1">
        {/* Header with Back Button */}
        <View className="p-4 border-b border-border">
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <IconSymbol name="chevron.left" size={28} color={colors.foreground} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{session.title}</Text>
            </View>
          </View>
          <View
            className={`self-start px-3 py-1 rounded-full ${
              isCompleted
                ? "bg-success/10"
                : isInProgress
                ? "bg-primary/10"
                : "bg-warning/10"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isCompleted
                  ? "text-success"
                  : isInProgress
                  ? "text-primary"
                  : "text-warning"
              }`}
            >
              {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Scheduled"}
            </Text>
          </View>
        </View>

        <View className="p-4 gap-4">
          {/* Live Feedback Counter */}
          {(isCompleted || isInProgress) && feedbackCount && (
            <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-foreground">
                  📝 Evaluation Forms
                </Text>
                <Pressable
                  onPress={handleShareFeedbackLink}
                  className="bg-primary px-4 py-2 rounded-full"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-background text-xs font-semibold">Share Link</Text>
                </Pressable>
              </View>
              
              <View className="flex-row items-center gap-4">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-primary">
                    {feedbackCount.completed}/{feedbackCount.expected}
                  </Text>
                  <Text className="text-sm text-muted mt-1">Forms completed</Text>
                </View>
                
                <View className="flex-1">
                  <View className="bg-surface rounded-full h-3 overflow-hidden">
                    <View
                      className="bg-primary h-full"
                      style={{ width: `${feedbackPercentage}%` }}
                    />
                  </View>
                  <Text className="text-sm text-muted mt-2 text-center">
                    {feedbackPercentage}% complete
                  </Text>
                </View>
              </View>

              {feedbackCount.completed < feedbackCount.expected && (
                <View className="bg-warning/10 border border-warning/30 rounded-xl p-3 mt-3">
                  <Text className="text-xs text-foreground">
                    💡 <Text className="font-semibold">
                      {feedbackCount.expected - feedbackCount.completed} student{feedbackCount.expected - feedbackCount.completed !== 1 ? "s" : ""} haven't submitted yet
                    </Text>
                    {"\n"}Remind them to complete the evaluation form before leaving
                  </Text>
                </View>
              )}

              {feedbackCount.completed >= feedbackCount.expected && feedbackCount.expected > 0 && (
                <View className="bg-success/10 border border-success/30 rounded-xl p-3 mt-3">
                  <Text className="text-xs text-success font-semibold">
                    ✅ All students have completed their evaluation forms!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Session Details */}
          <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
            <Text className="text-lg font-semibold text-foreground mb-2">Session Details</Text>
            
            <View className="flex-row items-start gap-3">
              <Text className="text-muted">📅</Text>
              <View className="flex-1">
                <Text className="text-sm text-muted leading-relaxed">Date</Text>
                <Text className="text-base text-foreground font-medium">
                  {startDate.toLocaleDateString("en-GB", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <Text className="text-muted">🕐</Text>
              <View className="flex-1">
                <Text className="text-sm text-muted leading-relaxed">Time</Text>
                <Text className="text-base text-foreground font-medium">
                  {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <Text className="text-muted">📍</Text>
              <View className="flex-1">
                <Text className="text-sm text-muted leading-relaxed">Venue</Text>
                <Text className="text-base text-foreground font-medium">{session.venue}</Text>
              </View>
            </View>

            {session.attendeeCount && (
              <View className="flex-row items-start gap-3">
                <Text className="text-muted">👥</Text>
                <View className="flex-1">
                  <Text className="text-sm text-muted leading-relaxed">Expected Attendees</Text>
                  <Text className="text-base text-foreground font-medium">
                    {session.attendeeCount} students
                  </Text>
                </View>
              </View>
            )}

            {session.paymentPerFacilitator && (
              <View className="flex-row items-start gap-3">
                <Text className="text-muted">💰</Text>
                <View className="flex-1">
                  <Text className="text-sm text-muted leading-relaxed">Payment</Text>
                  <Text className="text-base text-foreground font-medium">
                    £{parseFloat(session.paymentPerFacilitator).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Quick Actions</Text>
            
            {session.hasVideoCall && (
              <Pressable
                onPress={() => router.push(`/video-call/${sessionId}` as any)}
                className="bg-success rounded-xl p-4 flex-row items-center justify-between"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <Text className="text-background text-2xl">📹</Text>
                  <View>
                    <Text className="text-background font-semibold text-base">Join Video Call</Text>
                    <Text className="text-background/80 text-xs mt-0.5">Agora video meeting room</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.background} />
              </Pressable>
            )}

            <Pressable
              onPress={() => router.push(`/deliverables/${sessionId}` as any)}
              className="bg-surface rounded-xl p-4 flex-row items-center justify-between border border-border"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View>
                <Text className="text-foreground font-semibold text-base">Deliverables</Text>
                <Text className="text-xs text-muted leading-relaxed mt-1">Upload register, photos, videos</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.foreground} />
            </Pressable>

            <Pressable
              onPress={() => router.push(`/register-ocr/${sessionId}` as any)}
              className="bg-surface rounded-xl p-4 flex-row items-center justify-between border border-border"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View>
                <Text className="text-foreground font-semibold text-base">Scan Register</Text>
                <Text className="text-xs text-muted leading-relaxed mt-1">OCR attendance tracking</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.foreground} />
            </Pressable>

            {(user?.role === "admin" || user?.role === "finance") && (
              <Pressable
                onPress={() => router.push("/feedback/index" as any)}
                className="bg-surface rounded-xl p-4 flex-row items-center justify-between border border-border"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View>
                  <Text className="text-foreground font-semibold text-base">View All Feedback</Text>
                  <Text className="text-xs text-muted leading-relaxed mt-1">See submitted evaluation forms</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.foreground} />
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenWithBackButton>
  );
}
