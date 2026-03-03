import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Alert, Modal, ScrollView, TextInput, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";

export default function TrainingScreen() {
  const colors = useColors();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [duration, setDuration] = useState("30");
  const [isRequired, setIsRequired] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const { data: modules, isLoading, refetch } = trpc.materials.listTrainingModules.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createModule = trpc.materials.createTrainingModule.useMutation();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  if (authLoading) {
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
            Sign in to access training
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "safeguarding":
        return "🛡️";
      case "skills":
        return "🎯";
      case "wellbeing":
        return "💚";
      case "compliance":
        return "✅";
      default:
        return "📚";
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const handleStartModule = (module: any) => {
    Alert.alert(
      module.title,
      module.content || "Training module content would be displayed here.",
      [
        {
          text: "Mark as Complete",
          onPress: () => {
            Alert.alert("Success", "Module marked as complete! (Demo mode)");
          },
        },
        { text: "Close", style: "cancel" },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            
            {isAdmin && (
              <TouchableOpacity
                className="bg-primary px-4 py-2 rounded-full active:opacity-80"
                onPress={() => setUploadModalVisible(true)}
              >
                <Text className="text-foreground font-semibold">+ Upload</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-2xl font-bold text-foreground">Training</Text>
          <Text className="text-base text-muted mt-1">Complete required modules</Text>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
            <Text className="text-muted mt-4">Loading training modules...</Text>
          </View>
        ) : !modules || modules.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-6xl mb-4">📚</Text>
            <Text className="text-xl font-semibold text-foreground text-center">
              No Training Modules Yet
            </Text>
            <Text className="text-base text-muted text-center mt-2">
              Training modules will appear here once they're created
            </Text>
          </View>
        ) : (
          <FlatList
            data={modules}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                onPress={() => handleStartModule(item)}
              >
                <View className="flex-row items-start gap-3">
                  <Text className="text-3xl">{getCategoryIcon(item.category)}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-base font-semibold text-foreground flex-1">
                        {item.title}
                      </Text>
                      {item.isRequired && (
                        <View className="bg-error/10 px-2 py-1 rounded">
                          <Text className="text-error text-xs font-medium">Required</Text>
                        </View>
                      )}
                    </View>
                    {item.description && (
                      <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-2 mt-2">
                      <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary text-xs font-medium">
                          {getCategoryLabel(item.category)}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted leading-relaxed">
                        {item.duration} minutes
                      </Text>
                    </View>
                  </View>
                  <Text className="text-primary text-xl">→</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: "90%" }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-bold text-foreground">Upload Training Module</Text>
                <Pressable
                  onPress={() => setUploadModalVisible(false)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Text className="text-foreground text-2xl">×</Text>
                </Pressable>
              </View>

              {/* Title */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Title *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-4 text-foreground"
                  placeholder="e.g., Safeguarding Training"
                  placeholderTextColor={colors.muted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-4 text-foreground"
                  placeholder="Brief description of the module"
                  placeholderTextColor={colors.muted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Category */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {["general", "safeguarding", "skills", "compliance", "wellbeing"].map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-full ${
                          category === cat ? "bg-primary" : "bg-surface border border-border"
                        }`}
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            category === cat ? "text-foreground" : "text-foreground"
                          }`}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Duration */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Duration (minutes)</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-4 text-foreground"
                  placeholder="30"
                  placeholderTextColor={colors.muted}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
              </View>

              {/* Required Toggle */}
              <View className="mb-4">
                <Pressable
                  onPress={() => setIsRequired(!isRequired)}
                  className="flex-row items-center justify-between bg-surface border border-border rounded-xl p-4"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-foreground font-semibold">Mark as Required</Text>
                  <View
                    className={`w-12 h-6 rounded-full ${
                      isRequired ? "bg-primary" : "bg-border"
                    } flex-row items-center`}
                    style={{ paddingHorizontal: 2 }}
                  >
                    <View
                      className="w-5 h-5 rounded-full bg-background"
                      style={{
                        transform: [{ translateX: isRequired ? 22 : 0 }] as any,
                      }}
                    />
                  </View>
                </Pressable>
              </View>

              {/* File Upload */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Attach File (Optional)</Text>
                <TouchableOpacity
                  className="bg-surface border border-border rounded-xl p-4 active:opacity-70"
                  onPress={async () => {
                    try {
                      const result = await DocumentPicker.getDocumentAsync({
                        type: ["application/pdf", "video/*", "image/*"],
                        copyToCacheDirectory: true,
                      });
                      if (!result.canceled && result.assets[0]) {
                        // In production, upload to S3 and get URL
                        setFileUrl(`https://placeholder-url.com/${result.assets[0].name}`);
                        Alert.alert("File Selected", result.assets[0].name);
                      }
                    } catch (error) {
                      Alert.alert("Error", "Failed to pick file");
                    }
                  }}
                >
                  <Text className="text-primary text-center font-semibold">
                    {fileUrl ? "✓ File Selected" : "📁 Choose File"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className="bg-primary py-4 rounded-full active:opacity-80 mb-4"
                onPress={async () => {
                  if (!title.trim()) {
                    Alert.alert("Error", "Please enter a title");
                    return;
                  }

                  try {
                    await createModule.mutateAsync({
                      title,
                      description: description || undefined,
                      category,
                      duration: parseInt(duration) || 30,
                      isRequired,
                      fileUrl: fileUrl || undefined,
                    });

                    Alert.alert("Success", "Training module created successfully");
                    setUploadModalVisible(false);
                    // Reset form
                    setTitle("");
                    setDescription("");
                    setCategory("general");
                    setDuration("30");
                    setIsRequired(false);
                    setFileUrl("");
                    refetch();
                  } catch (error: any) {
                    Alert.alert("Error", error.message || "Failed to create module");
                  }
                }}
              >
                <Text className="text-foreground text-center font-bold text-lg">
                  {createModule.isPending ? "Creating..." : "Create Module"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
