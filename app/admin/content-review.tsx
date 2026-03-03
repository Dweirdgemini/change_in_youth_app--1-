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
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function ContentReviewScreen() {
  const colors = useColors();
  const [selectedContent, setSelectedContent] = useState<number | null>(null);
  const [views, setViews] = useState("");
  const [reach, setReach] = useState("");

  const utils = trpc.useUtils();
  const { data: pendingContent, isLoading } = trpc.contentSharing.getPendingContent.useQuery();

  const approveMutation = trpc.contentSharing.approveContent.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      utils.contentSharing.getPendingContent.invalidate();
      setSelectedContent(null);
      setViews("");
      setReach("");
      Alert.alert("Success", "Content approved and ready for social media!");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const rejectMutation = trpc.contentSharing.rejectContent.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      utils.contentSharing.getPendingContent.invalidate();
      setSelectedContent(null);
      Alert.alert("Success", "Content rejected");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleApprove = (contentId: number) => {
    Alert.alert(
      "Approve Content",
      "Enter engagement metrics (optional)",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: () => {
            approveMutation.mutate({
              contentId,
              views: views ? parseInt(views) : undefined,
              reach: reach ? parseInt(reach) : undefined,
            });
          },
        },
      ]
    );
  };

  const handleReject = (contentId: number) => {
    Alert.alert(
      "Reject Content",
      "Are you sure you want to reject this content?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            rejectMutation.mutate({
              contentId,
              rejectionReason: "Not suitable for social media",
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Content Review
          </Text>
          <Text className="text-sm text-muted leading-relaxed">
            Review and approve content for social media
          </Text>
        </View>

        {/* Pending Content */}
        {pendingContent && pendingContent.length > 0 ? (
          <View className="gap-4">
            {pendingContent.map((content) => (
              <View
                key={content.id}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                {/* Content Preview */}
                <Image
                  source={{ uri: content.contentUrl }}
                  className="w-full h-64 rounded-xl mb-4"
                  resizeMode="cover"
                />

                {/* Content Info */}
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-base font-semibold text-foreground flex-1">
                      {content.sessionTitle}
                    </Text>
                    <View className="bg-warning/20 px-3 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-warning uppercase">
                        {content.contentType}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted mb-2">
                    By {content.uploaderName} • {new Date(content.createdAt).toLocaleDateString()}
                  </Text>
                  {content.caption && (
                    <Text className="text-sm text-foreground mt-2 leading-relaxed">
                      {content.caption}
                    </Text>
                  )}
                </View>

                {/* Engagement Metrics Input */}
                {selectedContent === content.id && (
                  <View className="mb-4 p-4 bg-primary/5 rounded-xl">
                    <Text className="text-sm font-semibold text-foreground mb-3">
                      Add Engagement Metrics (Optional)
                    </Text>
                    <View className="flex-row gap-2 mb-2">
                      <View className="flex-1">
                        <Text className="text-xs text-muted leading-relaxed mb-1">Views</Text>
                        <TextInput
                          value={views}
                          onChangeText={setViews}
                          placeholder="0"
                          placeholderTextColor={colors.muted}
                          keyboardType="number-pad"
                          className="bg-surface border border-border rounded-lg p-3 text-foreground"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-muted leading-relaxed mb-1">Reach</Text>
                        <TextInput
                          value={reach}
                          onChangeText={setReach}
                          placeholder="0"
                          placeholderTextColor={colors.muted}
                          keyboardType="number-pad"
                          className="bg-surface border border-border rounded-lg p-3 text-foreground"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleReject(content.id)}
                    disabled={rejectMutation.isPending}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    className="flex-1 bg-error rounded-xl py-3"
                  >
                    {rejectMutation.isPending && selectedContent === content.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-center text-white font-semibold">
                        Reject
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      if (selectedContent === content.id) {
                        handleApprove(content.id);
                      } else {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedContent(content.id);
                      }
                    }}
                    disabled={approveMutation.isPending}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    className="flex-1 bg-success rounded-xl py-3"
                  >
                    {approveMutation.isPending && selectedContent === content.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-center text-white font-semibold">
                        {selectedContent === content.id ? "Confirm Approve" : "Approve"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center justify-center py-12">
            <Text className="text-6xl mb-4">✅</Text>
            <Text className="text-base text-muted text-center leading-relaxed">
              No pending content to review
            </Text>
            <Text className="text-sm text-muted text-center mt-2">
              All content has been reviewed!
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
