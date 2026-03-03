import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "finance";
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const { data: teamAvailability, isLoading } = trpc.calendar.getTeamAvailability.useQuery(
    { date: date || new Date().toISOString() },
    { enabled: isAdmin }
  );

  const { data: daySessions, isLoading: sessionsLoading } = trpc.sessions.getSessionsByDate.useQuery(
    { date: date || new Date().toISOString() },
    { enabled: isAdmin }
  );

  const utils = trpc.useUtils();
  const assignFacilitator = trpc.sessions.assignFacilitator.useMutation({
    onSuccess: () => {
      utils.sessions.getSessionsByDate.invalidate();
      Alert.alert("Success", "Team member assigned successfully");
      setShowAssignModal(false);
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to assign team member");
    },
  });

  const dateObj = new Date(date || new Date());
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!isAdmin) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <Text className="text-xl font-bold text-foreground text-center">
          Admin access required
        </Text>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  const availableMembers = teamAvailability?.filter((m) => m.isAvailable) || [];
  const unavailableMembers = teamAvailability?.filter((m) => !m.isAvailable) || [];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View>
            
            <Text className="text-2xl font-bold text-foreground">Team Availability</Text>
            <Text className="text-base text-muted mt-1">{formattedDate}</Text>
          </View>

          {/* Summary */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-success">{availableMembers.length}</Text>
                <Text className="text-sm text-muted mt-1">Available</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="items-center">
                <Text className="text-2xl font-bold text-error">{unavailableMembers.length}</Text>
                <Text className="text-sm text-muted mt-1">Unavailable</Text>
              </View>
            </View>
          </View>

          {/* Available Team Members */}
          {availableMembers.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">✅ Available Team Members</Text>
              {availableMembers.map((member) => (
                <View
                  key={member.userId}
                  className="bg-success/10 rounded-2xl p-4 border border-success/30"
                >
                  <Text className="text-base font-semibold text-foreground">{member.name}</Text>
                  <Text className="text-sm text-muted mt-1">{member.email}</Text>
                  {member.notes && (
                    <Text className="text-sm text-muted mt-2 italic">Note: {member.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Unavailable Team Members */}
          {unavailableMembers.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">❌ Unavailable Team Members</Text>
              {unavailableMembers.map((member) => (
                <View
                  key={member.userId}
                  className="bg-error/10 rounded-2xl p-4 border border-error/30"
                >
                  <Text className="text-base font-semibold text-foreground">{member.name}</Text>
                  <Text className="text-sm text-muted mt-1">{member.email}</Text>
                  {member.notes && (
                    <Text className="text-sm text-muted mt-2 italic">Reason: {member.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {teamAvailability && teamAvailability.length === 0 && (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-base text-muted text-center leading-relaxed">
                No team members found
              </Text>
            </View>
          )}

          {/* Sessions on this day */}
          {daySessions && daySessions.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">📅 Sessions Today</Text>
              {daySessions.map((session) => (
                <View
                  key={session.id}
                  className="bg-primary/10 rounded-2xl p-4 border border-primary/30"
                >
                  <Text className="text-base font-semibold text-foreground">{session.title}</Text>
                  <Text className="text-sm text-muted mt-1">{session.venue}</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
                  </Text>
                  <TouchableOpacity
                    className="bg-primary px-4 py-2 rounded-full mt-3 active:opacity-80"
                    onPress={() => {
                      setSelectedSession(session.id);
                      setShowAssignModal(true);
                    }}
                  >
                    <Text className="text-background font-semibold text-center">Assign Team</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Assign Team Modal */}
      <Modal
        visible={showAssignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-bold text-foreground">Assign Team</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Text className="text-2xl text-muted">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text className="text-sm text-muted mb-3">Select available team members to assign:</Text>
              {availableMembers.map((member) => (
                <TouchableOpacity
                  key={member.userId}
                  className="bg-success/10 rounded-2xl p-4 border border-success/30 mb-3 active:opacity-70"
                  onPress={() => {
                    if (selectedSession) {
                      assignFacilitator.mutate({
                        sessionId: selectedSession,
                        userId: member.userId,
                      });
                    }
                  }}
                >
                  <Text className="text-base font-semibold text-foreground">{member.name}</Text>
                  <Text className="text-sm text-muted leading-relaxed">{member.email}</Text>
                  {member.notes && (
                    <Text className="text-xs text-muted leading-relaxed mt-1 italic">Note: {member.notes}</Text>
                  )}
                </TouchableOpacity>
              ))}
              {availableMembers.length === 0 && (
                <Text className="text-center text-muted py-8">No available team members</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
