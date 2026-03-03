import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function UploadContentScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const colors = useColors();
  const [selectedSession, setSelectedSession] = useState<number | null>(
    sessionId ? parseInt(sessionId) : null
  );
  const [contentType, setContentType] = useState<"photo" | "video">("photo");
  const [contentUri, setContentUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: sessions } = (trpc.scheduling as any).getMySessions.useQuery();

  const uploadMutation = trpc.contentSharing.uploadContent.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Content Uploaded",
        "Your content has been submitted for admin review. You'll be notified when it's approved!",
        [
          {
            text: "Upload More",
            onPress: () => {
              setContentUri(null);
              setCaption("");
            },
          },
          {
            text: "View My Content",
            onPress: () => router.push("/content/my-content" as any),
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
      setIsUploading(false);
    },
  });

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant media library permissions to upload content."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        contentType === "photo"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setContentUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera permissions to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setContentUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!selectedSession) {
      Alert.alert("Select Session", "Please select a session for this content.");
      return;
    }

    if (!contentUri) {
      Alert.alert("Select Media", "Please select a photo or video to upload.");
      return;
    }

    setIsUploading(true);

    // In a real app, you would upload to S3 here
    const uploadedUrl = contentUri; // Placeholder

    uploadMutation.mutate({
      sessionId: selectedSession,
      contentUrl: uploadedUrl,
      contentType,
      caption: caption.trim() || undefined,
    });
  };

  const completedSessions = sessions?.filter((s) => s.status === "completed") || [];

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Share Content
          </Text>
          <Text className="text-sm text-muted leading-relaxed">
            Upload photos or videos from your sessions to share on social media
          </Text>
        </View>

        {/* Content Type Selection */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            Content Type
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setContentType("photo");
                setContentUri(null);
              }}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              className={`flex-1 p-4 rounded-xl border ${
                contentType === "photo"
                  ? "bg-primary/10 border-primary"
                  : "bg-surface border-border"
              }`}
            >
              <Text
                className={`text-center text-2xl mb-1 ${
                  contentType === "photo" ? "text-primary" : "text-foreground"
                }`}
              >
                📷
              </Text>
              <Text
                className={`text-center font-semibold ${
                  contentType === "photo" ? "text-primary" : "text-foreground"
                }`}
              >
                Photo
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setContentType("video");
                setContentUri(null);
              }}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              className={`flex-1 p-4 rounded-xl border ${
                contentType === "video"
                  ? "bg-primary/10 border-primary"
                  : "bg-surface border-border"
              }`}
            >
              <Text
                className={`text-center text-2xl mb-1 ${
                  contentType === "video" ? "text-primary" : "text-foreground"
                }`}
              >
                🎥
              </Text>
              <Text
                className={`text-center font-semibold ${
                  contentType === "video" ? "text-primary" : "text-foreground"
                }`}
              >
                Video
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Media Upload */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            {contentType === "photo" ? "Photo" : "Video"}
          </Text>

          {contentUri ? (
            <View className="relative">
              <Image
                source={{ uri: contentUri }}
                className="w-full h-64 rounded-xl"
                resizeMode="cover"
              />
              <Pressable
                onPress={() => setContentUri(null)}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="absolute top-2 right-2 bg-error rounded-full px-4 py-2"
              >
                <Text className="text-white font-semibold">Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-2">
              <Pressable
                onPress={takePhoto}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="bg-primary rounded-xl py-4"
              >
                <Text className="text-center text-white font-semibold">
                  📷 Take {contentType === "photo" ? "Photo" : "Video"}
                </Text>
              </Pressable>
              <Pressable
                onPress={pickMedia}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="bg-surface border border-border rounded-xl py-4"
              >
                <Text className="text-center text-foreground font-semibold">
                  📁 Choose from Gallery
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Session Selection */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            Select Session
          </Text>
          {completedSessions.length > 0 ? (
            completedSessions.slice(0, 10).map((session) => (
              <Pressable
                key={session.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedSession(session.id);
                }}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className={`p-4 rounded-xl mb-2 border ${
                  selectedSession === session.id
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    selectedSession === session.id ? "text-primary" : "text-foreground"
                  }`}
                >
                  {session.title}
                </Text>
                <Text className="text-sm text-muted mt-1">
                  {new Date(session.startTime).toLocaleDateString()}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text className="text-muted text-center py-4">
              No completed sessions available
            </Text>
          )}
        </View>

        {/* Caption */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            Caption (Optional)
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a caption for this content..."
            placeholderTextColor={colors.muted}
            className="bg-surface border border-border rounded-xl p-4 text-foreground"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Info Box */}
        <View className="bg-primary/10 rounded-xl p-4 mb-4">
          <Text className="text-primary font-semibold mb-2">
            📊 Earn Rewards!
          </Text>
          <Text className="text-muted text-sm leading-relaxed">
            Share engaging content to climb the leaderboard! The team member with the most reach each month wins a reward. Your content will be reviewed by admins before posting.
          </Text>
        </View>

        {/* Upload Button */}
        <Pressable
          onPress={handleUpload}
          disabled={isUploading}
          style={({ pressed }) => [
            {
              transform: [{ scale: pressed ? 0.97 : 1 }] as any,
              opacity: isUploading ? 0.5 : 1,
            },
          ]}
          className="bg-primary rounded-full py-4 mb-8"
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-white font-semibold text-base">
              Upload Content
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
