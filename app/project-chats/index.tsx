import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ProjectChatsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: chats, isLoading } = trpc.projectChat.getMyChats.useQuery();

  const formatLastMessage = (timestamp: Date | string | null) => {
    if (!timestamp) return "No messages yet";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <View className="flex-row items-center">
          
          <Text className="text-xl font-bold text-foreground">Project Chats</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/project-chats/create" as any)}
          style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !chats || chats.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="chatbubbles-outline" size={64} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4">
            No Project Chats
          </Text>
          <Text className="text-sm text-muted text-center mt-2">
            You haven't been added to any project chats yet. Contact your admin to join
            a project team.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          <View className="p-4">
            {/* Info Banner */}
            <View className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
              <Text className="text-sm text-foreground">
                💬 Share photos and videos with your project team. Submit content for
                social media approval by tapping the share icon on any media message.
              </Text>
            </View>

            {/* Chat List */}
            {chats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                onPress={() => router.push(`/project-chats/${chat.id}` as any)}
                className="flex-row items-center p-4 bg-surface rounded-xl border border-border mb-3"
              >
                {/* Chat Icon */}
                <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="people" size={24} color={colors.primary} />
                </View>

                {/* Chat Info */}
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {chat.name}
                  </Text>
                  <Text className="text-sm text-muted mt-1" numberOfLines={1}>
                    {chat.lastMessage?.content || "No messages yet"}
                  </Text>
                </View>

                {/* Metadata */}
                <View className="items-end ml-2">
                  <Text className="text-xs text-muted leading-relaxed">
                    {formatLastMessage(chat.lastMessage?.createdAt || null)}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="people-outline" size={14} color={colors.muted} />
                    <Text className="text-xs text-muted leading-relaxed ml-1">{chat.memberCount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
