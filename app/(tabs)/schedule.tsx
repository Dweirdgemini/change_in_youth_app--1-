import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Pressable, Platform, ScrollView } from "react-native";
import { SmoothScrollView } from "@/components/smooth-scroll-view";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/contexts/auth-context";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { generateICSForMultipleEvents, downloadICSFile, type CalendarEvent } from "@/lib/calendar-export";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { RefreshControl } from "@/components/refresh-control";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { useState, useMemo } from "react";
import type { SessionWithFacilitators, ScheduleActivity } from "@/shared/types";

export default function ScheduleScreen() {
  const { user, isAuthenticated, loading } = useAuthContext();
  const colors = useColors();
  const [selectedFilter, setSelectedFilter] = useState<"all" | "upcoming" | "completed">("upcoming");
  const [acceptanceFilter, setAcceptanceFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: sessions, isLoading, refetch, error: sessionsError } = (trpc.scheduling as any).getMySessions.useQuery(
    undefined,
    { enabled: isAuthenticated }
  ) as { data: SessionWithFacilitators[] | undefined; isLoading: boolean; refetch: () => void; error: any };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Also fetch pending requests to show provisionally
  const { data: myRequests } = trpc.sessions.getMyRequests.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Combine sessions and pending requests
  const allActivities: ScheduleActivity[] = [
    ...(sessions || []),
    ...(myRequests?.filter(r => r.approvalStatus === "pending").map(r => ({
      ...r,
      isPendingRequest: true,
      facilitators: [],
      acceptanceStatus: "pending" as const,
    })) || []),
  ];
  const acceptSession = (trpc.scheduling as any).acceptSession.useMutation();
  const rejectSession = (trpc.scheduling as any).rejectSession.useMutation();

  // Calculate weekly summary
  const weeklySummary = useMemo(() => {
    if (!sessions) return { totalHours: 0, totalSessions: 0, totalStaff: 0, totalCost: 0 };
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const weekSessions = sessions.filter((session) => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startOfWeek && sessionDate < endOfWeek;
    });
    
    const totalHours = weekSessions.reduce((sum, session) => {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    const totalCost = weekSessions.reduce((sum, session) => {
      return sum + (session.paymentPerFacilitator ? parseFloat(session.paymentPerFacilitator) : 0);
    }, 0);
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalSessions: weekSessions.length,
      totalStaff: new Set(weekSessions.flatMap(s => s.facilitators)).size,
      totalCost: totalCost
    };
  }, [sessions]);

  if (loading) {
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
            Sign in to view schedule
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

  const now = new Date();
  
  // Separate unassigned sessions
  const unassignedSessions = sessions?.filter((session) => {
    return (session.facilitators.length === 0) && session.status === "scheduled";
  }) || [];
  
  const filteredSessions = allActivities?.filter((session) => {
    const sessionDate = new Date(session.startTime);
    
    // Apply time-based filter
    if (selectedFilter === "upcoming" && sessionDate < now) return false;
    if (selectedFilter === "completed" && session.status !== "completed") return false;
    
    // Apply acceptance status filter
    if (acceptanceFilter !== "all") {
      const status = session.acceptanceStatus || "pending";
      if (acceptanceFilter !== status) return false;
    }
    
    return true;
  }) || [];

  return (
    <ScreenContainer>
      <SmoothScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">Schedule</Text>
              <Text className="text-base text-muted mt-1">
                {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="bg-success w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                onPress={() => router.push("/create-video-meeting" as any)}
              >
                <Text className="text-background text-xl">📹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-primary w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                onPress={() => router.push("/create-session" as any)}
              >
                <Text className="text-background text-2xl font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekly Summary Widget */}
          {(user?.role === "admin" || user?.role === "finance") && (
            <View className="bg-[#F5A962]/10 border border-[#F5A962]/30 rounded-2xl p-4">
              <Text className="text-lg font-semibold text-foreground mb-3">Weekly Summary</Text>
              <View className="flex-row flex-wrap gap-4">
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-2xl font-bold text-[#F5A962]">{weeklySummary.totalHours}h</Text>
                  <Text className="text-sm text-muted leading-relaxed">Total Hours</Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-2xl font-bold text-[#F5A962]">{weeklySummary.totalSessions}</Text>
                  <Text className="text-sm text-muted leading-relaxed">Sessions</Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-2xl font-bold text-[#F5A962]">{weeklySummary.totalStaff}</Text>
                  <Text className="text-sm text-muted leading-relaxed">Staff</Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-2xl font-bold text-[#F5A962]">£{weeklySummary.totalCost.toFixed(2)}</Text>
                  <Text className="text-sm text-muted leading-relaxed">Labor Cost</Text>
                </View>
              </View>
            </View>
          )}

          {/* Export Calendar Button */}
          <Pressable
            onPress={() => {
              if (!sessions || sessions.length === 0) {
                Alert.alert("No Sessions", "You don't have any sessions to export");
                return;
              }
              
              const events: CalendarEvent[] = sessions.map(session => ({
                id: session.id,
                title: session.title,
                description: session.description || undefined,
                location: session.venue,
                startTime: new Date(session.startTime),
                endTime: new Date(session.endTime),
                status: session.status,
              }));
              
              const icsContent = generateICSForMultipleEvents(events);
              
              if (Platform.OS === "web") {
                downloadICSFile(icsContent, "my-schedule.ics");
                Alert.alert("Success", "Calendar file downloaded! Open it to add to your calendar app.");
              } else {
                Alert.alert(
                  "Calendar Export",
                  "Calendar export is available on web. Please use the web version to download your schedule."
                );
              }
            }}
            className="bg-surface border border-border rounded-xl p-4 flex-row items-center justify-between mb-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">📅</Text>
              <View>
                <Text className="text-base font-semibold text-foreground">Export to Calendar</Text>
                <Text className="text-xs text-muted leading-relaxed mt-0.5">Download .ics file for Apple/Google Calendar</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.foreground} />
          </Pressable>

          {/* Filter Tabs */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl ${
                selectedFilter === "upcoming" ? "bg-primary" : "bg-surface border border-border"
              }`}
              onPress={() => setSelectedFilter("upcoming")}
            >
              <Text
                className={`text-center font-semibold ${
                  selectedFilter === "upcoming" ? "text-background" : "text-foreground"
                }`}
              >
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl ${
                selectedFilter === "all" ? "bg-primary" : "bg-surface border border-border"
              }`}
              onPress={() => setSelectedFilter("all")}
            >
              <Text
                className={`text-center font-semibold ${
                  selectedFilter === "all" ? "text-background" : "text-foreground"
                }`}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl ${
                selectedFilter === "completed" ? "bg-primary" : "bg-surface border border-border"
              }`}
              onPress={() => setSelectedFilter("completed")}
            >
              <Text
                className={`text-center font-semibold ${
                  selectedFilter === "completed" ? "text-background" : "text-foreground"
                }`}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </View>

          {/* Acceptance Status Filter */}
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                acceptanceFilter === "all" ? "bg-primary/20 border-2 border-primary" : "bg-surface border border-border"
              }`}
              onPress={() => setAcceptanceFilter("all")}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  acceptanceFilter === "all" ? "text-primary" : "text-muted"
                }`}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                acceptanceFilter === "pending" ? "bg-warning/20 border-2 border-warning" : "bg-surface border border-border"
              }`}
              onPress={() => setAcceptanceFilter("pending")}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  acceptanceFilter === "pending" ? "text-warning" : "text-muted"
                }`}
              >
                ⏳ Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                acceptanceFilter === "accepted" ? "bg-success/20 border-2 border-success" : "bg-surface border border-border"
              }`}
              onPress={() => setAcceptanceFilter("accepted")}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  acceptanceFilter === "accepted" ? "text-success" : "text-muted"
                }`}
              >
                ✓ Accepted
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                acceptanceFilter === "rejected" ? "bg-error/20 border-2 border-error" : "bg-surface border border-border"
              }`}
              onPress={() => setAcceptanceFilter("rejected")}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  acceptanceFilter === "rejected" ? "text-error" : "text-muted"
                }`}
              >
                ✗ Rejected
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sessions List */}
          {/* Unassigned Sessions Section */}
          {(user?.role === "admin" || user?.role === "finance") && unassignedSessions.length > 0 && (
            <View className="bg-error/10 border border-error/30 rounded-2xl p-4">
              <Text className="text-lg font-semibold text-foreground mb-2">⚠️ Unassigned Shifts</Text>
              <Text className="text-sm text-muted mb-3">
                {unassignedSessions.length} session{unassignedSessions.length > 1 ? "s" : ""} need facilitator coverage
              </Text>
              <View className="gap-2">
                {unassignedSessions.slice(0, 3).map((session) => {
                  const startDate = new Date(session.startTime);
                  return (
                    <TouchableOpacity
                      key={session.id}
                      className="bg-background rounded-xl p-3 border border-error/20 active:opacity-70"
                      onPress={() => router.push(`/schedule/${session.id}` as any)}
                    >
                      <Text className="text-sm font-semibold text-foreground">{session.title}</Text>
                      <Text className="text-xs text-muted leading-relaxed mt-1">
                        {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {unassignedSessions.length > 3 && (
                  <Text className="text-xs text-muted leading-relaxed text-center mt-1">
                    +{unassignedSessions.length - 3} more unassigned
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Sessions List */}
          {sessionsError ? (
            <ErrorState
              icon="exclamationmark.circle"
              title="Failed to load schedule"
              description="An error occurred while loading your schedule. Please try again."
              retryLabel="Retry"
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <ActivityIndicator />
          ) : filteredSessions.length > 0 ? (
            <View className="gap-3">
              {filteredSessions.map((session) => {
                const startDate = new Date(session.startTime);
                const endDate = new Date(session.endTime);
                const isToday = startDate.toDateString() === now.toDateString();

                const isPending = session.acceptanceStatus === "pending";
                const isAccepted = session.acceptanceStatus === "accepted";
                const isRejected = session.acceptanceStatus === "rejected";
                const isPendingRequest = 'isPendingRequest' in session ? session.isPendingRequest : false;

                return (
                  <View
                    key={session.id}
                    className="bg-surface rounded-2xl p-4 border border-border"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground">{session.title}</Text>
                        <Text className="text-sm text-muted mt-1">📍 {session.venue}</Text>
                        <View className="flex-row gap-2 mt-2">
                          <Text className="text-sm text-muted leading-relaxed">
                            📅 {startDate.toLocaleDateString()}
                          </Text>
                          <Text className="text-sm text-muted leading-relaxed">
                            🕐 {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </View>
                        {'sessionNumber' in session && session.sessionNumber && 'totalSessions' in session && session.totalSessions && (
                          <Text className="text-xs text-muted leading-relaxed mt-1">
                            Session {session.sessionNumber} of {session.totalSessions}
                          </Text>
                        )}
                      </View>
                      <View className="items-end gap-2">
                        {isPendingRequest && (
                          <View className="bg-orange-500 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-semibold">Pending Approval</Text>
                          </View>
                        )}
                        <View
                          className={`px-3 py-1 rounded-full ${
                            session.status === "completed"
                              ? "bg-success/10"
                              : session.status === "in_progress"
                              ? "bg-primary/10"
                              : session.status === "cancelled"
                              ? "bg-error/10"
                              : isToday
                              ? "bg-warning/10"
                              : "bg-surface"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              session.status === "completed"
                                ? "text-success"
                                : session.status === "in_progress"
                                ? "text-primary"
                                : session.status === "cancelled"
                                ? "text-error"
                                : isToday
                                ? "text-warning"
                                : "text-muted"
                            }`}
                          >
                            {session.status === "completed"
                              ? "Completed"
                              : session.status === "in_progress"
                              ? "In Progress"
                              : session.status === "cancelled"
                              ? "Cancelled"
                              : isToday
                              ? "Today"
                              : "Scheduled"}
                          </Text>
                        </View>
                        {session.paymentPerFacilitator && (
                          <Text className="text-sm font-semibold text-foreground mt-2">
                            £{parseFloat(session.paymentPerFacilitator).toFixed(2)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Accept/Reject Buttons */}
                    {isPending && session.status === "scheduled" && (
                      <View className="flex-row gap-2 mt-3">
                        <TouchableOpacity
                          className="flex-1 bg-success rounded-xl py-3 active:opacity-70"
                          onPress={async () => {
                            try {
                              await acceptSession.mutateAsync({ sessionId: session.id });
                              Alert.alert("Success", "Session accepted!");
                            } catch (error: any) {
                              Alert.alert("Error", error.message);
                            }
                          }}
                        >
                          <Text className="text-background font-semibold text-center">
                            ✓ Accept
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 bg-error rounded-xl py-3 active:opacity-70"
                          onPress={() => {
                            Alert.prompt(
                              "Reject Session",
                              "Please provide a reason (optional):",
                              async (reason) => {
                                try {
                                  await rejectSession.mutateAsync({
                                    sessionId: session.id,
                                    reason: reason || undefined,
                                  });
                                  Alert.alert("Success", "Session rejected");
                                } catch (error: any) {
                                  Alert.alert("Error", error.message);
                                }
                              }
                            );
                          }}
                        >
                          <Text className="text-background font-semibold text-center">
                            ✗ Reject
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Acceptance Status Badge */}
                    {isAccepted && (
                      <View className="bg-success/10 border border-success/30 rounded-xl p-2 mt-3">
                        <Text className="text-xs text-success font-semibold text-center">
                          ✓ You accepted this session
                        </Text>
                      </View>
                    )}
                    {isRejected && (
                      <View className="bg-error/10 border border-error/30 rounded-xl p-2 mt-3">
                        <Text className="text-xs text-error font-semibold text-center">
                          ✗ You rejected this session
                        </Text>
                      </View>
                    )}

                    {/* View Details Button */}
                    <TouchableOpacity
                      className="bg-primary/10 rounded-xl py-2 mt-2 active:opacity-70"
                      onPress={() => router.push(`/schedule/${session.id}` as any)}
                    >
                      <Text className="text-primary font-medium text-center text-sm">
                        View Details →
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="calendar"
              title={`No ${selectedFilter !== "all" ? selectedFilter : ""} sessions`}
              description="Schedule your first session to get started"
              actionLabel={selectedFilter === "upcoming" ? "Request Session" : undefined}
              onAction={selectedFilter === "upcoming" ? () => router.push("/create-session" as any) : undefined}
            />
          )}
        </View>
      </SmoothScrollView>
    </ScreenContainer>
  );
}
