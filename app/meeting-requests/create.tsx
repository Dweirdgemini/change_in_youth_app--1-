import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function CreateMeetingRequestScreen() {
  const colors = useColors();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposedDate, setProposedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);

  const { data: users, isLoading, error } = trpc.adminUsers.getAllUsers.useQuery();
  
  // Debug logging
  console.log('[CreateMeetingRequest] getAllUsers query state:', { 
    hasData: !!users, 
    userCount: users?.length || 0, 
    isLoading, 
    hasError: !!error,
    errorMessage: error?.message 
  });
  const createMutation = trpc.meetingRequests.createMeetingRequest.useMutation();

  const durationOptions = [15, 30, 45, 60, 90, 120];

  const toggleParticipant = (userId: number) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || selectedParticipants.length === 0) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        requestedDate: proposedDate,
        durationMinutes,
        participantIds: selectedParticipants,
      });
      
      router.back();
    } catch (error) {
      console.error("Failed to create meeting request:", error);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(proposedDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setProposedDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(proposedDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setProposedDate(newDate);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border flex-row items-center gap-3">
          
          <Text className="text-lg font-bold text-foreground flex-1">
            Request Meeting
          </Text>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Title */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Meeting Title *
            </Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Project Planning Session"
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                maxLength={100}
              />
            </View>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Description
            </Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What would you like to discuss?"
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Date and Time */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Proposed Date & Time *
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-1 bg-surface rounded-xl p-4 border border-border active:opacity-70"
              >
                <Text className="text-sm text-muted mb-1">Date</Text>
                <Text className="text-base text-foreground font-semibold">
                  {proposedDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                className="flex-1 bg-surface rounded-xl p-4 border border-border active:opacity-70"
              >
                <Text className="text-sm text-muted mb-1">Time</Text>
                <Text className="text-base text-foreground font-semibold">
                  {proposedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={proposedDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={proposedDate}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimeChange}
              />
            )}
          </View>

          {/* Duration */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Duration *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {durationOptions.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  onPress={() => setDurationMinutes(duration)}
                  className="px-4 py-3 rounded-xl border active:opacity-70"
                  style={{
                    backgroundColor: durationMinutes === duration ? `${colors.primary}20` : colors.surface,
                    borderColor: durationMinutes === duration ? colors.primary : colors.border,
                  }}
                >
                  <Text 
                    className="font-semibold text-sm"
                    style={{ 
                      color: durationMinutes === duration ? colors.primary : colors.foreground 
                    }}
                  >
                    {duration} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Participants */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Participants * ({selectedParticipants.length} selected)
            </Text>
            {users && users.length > 0 ? (
              <View className="gap-2">
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => toggleParticipant(user.id)}
                    className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between active:opacity-70"
                    style={{
                      borderColor: selectedParticipants.includes(user.id) ? colors.primary : colors.border,
                      backgroundColor: selectedParticipants.includes(user.id) ? `${colors.primary}10` : colors.surface,
                    }}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {user.name}
                      </Text>
                      <Text className="text-sm text-muted leading-relaxed">{user.email}</Text>
                    </View>
                    {selectedParticipants.includes(user.id) && (
                      <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-xl p-6 items-center border border-border">
                <Text className="text-sm text-muted leading-relaxed">No users available</Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!title.trim() || selectedParticipants.length === 0 || createMutation.isPending}
            className="bg-primary rounded-xl py-4 items-center active:opacity-70 mb-8"
            style={{
              opacity: !title.trim() || selectedParticipants.length === 0 || createMutation.isPending ? 0.5 : 1
            }}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                Submit Request
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
