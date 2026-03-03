import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router, useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function UserProfileScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const params = useLocalSearchParams();
  const userId = Number(params.id);
  
  const [newNote, setNewNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  
  const { data: activities, isLoading: activitiesLoading } = trpc.userProfile.getUserActivity.useQuery(
    { userId, limit: 50 },
    { enabled: isAuthenticated && !isNaN(userId) }
  );
  
  const { data: payRate } = trpc.userProfile.getCurrentPayRate.useQuery(
    { userId },
    { enabled: isAuthenticated && !isNaN(userId) }
  );
  
  const { data: adminNotes, refetch: refetchNotes } = trpc.userProfile.getAdminNotes.useQuery(
    { userId },
    { enabled: isAuthenticated && user?.role === "admin" && !isNaN(userId) }
  );
  
  const createNoteMutation = trpc.userProfile.createAdminNote.useMutation({
    onSuccess: () => {
      setNewNote("");
      setShowAddNote(false);
      refetchNotes();
    },
  });
  
  if (authLoading || activitiesLoading) {
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
            Sign in to view profile
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
  
  const canViewAdminFeatures = user?.role === "admin";
  
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">User Profile</Text>
              <Text className="text-base text-muted mt-1">ID: {userId}</Text>
            </View>
            
          </View>
          
          {/* Pay Rate Card */}
          {payRate && (
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">Current Pay Rate</Text>
              <View className="flex-row gap-4">
                {payRate.sessionRate && (
                  <View>
                    <Text className="text-2xl font-bold text-primary">
                      £{parseFloat(payRate.sessionRate).toFixed(2)}
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">per session</Text>
                  </View>
                )}
                {payRate.hourlyRate && (
                  <View>
                    <Text className="text-2xl font-bold text-primary">
                      £{parseFloat(payRate.hourlyRate).toFixed(2)}
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">per hour</Text>
                  </View>
                )}
              </View>
              {payRate.notes && (
                <Text className="text-sm text-muted mt-2">{payRate.notes}</Text>
              )}
              <Text className="text-xs text-muted leading-relaxed mt-2">
                Effective: {new Date(payRate.effectiveDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {/* Admin Notes Section */}
          {canViewAdminFeatures && (
            <View className="bg-[#F5A962]/10 border border-[#F5A962]/30 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-foreground">Admin Notes</Text>
                <TouchableOpacity
                  className="bg-primary w-8 h-8 rounded-full items-center justify-center active:opacity-80"
                  onPress={() => setShowAddNote(!showAddNote)}
                >
                  <Text className="text-background text-lg font-bold">{showAddNote ? "×" : "+"}</Text>
                </TouchableOpacity>
              </View>
              
              {showAddNote && (
                <View className="mb-3 gap-2">
                  <TextInput
                    className="bg-background border border-border rounded-xl p-3 text-foreground"
                    placeholder="Enter admin note..."
                    placeholderTextColor="#9BA1A6"
                    value={newNote}
                    onChangeText={setNewNote}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity
                    className="bg-primary py-2 px-4 rounded-full active:opacity-80 self-end"
                    onPress={() => createNoteMutation.mutate({ userId, note: newNote })}
                    disabled={!newNote.trim() || createNoteMutation.isPending}
                  >
                    <Text className="text-background font-semibold">
                      {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {adminNotes && adminNotes.length > 0 ? (
                <View className="gap-2">
                  {adminNotes.map((note) => (
                    <View key={note.id} className="bg-background/50 rounded-lg p-3">
                      <Text className="text-sm text-foreground">{note.note}</Text>
                      <Text className="text-xs text-muted leading-relaxed mt-1">
                        {new Date(note.createdAt).toLocaleDateString()} at{" "}
                        {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-muted leading-relaxed">No admin notes yet</Text>
              )}
            </View>
          )}
          
          {/* Activity Timeline */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Activity Timeline</Text>
            
            {activities && activities.length > 0 ? (
              <View className="gap-3">
                {activities.map((activity, index) => (
                  <View key={activity.id} className="flex-row gap-3">
                    <View className="items-center">
                      <View className="w-3 h-3 rounded-full bg-primary" />
                      {index < activities.length - 1 && (
                        <View className="w-0.5 flex-1 bg-border mt-1" style={{ minHeight: 40 }} />
                      )}
                    </View>
                    <View className="flex-1 pb-3">
                      <Text className="text-sm font-medium text-foreground">
                        {activity.actionDescription}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed mt-1">
                        {new Date(activity.createdAt).toLocaleDateString()} at{" "}
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                      {activity.entityType && (
                        <Text className="text-xs text-muted leading-relaxed">
                          {activity.entityType} #{activity.entityId}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-muted leading-relaxed">No activity recorded yet</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
