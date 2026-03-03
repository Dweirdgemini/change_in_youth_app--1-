import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function MeetingRequestDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: request, isLoading } = trpc.meetingRequests.getRequestDetails.useQuery(
    { requestId: Number(id) },
    { enabled: !!id }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#10B981";
      case "pending": return colors.primary;
      case "rejected": return "#EF4444";
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

  if (!request) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-base text-muted">Request not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-center gap-3">
            
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Meeting Request</Text>
              <Text className="text-sm text-muted mt-0.5">Request details</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 p-6">
          {/* Status Badge */}
          <View className="mb-4">
            <View 
              className="self-start px-4 py-2 rounded-full"
              style={{ backgroundColor: `${getStatusColor(request.status)}20` }}
            >
              <Text 
                className="text-sm font-semibold capitalize"
                style={{ color: getStatusColor(request.status) }}
              >
                {request.status}
              </Text>
            </View>
          </View>

          {/* Title */}
          <View className="mb-4">
            <Text className="text-xs text-muted leading-relaxed uppercase mb-2">Title</Text>
            <Text className="text-xl font-bold text-foreground">{request.title}</Text>
          </View>

          {/* Description */}
          {request.description && (
            <View className="mb-4">
              <Text className="text-xs text-muted leading-relaxed uppercase mb-2">Description</Text>
              <Text className="text-base text-foreground">{request.description}</Text>
            </View>
          )}

          {/* Date & Duration */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
              <Text className="text-xs text-muted leading-relaxed uppercase mb-2">Date</Text>
              <Text className="text-base font-semibold text-foreground">
                {new Date(request.requestedDate).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
              <Text className="text-xs text-muted leading-relaxed uppercase mb-2">Duration</Text>
              <Text className="text-base font-semibold text-foreground">
                {request.durationMinutes} mins
              </Text>
            </View>
          </View>

          {/* Requested By */}
          <View className="mb-4">
            <Text className="text-xs text-muted leading-relaxed uppercase mb-2">Requested By</Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground">
                {request.requestedByName}
              </Text>
            </View>
          </View>

          {/* Participants */}
          {request.participants && request.participants.length > 0 && (
            <View className="mb-4">
              <Text className="text-xs text-muted leading-relaxed uppercase mb-2">
                Participants ({request.participants.length})
              </Text>
              <View className="gap-2">
                {request.participants.map((participant, index) => (
                  <View 
                    key={index}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    <Text className="text-base font-semibold text-foreground">
                      {participant.name}
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      {participant.email}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Admin Notes (for rejected requests) */}
          {request.status === "rejected" && request.adminNotes && (
            <View className="mb-4">
              <Text className="text-xs text-muted leading-relaxed uppercase mb-2">Rejection Reason</Text>
              <View className="bg-error/10 rounded-xl p-4 border border-error/20">
                <Text className="text-base text-foreground">{request.adminNotes}</Text>
              </View>
            </View>
          )}

          {/* Reviewed Info */}
          {request.reviewedAt && (
            <View className="mb-4">
              <Text className="text-xs text-muted leading-relaxed uppercase mb-2">
                {request.status === "approved" ? "Approved" : "Reviewed"}
              </Text>
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-sm text-muted leading-relaxed">
                  {new Date(request.reviewedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Session ID (for approved requests) */}
          {request.status === "approved" && request.sessionId && (
            <View className="mb-4">
              <Text className="text-xs text-muted leading-relaxed uppercase mb-2">Session Created</Text>
              <View className="bg-success/10 rounded-xl p-4 border border-success/20">
                <Text className="text-base font-semibold text-foreground">
                  Session #{request.sessionId}
                </Text>
                <Text className="text-sm text-muted mt-1">
                  This meeting has been scheduled
                </Text>
              </View>
            </View>
          )}

          {/* Created At */}
          <View className="mb-4">
            <Text className="text-xs text-muted leading-relaxed uppercase mb-2">Created</Text>
            <Text className="text-sm text-muted leading-relaxed">
              {new Date(request.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
