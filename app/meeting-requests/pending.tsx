import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function PendingRequestsScreen() {
  const colors = useColors();
  
  const { data: requests, isLoading, refetch } = trpc.meetingRequests.getPendingRequests.useQuery();
  const approveMutation = trpc.meetingRequests.approveMeetingRequest.useMutation();
  const rejectMutation = trpc.meetingRequests.rejectMeetingRequest.useMutation();

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (requestId: number) => {
    // For simplicity, using default project and session type
    // In production, you'd want to show a modal to select these
    try {
      await approveMutation.mutateAsync({
        requestId,
        projectId: 1, // Default project
        sessionTypeId: 1, // Default session type
      });
      await refetch();
    } catch (error) {
      console.error("Failed to approve request:", error);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectMutation.mutateAsync({
        requestId,
        reason: rejectionReason.trim() || undefined,
      });
      setRejectingId(null);
      setRejectionReason("");
      await refetch();
    } catch (error) {
      console.error("Failed to reject request:", error);
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
              Pending Requests
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              {requests?.length || 0} requests awaiting review
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {requests && requests.length > 0 ? (
            <View className="gap-4">
              {requests.map((request) => (
                <View 
                  key={request.id}
                  className="bg-surface rounded-xl p-4 border border-border"
                >
                  <View className="mb-3">
                    <Text className="text-base font-semibold text-foreground">
                      {request.title}
                    </Text>
                    {request.description && (
                      <Text className="text-sm text-muted mt-1 leading-relaxed">
                        {request.description}
                      </Text>
                    )}
                  </View>

                  <View className="gap-2 mb-3">
                    <View className="flex-row items-center gap-2">
                      <IconSymbol name="person.2.fill" size={14} color={colors.muted} />
                      <Text className="text-sm text-muted leading-relaxed">
                        Requested by {request.requestedByName}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <IconSymbol name="calendar" size={14} color={colors.muted} />
                      <Text className="text-sm text-muted leading-relaxed">
                        {new Date(request.requestedDate).toLocaleDateString()} at{" "}
                        {new Date(request.requestedDate).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <IconSymbol name="clock.fill" size={14} color={colors.muted} />
                      <Text className="text-sm text-muted leading-relaxed">
                        Duration: {request.durationMinutes} minutes
                      </Text>
                    </View>
                  </View>

                  {request.participants && request.participants.length > 0 && (
                    <View className="mb-3 pt-3 border-t border-border">
                      <Text className="text-sm font-semibold text-foreground mb-2">
                        Participants:
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {request.participants.map((participant) => (
                          <View 
                            key={participant.userId}
                            className="bg-primary/10 px-3 py-1 rounded-full"
                          >
                            <Text className="text-xs text-primary font-medium">
                              {participant.userName}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {rejectingId === request.id ? (
                    <View className="pt-3 border-t border-border">
                      <Text className="text-sm font-semibold text-foreground mb-2">
                        Rejection Reason (optional):
                      </Text>
                      <View className="bg-background rounded-lg p-3 border border-border mb-3">
                        <TextInput
                          value={rejectionReason}
                          onChangeText={setRejectionReason}
                          placeholder="Why is this request being rejected?"
                          placeholderTextColor={colors.muted}
                          className="text-sm text-foreground"
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => {
                            setRejectingId(null);
                            setRejectionReason("");
                          }}
                          className="flex-1 bg-surface rounded-lg py-3 items-center border border-border active:opacity-70"
                        >
                          <Text className="text-foreground font-semibold">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleReject(request.id)}
                          disabled={rejectMutation.isPending}
                          className="flex-1 bg-error rounded-lg py-3 items-center active:opacity-70"
                        >
                          {rejectMutation.isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text className="text-white font-semibold">Confirm Reject</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row gap-2 pt-3 border-t border-border">
                      <TouchableOpacity
                        onPress={() => handleApprove(request.id)}
                        disabled={approveMutation.isPending}
                        className="flex-1 bg-primary rounded-lg py-3 items-center active:opacity-70"
                      >
                        {approveMutation.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text className="text-white font-semibold">Approve</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setRejectingId(request.id)}
                        className="flex-1 bg-error/10 rounded-lg py-3 items-center border border-error active:opacity-70"
                      >
                        <Text className="text-error font-semibold">Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-4">
                <IconSymbol name="checkmark.circle.fill" size={40} color={colors.primary} />
              </View>
              <Text className="text-lg font-semibold text-foreground text-center">
                All Caught Up!
              </Text>
              <Text className="text-sm text-muted text-center mt-2">
                No pending meeting requests to review
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
