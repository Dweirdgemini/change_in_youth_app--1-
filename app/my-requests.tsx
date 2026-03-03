import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function MyRequestsScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: requests, isLoading, refetch } = trpc.sessions.getMyRequests.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const cancelRequestMutation = trpc.sessions.cancelRequest.useMutation();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading || isLoading) {
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
            Sign in to view your requests
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

  const handleCancelRequest = (requestId: number) => {
    const confirmCancel = () => {
      cancelRequestMutation.mutate(
        { sessionId: requestId },
        {
          onSuccess: () => {
            refetch();
            if (Platform.OS === 'web') {
              alert("✅ Request canceled successfully!");
            } else {
              Alert.alert("Success", "Request canceled successfully!");
            }
          },
          onError: (error) => {
            console.error('Failed to cancel request:', error);
            if (Platform.OS === 'web') {
              alert("Failed to cancel request. Please try again.");
            } else {
              Alert.alert("Error", "Failed to cancel request. Please try again.");
            }
          },
        }
      );
    };

    if (Platform.OS === 'web') {
      if (confirm("Are you sure you want to cancel this request?")) {
        confirmCancel();
      }
    } else {
      Alert.alert(
        "Cancel Request",
        "Are you sure you want to cancel this request?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes, Cancel", style: "destructive", onPress: confirmCancel },
        ]
      );
    }
  };

  const getStatusBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case "pending":
        return <View className="bg-orange-500 px-3 py-1 rounded-full"><Text className="text-white text-xs font-semibold">Pending</Text></View>;
      case "approved":
        return <View className="bg-green-500 px-3 py-1 rounded-full"><Text className="text-white text-xs font-semibold">Approved</Text></View>;
      case "rejected":
        return <View className="bg-red-500 px-3 py-1 rounded-full"><Text className="text-white text-xs font-semibold">Rejected</Text></View>;
      default:
        return <View className="bg-gray-500 px-3 py-1 rounded-full"><Text className="text-white text-xs font-semibold">{approvalStatus}</Text></View>;
    }
  };

  const pendingRequests = requests?.filter(r => r.approvalStatus === "pending") || [];
  const approvedRequests = requests?.filter(r => r.approvalStatus === "approved") || [];
  const rejectedRequests = requests?.filter(r => r.approvalStatus === "rejected") || [];

  return (
    <ScreenContainer>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            
            <Text className="text-2xl font-bold text-foreground">My Requests</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Summary Cards */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-orange-100 rounded-xl p-4">
              <Text className="text-2xl font-bold text-orange-600">{pendingRequests.length}</Text>
              <Text className="text-sm text-orange-700 mt-1">Pending</Text>
            </View>
            <View className="flex-1 bg-green-100 rounded-xl p-4">
              <Text className="text-2xl font-bold text-green-600">{approvedRequests.length}</Text>
              <Text className="text-sm text-green-700 mt-1">Approved</Text>
            </View>
            <View className="flex-1 bg-red-100 rounded-xl p-4">
              <Text className="text-2xl font-bold text-red-600">{rejectedRequests.length}</Text>
              <Text className="text-sm text-red-700 mt-1">Rejected</Text>
            </View>
          </View>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Pending Requests</Text>
              {pendingRequests.map((request) => (
                <View key={request.id} className="bg-surface rounded-xl p-4 border border-border gap-3">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">{request.title}</Text>
                      <Text className="text-sm text-muted mt-1">{request.projectName}</Text>
                    </View>
                    {getStatusBadge(request.approvalStatus)}
                  </View>
                  
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs text-muted leading-relaxed">Date</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {new Date(request.startTime).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted leading-relaxed">Time</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {new Date(request.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs text-muted leading-relaxed">Venue</Text>
                    <Text className="text-sm text-foreground font-medium">{request.venue}</Text>
                  </View>

                  <TouchableOpacity
                    className="bg-red-500 py-3 rounded-lg active:opacity-80"
                    onPress={() => handleCancelRequest(request.id)}
                  >
                    <Text className="text-white font-semibold text-center">Cancel Request</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Approved Requests */}
          {approvedRequests.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Approved Requests</Text>
              {approvedRequests.map((request) => (
                <View key={request.id} className="bg-surface rounded-xl p-4 border border-border gap-3">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">{request.title}</Text>
                      <Text className="text-sm text-muted mt-1">{request.projectName}</Text>
                    </View>
                    {getStatusBadge(request.approvalStatus)}
                  </View>
                  
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs text-muted leading-relaxed">Date</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {new Date(request.startTime).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted leading-relaxed">Time</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {new Date(request.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs text-muted leading-relaxed">Venue</Text>
                    <Text className="text-sm text-foreground font-medium">{request.venue}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Rejected Requests */}
          {rejectedRequests.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Rejected Requests</Text>
              {rejectedRequests.map((request) => (
                <View key={request.id} className="bg-surface rounded-xl p-4 border border-border gap-3 opacity-60">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">{request.title}</Text>
                      <Text className="text-sm text-muted mt-1">{request.projectName}</Text>
                    </View>
                    {getStatusBadge(request.approvalStatus)}
                  </View>
                  
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs text-muted leading-relaxed">Date</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {new Date(request.startTime).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted leading-relaxed">Time</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {new Date(request.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs text-muted leading-relaxed">Venue</Text>
                    <Text className="text-sm text-foreground font-medium">{request.venue}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {requests && requests.length === 0 && (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">📝</Text>
              <Text className="text-xl font-bold text-foreground text-center mb-2">
                No Requests Yet
              </Text>
              <Text className="text-base text-muted text-center leading-relaxed">
                Your session requests will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
