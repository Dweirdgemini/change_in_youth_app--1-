import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Alert, ScrollView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/contexts/auth-context";
import { router } from "expo-router";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function SessionRequestsScreen() {
  const { user, isAuthenticated, loading } = useAuthContext();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  // Fetch pending session requests
  const { data: requests, isLoading: requestsLoading, refetch } = trpc.sessions.getPendingRequests.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "finance"),
  });
  
  const approveSessionMutation = trpc.sessions.approveSession.useMutation();
  const rejectSessionMutation = trpc.sessions.rejectSession.useMutation();

  if (loading || requestsLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Sign in to view requests
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-background font-semibold text-lg">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (user?.role !== "admin" && user?.role !== "finance") {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-6xl mb-4">🔒</Text>
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Admin Access Required
          </Text>
          <Text className="text-base text-muted text-center leading-relaxed">
            Only admins can review session requests
          </Text>
          
        </View>
      </ScreenContainer>
    );
  }

  const handleApprove = async (requestId: number) => {
    const confirmApprove = () => {
      approveSessionMutation.mutate(
        { sessionId: requestId },
        {
          onSuccess: () => {
            refetch();
            setSelectedRequest(null);
            if (Platform.OS === 'web') {
              alert("✅ Session approved and added to schedule!");
            } else {
              Alert.alert("Success", "Session approved and added to schedule!");
            }
          },
          onError: (error) => {
            console.error('Failed to approve session:', error);
            if (Platform.OS === 'web') {
              alert("Failed to approve session. Please try again.");
            } else {
              Alert.alert("Error", "Failed to approve session. Please try again.");
            }
          },
        }
      );
    };

    if (Platform.OS === 'web') {
      if (confirm("Are you sure you want to approve this session request?")) {
        confirmApprove();
      }
    } else {
      Alert.alert(
        "Approve Session",
        "Are you sure you want to approve this session request?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Approve", onPress: confirmApprove },
        ]
      );
    }
  };

  const handleReject = async (requestId: number) => {
    const confirmReject = () => {
      rejectSessionMutation.mutate(
        { sessionId: requestId },
        {
          onSuccess: () => {
            refetch();
            setSelectedRequest(null);
            if (Platform.OS === 'web') {
              alert("Session request has been rejected.");
            } else {
              Alert.alert("Rejected", "Session request has been rejected.");
            }
          },
          onError: (error) => {
            console.error('Failed to reject session:', error);
            if (Platform.OS === 'web') {
              alert("Failed to reject session. Please try again.");
            } else {
              Alert.alert("Error", "Failed to reject session. Please try again.");
            }
          },
        }
      );
    };

    if (Platform.OS === 'web') {
      if (confirm("Are you sure you want to reject this session request?")) {
        confirmReject();
      }
    } else {
      Alert.alert(
        "Reject Session",
        "Are you sure you want to reject this session request?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reject", style: "destructive", onPress: confirmReject },
        ]
      );
    }
  };

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (selectedRequest) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="p-6 gap-4">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                <Text className="text-primary text-lg">← Back</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-foreground">Review Request</Text>
              <View style={{ width: 60 }} />
            </View>

            {/* Request Details */}
            <View className="bg-surface rounded-2xl p-4 border border-border gap-4">
              <View>
                <Text className="text-sm text-muted mb-1">Session Title</Text>
                <Text className="text-lg font-semibold text-foreground">{selectedRequest.title}</Text>
              </View>

              <View>
                <Text className="text-sm text-muted mb-1">Project</Text>
                <Text className="text-base text-foreground">{selectedRequest.projectName}</Text>
              </View>

              <View>
                <Text className="text-sm text-muted mb-1">Venue</Text>
                <Text className="text-base text-foreground">{selectedRequest.venue}</Text>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-1">Date</Text>
                  <Text className="text-base text-foreground">
                    {new Date(selectedRequest.startTime).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-1">Time</Text>
                  <Text className="text-base text-foreground">
                    {new Date(selectedRequest.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedRequest.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              {selectedRequest.description && (
                <View>
                  <Text className="text-sm text-muted mb-1">Description</Text>
                  <Text className="text-base text-foreground">{selectedRequest.description}</Text>
                </View>
              )}

              <View>
                <Text className="text-sm text-muted mb-1">Payment per Facilitator</Text>
                <Text className="text-base text-foreground">£{selectedRequest.paymentPerFacilitator}</Text>
              </View>

              <View className="border-t border-border pt-4">
                <Text className="text-sm text-muted mb-1">Requested By</Text>
                <Text className="text-base text-foreground">{selectedRequest.requestedByName}</Text>
                <Text className="text-xs text-muted leading-relaxed mt-1">{getTimeAgo(selectedRequest.createdAt)}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                className="bg-success px-6 py-4 rounded-full active:opacity-80"
                onPress={() => handleApprove(selectedRequest.id)}
                disabled={approveSessionMutation.isPending}
              >
                <Text className="text-background font-semibold text-lg text-center">
                  {approveSessionMutation.isPending ? "Approving..." : "✓ Approve Session"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-error px-6 py-4 rounded-full active:opacity-80"
                onPress={() => handleReject(selectedRequest.id)}
                disabled={rejectSessionMutation.isPending}
              >
                <Text className="text-background font-semibold text-lg text-center">
                  {rejectSessionMutation.isPending ? "Rejecting..." : "✗ Reject Request"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const pendingRequests = requests || [];

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            
            <View style={{ width: 60 }} />
          </View>
          <Text className="text-2xl font-bold text-foreground">Session Requests</Text>
          <Text className="text-base text-muted mt-1">
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Content */}
        {pendingRequests.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-6xl mb-4">✅</Text>
            <Text className="text-xl font-semibold text-foreground text-center">
              All Caught Up!
            </Text>
            <Text className="text-base text-muted text-center mt-2">
              No pending session requests to review
            </Text>
          </View>
        ) : (
          <FlatList
            data={pendingRequests}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-surface rounded-2xl p-4 border border-primary/30 active:opacity-70"
                onPress={() => setSelectedRequest(item)}
              >
                <View className="flex-row items-start gap-3">
                  <View className="bg-primary/10 w-10 h-10 rounded-full items-center justify-center">
                    <Text className="text-primary text-xl">📅</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{item.title}</Text>
                    <Text className="text-sm text-muted mt-1">{item.projectName}</Text>
                    <View className="flex-row items-center gap-4 mt-2">
                      <Text className="text-xs text-muted leading-relaxed">
                        📍 {item.venue.split(",")[0]}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">
                        🕐 {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2 mt-2">
                      <View className="bg-primary/10 px-2 py-1 rounded">
                        <Text className="text-primary text-xs font-medium">
                          {item.requestedByName}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted leading-relaxed">{getTimeAgo(item.createdAt)}</Text>
                    </View>
                  </View>
                  <Text className="text-primary text-xl">→</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
