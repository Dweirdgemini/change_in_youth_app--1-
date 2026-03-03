import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function CreateChannelScreen() {
  const colors = useColors();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createChannelMutation = trpc.teamChats.createChannel.useMutation();

  const handleCreate = async () => {
    if (!name.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a channel name");
      } else {
        Alert.alert("Error", "Please enter a channel name");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createChannelMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (Platform.OS === "web") {
        alert("Channel created successfully!");
      } else {
        Alert.alert("Success", "Channel created successfully!");
      }

      // Navigate to the new channel
      router.replace(`/team-chat/${result.channelId}`);
    } catch (error: any) {
      console.error("Failed to create channel:", error);
      if (Platform.OS === "web") {
        alert(error.message || "Failed to create channel");
      } else {
        Alert.alert("Error", error.message || "Failed to create channel");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-center gap-3">
            
            <Text className="text-2xl font-bold text-foreground">Create Channel</Text>
          </View>
        </View>

        <ScrollView className="flex-1">
          <View className="p-6 gap-4">
            {/* Channel Name */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Channel Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Project Updates, General Chat"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                }}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Description (Optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What is this channel for?"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
                maxLength={500}
              />
            </View>

            {/* Info Box */}
            <View 
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text className="text-sm text-muted leading-relaxed">
                ℹ️ All team members will be able to see and join this channel once created.
              </Text>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              onPress={handleCreate}
              disabled={isSubmitting || !name.trim()}
              style={{
                backgroundColor: (!name.trim() || isSubmitting) ? colors.muted : colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                opacity: (!name.trim() || isSubmitting) ? 0.5 : 1,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Create Channel
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
