import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function SocialMediaManagerScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedTab, setSelectedTab] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );

  const { data: submissions, refetch } = trpc.socialMedia.getPendingSubmissions.useQuery(
    undefined,
    { refetchInterval: 10000 } // Poll every 10 seconds
  );

  const approveMutation = trpc.socialMedia.approveSubmission.useMutation();
  const rejectMutation = trpc.socialMedia.rejectSubmission.useMutation();

  const handleApprove = async (submissionId: number, platform: string) => {
    try {
      await approveMutation.mutateAsync({
        submissionId,
        reviewNotes: `Approved for ${platform}`,
      });

      Alert.alert("Approved!", "Content has been posted to social media.");
      refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to approve submission");
    }
  };

  const handleReject = async (submissionId: number, reason: string) => {
    try {
      await rejectMutation.mutateAsync({
        submissionId,
        reviewNotes: reason,
      });

      Alert.alert("Rejected", "Submission has been rejected.");
      refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to reject submission");
    }
  };

  const showApproveOptions = (submission: any) => {
    Alert.alert(
      "Approve & Post",
      "Select where to post this content:",
      [
        {
          text: "Instagram",
          onPress: () => handleApprove(submission.id, "instagram"),
        },
        {
          text: "Twitter",
          onPress: () => handleApprove(submission.id, "twitter"),
        },
        {
          text: "Both",
          onPress: () => handleApprove(submission.id, "both"),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const showRejectDialog = (submission: any) => {
    Alert.prompt(
      "Reject Submission",
      "Please provide a reason for rejection:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          onPress: (reason) => handleReject(submission.id, reason || "No reason provided"),
        },
      ],
      "plain-text"
    );
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <View className="flex-row items-center">
          
          <Text className="text-xl font-bold text-foreground">Social Media Manager</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/social-media/leaderboard" as any)}>
          <Ionicons name="trophy" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View className="flex-row p-2 border-b border-border">
        <TouchableOpacity
          onPress={() => setSelectedTab("pending")}
          className={`flex-1 py-3 rounded-lg ${
            selectedTab === "pending" ? "bg-primary" : "bg-transparent"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              selectedTab === "pending" ? "text-white" : "text-muted"
            }`}
          >
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab("approved")}
          className={`flex-1 py-3 rounded-lg ${
            selectedTab === "approved" ? "bg-success" : "bg-transparent"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              selectedTab === "approved" ? "text-white" : "text-muted"
            }`}
          >
            Approved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab("rejected")}
          className={`flex-1 py-3 rounded-lg ${
            selectedTab === "rejected" ? "bg-error" : "bg-transparent"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              selectedTab === "rejected" ? "text-white" : "text-muted"
            }`}
          >
            Rejected
          </Text>
        </TouchableOpacity>
      </View>

      {/* Submissions List */}
      <ScrollView className="flex-1">
        <View className="p-4">
          {!submissions || submissions.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground mt-4">
                No Pending Submissions
              </Text>
              <Text className="text-sm text-muted text-center mt-2 px-6">
                All caught up! New submissions will appear here for review.
              </Text>
            </View>
          ) : (
            submissions.map((submission) => (
              <View
                key={submission.id}
                className="bg-surface rounded-xl border border-border p-4 mb-4"
              >
                {/* Submitter Info */}
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary font-semibold">
                      {submission.submitterName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {submission.submitterName}
                    </Text>
                    <Text className="text-xs text-muted leading-relaxed">{submission.submitterEmail}</Text>
                  </View>
                  <Text className="text-xs text-muted leading-relaxed">{formatTime(submission.submittedAt)}</Text>
                </View>

                {/* Media */}
                {submission.mediaUrl && (
                  <Image
                    source={{ uri: submission.mediaUrl }}
                    className="w-full h-64 rounded-lg mb-3"
                    resizeMode="cover"
                  />
                )}

                {/* Caption */}
                <Text className="text-sm text-foreground mb-4">{submission.caption}</Text>

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => showApproveOptions(submission)}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-success rounded-lg py-3"
                  >
                    <Text className="text-white text-center font-semibold">
                      ✓ Approve & Post
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => showRejectDialog(submission)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 bg-error rounded-lg py-3"
                  >
                    <Text className="text-white text-center font-semibold">✗ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
