import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function TeamAvailabilityScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: sessions, isLoading } = (trpc.scheduling as any).getSessions.useQuery(
    {
      startDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString(),
      endDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString(),
    },
    { enabled: isAuthenticated }
  );

  if (authLoading || isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "finance")) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <Text className="text-xl text-foreground text-center">
          Admin access required
        </Text>
      </ScreenContainer>
    );
  }

  // Group sessions by facilitator
  const facilitatorSessions: Record<string, any[]> = {};
  sessions?.forEach((session) => {
    const facilitators = session.facilitators || [];
    facilitators.forEach((facilitator: any) => {
      const key = `${facilitator.id}-${facilitator.name}`;
      if (!facilitatorSessions[key]) {
        facilitatorSessions[key] = [];
      }
      facilitatorSessions[key].push({
        ...session,
        acceptanceStatus: session.acceptanceStatus || "pending",
      });
    });
  });

  const monthName = selectedDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <ScreenContainer>
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
            <Text className="text-2xl font-bold text-foreground">Team Availability</Text>
          </View>
          <Text className="text-sm text-muted leading-relaxed">
            View all facilitators' schedules and acceptance status
          </Text>
        </View>

        <View className="p-4 gap-4">
          {/* Month Selector */}
          <View className="bg-surface border border-border rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
                className="p-2"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <IconSymbol name="chevron.left" size={24} color={colors.primary} />
              </Pressable>
              
              <Text className="text-lg font-semibold text-foreground">{monthName}</Text>
              
              <Pressable
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
                className="p-2"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <IconSymbol name="chevron.right" size={24} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {/* Legend */}
          <View className="bg-surface border border-border rounded-2xl p-4">
            <Text className="text-base font-semibold text-foreground mb-3">Status Legend</Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-warning" />
                <Text className="text-sm text-muted leading-relaxed">Pending - Awaiting facilitator response</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-success" />
                <Text className="text-sm text-muted leading-relaxed">Accepted - Facilitator confirmed</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-error" />
                <Text className="text-sm text-muted leading-relaxed">Rejected - Needs reassignment</Text>
              </View>
            </View>
          </View>

          {/* Facilitator Schedules */}
          {Object.keys(facilitatorSessions).length === 0 ? (
            <View className="bg-surface border border-border rounded-2xl p-6 items-center">
              <Text className="text-base text-muted text-center leading-relaxed">
                No sessions scheduled for this month
              </Text>
            </View>
          ) : (
            Object.entries(facilitatorSessions).map(([key, sessions]) => {
              const [id, name] = key.split("-");
              const pendingCount = sessions.filter((s) => s.acceptanceStatus === "pending").length;
              const acceptedCount = sessions.filter((s) => s.acceptanceStatus === "accepted").length;
              const rejectedCount = sessions.filter((s) => s.acceptanceStatus === "rejected").length;

              return (
                <View key={key} className="bg-surface border border-border rounded-2xl p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-semibold text-foreground">{name}</Text>
                    <Text className="text-sm text-muted leading-relaxed">{sessions.length} sessions</Text>
                  </View>

                  {/* Status Summary */}
                  <View className="flex-row gap-2 mb-3">
                    {pendingCount > 0 && (
                      <View className="bg-warning/20 border border-warning/30 rounded-lg px-3 py-1">
                        <Text className="text-xs font-medium text-warning">
                          ⏳ {pendingCount} Pending
                        </Text>
                      </View>
                    )}
                    {acceptedCount > 0 && (
                      <View className="bg-success/20 border border-success/30 rounded-lg px-3 py-1">
                        <Text className="text-xs font-medium text-success">
                          ✓ {acceptedCount} Accepted
                        </Text>
                      </View>
                    )}
                    {rejectedCount > 0 && (
                      <View className="bg-error/20 border border-error/30 rounded-lg px-3 py-1">
                        <Text className="text-xs font-medium text-error">
                          ✗ {rejectedCount} Rejected
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Session List */}
                  <View className="gap-2">
                    {sessions.map((session) => {
                      const startDate = new Date(session.startTime);
                      const statusColor =
                        session.acceptanceStatus === "accepted"
                          ? colors.success
                          : session.acceptanceStatus === "rejected"
                          ? colors.error
                          : colors.warning;

                      return (
                        <Pressable
                          key={session.id}
                          onPress={() => router.push(`/schedule/${session.id}` as any)}
                          className="border-l-4 pl-3 py-2"
                          style={{ borderLeftColor: statusColor, opacity: 1 }}
                        >
                          <Text className="text-sm font-medium text-foreground">
                            {session.title}
                          </Text>
                          <Text className="text-xs text-muted leading-relaxed mt-0.5">
                            {startDate.toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            at {startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
