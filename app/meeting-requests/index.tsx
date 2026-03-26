import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuthContext } from "@/contexts/auth-context";

export default function MeetingRequestsScreen() {
  const colors = useColors();
  const { user } = useAuthContext();
  
  const { data: myRequests, isLoading: loadingMy } = trpc.meetingRequests.getMyRequests.useQuery();
  const { data: involvingMe, isLoading: loadingInvolving } = trpc.meetingRequests.getRequestsInvolvingMe.useQuery();

  const isAdmin = user?.role === "admin" || user?.role === "finance";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#10B981";
      case "pending": return colors.primary;
      case "rejected": return "#EF4444";
      default: return colors.muted;
    }
  };

  const isLoading = loadingMy || loadingInvolving;

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
        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              
              <View>
                <Text className="text-2xl font-bold text-foreground">Meeting Requests</Text>
                <Text className="text-sm text-muted mt-0.5">
                  Request meetings with colleagues
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => router.push("/meeting-requests/create" as any)}
              className="active:opacity-50"
            >
              <IconSymbol name="plus.circle.fill" size={32} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1">
          {isAdmin && (
            <View className="p-4 border-b border-border">
              <TouchableOpacity
                onPress={() => router.push("/meeting-requests/pending" as any)}
                className="bg-primary/10 rounded-xl p-4 border border-primary active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-primary">
                      Review Pending Requests
                    </Text>
                    <Text className="text-sm text-primary/70 mt-1">
                      Approve or reject meeting requests from team members
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* My Requests */}
          <View className="p-4">
            <Text className="text-lg font-bold text-foreground mb-3">
              My Requests
            </Text>
            
            {myRequests && myRequests.length > 0 ? (
              <View className="gap-3">
                {myRequests.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    onPress={() => router.push(`/meeting-requests/${request.id}` as any)}
                    className="bg-surface rounded-xl p-4 border border-border active:opacity-70"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {request.title}
                        </Text>
                        {request.description && (
                          <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                            {request.description}
                          </Text>
                        )}
                      </View>
                      <View 
                        className="px-2 py-1 rounded-md ml-2"
                        style={{ backgroundColor: `${getStatusColor(request.status)}20` }}
                      >
                        <Text 
                          className="text-xs font-semibold capitalize"
                          style={{ color: getStatusColor(request.status) }}
                        >
                          {request.status}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-4 mt-2">
                      <View className="flex-row items-center gap-1">
                        <IconSymbol name="calendar" size={14} color={colors.muted} />
                        <Text className="text-xs text-muted leading-relaxed">
                          {new Date(request.requestedDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <IconSymbol name="clock.fill" size={14} color={colors.muted} />
                        <Text className="text-xs text-muted leading-relaxed">
                          {request.durationMinutes} mins
                        </Text>
                      </View>
                    </View>

                    {request.status === "rejected" && request.adminNotes && (
                      <View className="mt-3 pt-3 border-t border-border">
                        <Text className="text-xs text-muted leading-relaxed">
                          Reason: {request.adminNotes}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-xl p-6 items-center border border-border">
                <Text className="text-sm text-muted leading-relaxed">No requests created yet</Text>
              </View>
            )}
          </View>

          {/* Requests Involving Me */}
          {involvingMe && involvingMe.length > 0 && (
            <View className="p-4 pt-0">
              <Text className="text-lg font-bold text-foreground mb-3">
                Requests Involving Me
              </Text>
              
              <View className="gap-3">
                {involvingMe.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    onPress={() => router.push(`/meeting-requests/${request.id}` as any)}
                    className="bg-surface rounded-xl p-4 border border-border active:opacity-70"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {request.title}
                        </Text>
                        <Text className="text-sm text-muted mt-1">
                          Requested by {request.requestedByName}
                        </Text>
                      </View>
                      <View 
                        className="px-2 py-1 rounded-md ml-2"
                        style={{ backgroundColor: `${getStatusColor(request.status)}20` }}
                      >
                        <Text 
                          className="text-xs font-semibold capitalize"
                          style={{ color: getStatusColor(request.status) }}
                        >
                          {request.status}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-4 mt-2">
                      <View className="flex-row items-center gap-1">
                        <IconSymbol name="calendar" size={14} color={colors.muted} />
                        <Text className="text-xs text-muted leading-relaxed">
                          {new Date(request.requestedDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <IconSymbol name="clock.fill" size={14} color={colors.muted} />
                        <Text className="text-xs text-muted leading-relaxed">
                          {request.durationMinutes} mins
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
