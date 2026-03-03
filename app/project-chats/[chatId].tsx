import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { EncodingType } from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function ProjectChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const colors = useColors();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: chat } = (trpc.projectChat as any).getChatById.useQuery(
    { chatId: Number(chatId) },
    { enabled: !!chatId }
  );

  const { data: messages, refetch } = trpc.projectChat.getMessages.useQuery(
    { chatId: Number(chatId) },
    { enabled: !!chatId, refetchInterval: 5000 } // Poll every 5 seconds
  );

  const sendMessageMutation = trpc.projectChat.sendMessage.useMutation();
  const submitToSocialMutation = trpc.socialMedia.submitContent.useMutation();
  const uploadFileMutation = (trpc.fileUpload as any).uploadFile.useMutation();

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        chatId: Number(chatId),
        content: message.trim(),
        messageType: "text",
      });

      setMessage("");
      refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
    }
  };

  const handlePickMedia = async (type: "camera" | "gallery") => {
    try {
      let result;

      if (type === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission Required", "Camera access is needed to take photos");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images", "videos"],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Photo library access is needed to select media"
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images", "videos"],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: EncodingType.Base64,
        });

        // Upload to S3
        const uploadResult = await uploadFileMutation.mutateAsync({
          fileName: `chat-${Date.now()}.${asset.type === "video" ? "mp4" : "jpg"}`,
          fileData: base64,
          contentType: asset.type === "video" ? "video/mp4" : "image/jpeg",
        });

        // Send message with media URL
        await sendMessageMutation.mutateAsync({
          chatId: Number(chatId),
          content: asset.type === "video" ? "📹 Video" : "📷 Photo",
          messageType: asset.type === "video" ? "video" : "image",
          mediaUrl: uploadResult.url,
        });

        setIsUploading(false);
        refetch();
      }
    } catch (error) {
      setIsUploading(false);
      Alert.alert("Error", "Failed to upload media");
    }
  };

  const handleSubmitToSocial = async (mediaUrl: string, messageContent: string) => {
    try {
      await submitToSocialMutation.mutateAsync({
        messageId: 0, // TODO: Get actual message ID from chat message
        caption: messageContent,
        platforms: ["instagram", "twitter"], // Default platforms
      });

      Alert.alert(
        "Submitted!",
        "Your content has been submitted to the social media manager for review."
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit content");
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = (msg: any) => {
    const isOwn = msg.senderId === user?.id;

    return (
      <View
        key={msg.id}
        className={`mb-3 ${isOwn ? "items-end" : "items-start"}`}
      >
        {/* Sender Name (for others' messages) */}
        {!isOwn && (
          <Text className="text-xs text-muted leading-relaxed mb-1 ml-2">{msg.senderName}</Text>
        )}

        {/* Message Bubble */}
        <View
          className={`max-w-[80%] rounded-2xl p-3 ${
            isOwn ? "bg-primary" : "bg-surface border border-border"
          }`}
        >
          {/* Media */}
          {msg.mediaUrl && (
            <View className="mb-2">
              {msg.messageType === "image" ? (
                <Image
                  source={{ uri: msg.mediaUrl }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-48 bg-black/20 rounded-lg items-center justify-center">
                  <Ionicons name="play-circle" size={48} color="white" />
                </View>
              )}

              {/* Submit to Social Media Button (only for own media messages) */}
              {isOwn && (
                <TouchableOpacity
                  onPress={() => handleSubmitToSocial(msg.mediaUrl, msg.content)}
                  className="flex-row items-center justify-center mt-2 py-2 px-3 bg-white/20 rounded-lg"
                >
                  <Ionicons name="share-social" size={16} color="white" />
                  <Text className="text-white text-xs font-medium ml-1">
                    Submit to Social Media
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Text Content */}
          <Text className={`text-sm ${isOwn ? "text-white" : "text-foreground"}`}>
            {msg.content}
          </Text>

          {/* Timestamp */}
          <Text
            className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-muted"}`}
          >
            {formatTime(msg.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <View className="flex-row items-center flex-1">
          
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
              {chat?.name || "Loading..."}
            </Text>
            {chat && (
              <Text className="text-xs text-muted leading-relaxed">
                {chat.memberCount} {chat.memberCount === 1 ? "member" : "members"}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {!messages || messages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="chatbubbles-outline" size={48} color={colors.muted} />
            <Text className="text-sm text-muted mt-2">No messages yet</Text>
            <Text className="text-xs text-muted leading-relaxed text-center mt-1 px-6">
              Start the conversation by sending a message or sharing a photo/video
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}

        {isUploading && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-sm text-muted mt-2">Uploading...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View className="border-t border-border p-4 bg-background">
        <View className="flex-row items-center gap-2">
          {/* Media Buttons */}
          <TouchableOpacity
            onPress={() => handlePickMedia("camera")}
            disabled={isUploading}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="camera" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handlePickMedia("gallery")}
            disabled={isUploading}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="image" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            className="flex-1 bg-surface border border-border rounded-full px-4 py-2 text-foreground"
            multiline
            maxLength={500}
          />

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="w-10 h-10 items-center justify-center"
            style={{ opacity: !message.trim() ? 0.4 : 1 }}
          >
            <Ionicons name="send" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
