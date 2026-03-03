import { View, Text, TouchableOpacity, Pressable, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from "react-native";
import { ScreenWithBackButton } from "@/components/screen-with-back-button";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function CreateSessionScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: projects, isLoading: projectsLoading } = (trpc.finance as any).getProjects.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Must declare mutation hook at top level before any conditional returns
  const createSessionMutation = trpc.sessions.createSessionRequest.useMutation();

  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [payment, setPayment] = useState("");
  const [enableVideoCall, setEnableVideoCall] = useState(false);

  if (authLoading || projectsLoading) {
    return (
      <ScreenWithBackButton className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenWithBackButton>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenWithBackButton className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Sign in to create sessions
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-background font-semibold text-lg">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenWithBackButton>
    );
  }

  // All users can now create session requests

  const handleCreate = async () => {
    console.log('🔵 handleCreate called!');
    console.log('Form state:', { selectedProject, title, description, venue, date, startTime, endTime, payment, enableVideoCall });
    console.log('🔍 Validating form...');
    if (!selectedProject || !title || !venue || !date || !startTime || !endTime) {
      console.log('❌ Validation failed! Missing fields:', {
        selectedProject: !!selectedProject,
        title: !!title,
        venue: !!venue,
        date: !!date,
        startTime: !!startTime,
        endTime: !!endTime
      });
      if (Platform.OS === 'web') {
        alert("Please fill in all required fields");
      } else {
        Alert.alert("Missing Information", "Please fill in all required fields");
      }
      return;
    }

    console.log('✅ Validation passed! Submitting...');
    try {
      console.log('📤 Calling API...');
      const result = await createSessionMutation.mutateAsync({
        projectId: selectedProject,
        title,
        description,
        venue,
        date,
        startTime,
        endTime,
        paymentPerFacilitator: payment,
        enableVideoCall,
      });

      console.log('✅ API call successful!', result);
      if (Platform.OS === 'web') {
        alert("✅ Session request submitted successfully! An admin will review and approve it.");
      } else {
        Alert.alert(
          "Success",
          "Session request submitted successfully! An admin will review and approve it.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
      router.back();
    } catch (error) {
      console.error('❌ Failed to create session request:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (Platform.OS === 'web') {
        alert("Failed to submit session request. Please try again.");
      } else {
        Alert.alert("Error", "Failed to submit session request. Please try again.");
      }
    }
  };

  return (
    <ScreenWithBackButton>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()}>
              <Text className="text-primary text-lg">← Cancel</Text>
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Request Session</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Info Banner */}
          <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
            <Text className="text-sm text-foreground">
              ℹ️ Your session request will be reviewed by an admin before appearing in the schedule.
            </Text>
          </View>

          {/* Project Selection */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Project <Text className="text-error">*</Text>
            </Text>
            <View className="gap-2">
              {projects?.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={{
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    backgroundColor: selectedProject === project.id ? 'rgba(10, 126, 164, 0.1)' : '#f5f5f5',
                    borderColor: selectedProject === project.id ? '#0a7ea4' : '#E5E7EB',
                    marginBottom: 8,
                  }}
                  activeOpacity={0.7}
                  onPress={() => {
                    console.log('Project selected:', project.id, project.name);
                    setSelectedProject(project.id);
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '600',
                      color: selectedProject === project.id ? '#0a7ea4' : '#11181C',
                    }}
                  >
                    {project.name}
                  </Text>
                  {project.description && (
                    <Text style={{ fontSize: 14, color: '#687076', marginTop: 4 }} numberOfLines={1}>
                      {project.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Session Title */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Session Title <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Workshop Session 1"
              placeholderTextColor="#9BA1A6"
            />
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the session"
              placeholderTextColor="#9BA1A6"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Venue */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Venue <Text className="text-error">*</Text>
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={venue}
              onChangeText={setVenue}
              placeholder="Full address with postcode"
              placeholderTextColor="#9BA1A6"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          {/* Date & Time */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Date <Text className="text-error">*</Text>
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                value={date}
                onChangeText={setDate}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#9BA1A6"
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Start Time <Text className="text-error">*</Text>
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM"
                placeholderTextColor="#9BA1A6"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground mb-2">
                End Time <Text className="text-error">*</Text>
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM"
                placeholderTextColor="#9BA1A6"
              />
            </View>
          </View>

          {/* Payment */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Payment per Team Member (£)
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={payment}
              onChangeText={setPayment}
              placeholder="e.g., 60.00"
              placeholderTextColor="#9BA1A6"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Video Call Option */}
          <View className="bg-surface border border-border rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-foreground mb-1">
                  📹 Enable Video Call
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  Create an Agora video meeting room for this session. Attendance will be tracked automatically.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEnableVideoCall(!enableVideoCall)}
                className={`w-14 h-8 rounded-full justify-center ${
                  enableVideoCall ? "bg-success" : "bg-border"
                }`}
                style={{ padding: 2 }}
              >
                <View
                  className={`w-6 h-6 rounded-full bg-background ${
                    enableVideoCall ? "self-end" : "self-start"
                  }`}
                />
              </TouchableOpacity>
            </View>
            {enableVideoCall && (
              <View className="bg-success/10 border border-success/30 rounded-xl p-3 mt-2">
                <Text className="text-xs text-success font-medium">
                  ✓ Video call will be created. Team members can join from the session detail screen.
                </Text>
              </View>
            )}
          </View>

          {/* Create Button */}
          {Platform.OS === 'web' ? (
            <button
              onClick={() => {
                console.log('🔴 Web button clicked!');
                handleCreate();
              }}
              style={{
                backgroundColor: '#0a7ea4',
                color: '#ffffff',
                paddingLeft: 32,
                paddingRight: 32,
                paddingTop: 16,
                paddingBottom: 16,
                borderRadius: 9999,
                marginTop: 16,
                border: 'none',
                cursor: 'pointer' as any,
                fontWeight: '600',
                fontSize: 18,
                width: '100%',
              }}
            >
              Submit Request
            </button>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: '#0a7ea4',
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 9999,
                marginTop: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
              onPress={() => {
                console.log('🔴 Mobile button pressed!');
                handleCreate();
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 18 }}>
                Submit Request
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenWithBackButton>
  );
}
