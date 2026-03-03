import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function AddDevelopmentRecordScreen() {
  const colors = useColors();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const targetUserId = parseInt(userId || "0");
  
  const [recordType, setRecordType] = useState<"skill_assessment" | "goal" | "performance_note" | "milestone">("skill_assessment");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = trpc.personalDevelopment.createDevelopmentRecord.useMutation();

  const recordTypes = [
    { value: "skill_assessment" as const, label: "Skill Assessment", color: colors.primary },
    { value: "goal" as const, label: "Goal", color: "#10B981" },
    { value: "performance_note" as const, label: "Performance Note", color: "#F59E0B" },
    { value: "milestone" as const, label: "Milestone", color: "#8B5CF6" },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        userId: targetUserId,
        recordType,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      
      router.back();
    } catch (error) {
      console.error("Failed to create record:", error);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border flex-row items-center gap-3">
          
          <Text className="text-lg font-bold text-foreground flex-1">
            Add Development Record
          </Text>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Record Type Selection */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">
              Record Type
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {recordTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setRecordType(type.value)}
                  className="px-4 py-2 rounded-full border active:opacity-70"
                  style={{
                    backgroundColor: recordType === type.value ? `${type.color}20` : "transparent",
                    borderColor: recordType === type.value ? type.color : colors.border,
                  }}
                >
                  <Text 
                    className="font-semibold text-sm"
                    style={{ 
                      color: recordType === type.value ? type.color : colors.muted 
                    }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Title *
            </Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Learn React Native"
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                maxLength={100}
              />
            </View>
            <Text className="text-xs text-muted leading-relaxed mt-1">
              {title.length}/100 characters
            </Text>
          </View>

          {/* Description Input */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              Description
            </Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add details about this development area..."
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
            <Text className="text-xs text-muted leading-relaxed mt-1">
              {description.length}/500 characters
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!title.trim() || createMutation.isPending}
            className="bg-primary rounded-xl py-4 items-center active:opacity-70"
            style={{
              opacity: !title.trim() || createMutation.isPending ? 0.5 : 1
            }}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                Add Record
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
