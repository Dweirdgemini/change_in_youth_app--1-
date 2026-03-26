import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { useState } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function CreateVideoMeetingScreen() {
  const { user } = useAuthContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState("60"); // minutes
  const [meetingType, setMeetingType] = useState<"zoom" | "google_meet" | "teams" | "other">("zoom");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleCreate = () => {
    if (!title || !date || !startTime) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    // Generate a mock meeting link (in production, this would call Zoom/Google Meet API)
    const meetingLink = generateMeetingLink(meetingType);

    Alert.alert(
      "Video Meeting Created!",
      `Your ${meetingType} meeting "${title}" has been scheduled.\n\nMeeting Link: ${meetingLink}`,
      [
        {
          text: "Copy Link",
          onPress: () => {
            // In production, copy to clipboard
            Alert.alert("Link Copied", "Meeting link copied to clipboard");
          },
        },
        {
          text: "Done",
          onPress: () => router.back(),
        },
      ]
    );
  };

  const generateMeetingLink = (type: string) => {
    const meetingId = Math.random().toString(36).substring(7);
    switch (type) {
      case "zoom":
        return `https://zoom.us/j/${meetingId}`;
      case "google_meet":
        return `https://meet.google.com/${meetingId}`;
      case "teams":
        return `https://teams.microsoft.com/l/meetup-join/${meetingId}`;
      default:
        return `https://meeting.changeinouth.org/${meetingId}`;
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            
            <Text className="text-2xl font-bold text-foreground">Create Video Meeting</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Info Banner */}
          <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
            <Text className="text-sm text-foreground">
              📹 Schedule a virtual meeting with team members or participants
            </Text>
          </View>

          {/* Meeting Title */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Meeting Title *
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="e.g., Weekly Team Check-in"
              placeholderTextColor="#9BA1A6"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Description (Optional)
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="Meeting agenda or notes"
              placeholderTextColor="#9BA1A6"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Date */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Date *
            </Text>
            <TouchableOpacity
              className="bg-surface border border-border rounded-xl p-4"
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="text-foreground">{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>

          {/* Start Time */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Start Time *
            </Text>
            <TouchableOpacity
              className="bg-surface border border-border rounded-xl p-4"
              onPress={() => setShowTimePicker(true)}
            >
              <Text className="text-foreground">
                {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(Platform.OS === "ios");
                  if (selectedTime) setStartTime(selectedTime);
                }}
              />
            )}
          </View>

          {/* Duration */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Duration (minutes)
            </Text>
            <View className="flex-row gap-2">
              {["30", "60", "90", "120"].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  className={`flex-1 p-3 rounded-xl border ${
                    duration === mins
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setDuration(mins)}
                >
                  <Text
                    className={`text-center font-semibold ${
                      duration === mins ? "text-background" : "text-foreground"
                    }`}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meeting Platform */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Meeting Platform
            </Text>
            <View className="gap-2">
              {[
                { value: "zoom", label: "Zoom", icon: "📹" },
                { value: "google_meet", label: "Google Meet", icon: "📞" },
                { value: "teams", label: "Microsoft Teams", icon: "💼" },
                { value: "other", label: "Other", icon: "🌐" },
              ].map((platform) => (
                <TouchableOpacity
                  key={platform.value}
                  className={`p-4 rounded-xl border flex-row items-center gap-3 ${
                    meetingType === platform.value
                      ? "bg-primary/10 border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setMeetingType(platform.value as any)}
                >
                  <Text className="text-2xl">{platform.icon}</Text>
                  <Text
                    className={`font-semibold ${
                      meetingType === platform.value ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {platform.label}
                  </Text>
                  {meetingType === platform.value && (
                    <Text className="ml-auto text-primary text-xl">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full active:opacity-80 mt-4"
            onPress={handleCreate}
          >
            <Text className="text-background font-semibold text-lg text-center">
              Create Video Meeting
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
