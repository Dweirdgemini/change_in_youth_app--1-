import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/contexts/auth-context";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function MessagesScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  
  const { data: conversations, isLoading } = trpc.privateMessages.getConversationList.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: unreadCount } = trpc.privateMessages.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  if (authLoading || isLoading) {
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
            Sign in to view messages
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
  
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Private Messages</Text>
              <Text className="text-base text-muted mt-1">
                {unreadCount && unreadCount.count > 0 
                  ? `${unreadCount.count} unread message${unreadCount.count > 1 ? "s" : ""}`
                  : "All caught up"}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-primary w-12 h-12 rounded-full items-center justify-center active:opacity-80"
              onPress={() => router.push("/messages/new" as any)}
            >
              <Text className="text-background text-2xl font-bold">+</Text>
            </TouchableOpacity>
          </View>
          
          {/* Info Banner */}
          <View className="bg-[#F5A962]/10 border border-[#F5A962]/30 rounded-2xl p-4">
            <Text className="text-sm text-foreground">
              🔒 <Text className="font-semibold">Private & Secure</Text>
            </Text>
            <Text className="text-sm text-muted mt-1">
              Messages are only visible to you, the recipient, and admins
            </Text>
          </View>
          
          {/* Conversations List */}
          {conversations && conversations.length > 0 ? (
            <View className="gap-3">
              {conversations.map((conversation) => {
                const lastMessageDate = conversation.lastMessage 
                  ? new Date(conversation.lastMessage.createdAt)
                  : null;
                
                const isUnread = conversation.unreadCount > 0;
                
                return (
                  <TouchableOpacity
                    key={conversation.user.id}
                    className={`bg-surface rounded-2xl p-4 border active:opacity-70 ${
                      isUnread ? "border-primary" : "border-border"
                    }`}
                    onPress={() => router.push(`/messages/${conversation.user.id}` as any)}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className={`text-lg font-semibold ${isUnread ? "text-primary" : "text-foreground"}`}>
                            {conversation.user.name || "Unknown User"}
                          </Text>
                          {isUnread && (
                            <View className="bg-primary w-6 h-6 rounded-full items-center justify-center">
                              <Text className="text-background text-xs font-bold">
                                {conversation.unreadCount}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        {conversation.user.email && (
                          <Text className="text-sm text-muted mt-1">{conversation.user.email}</Text>
                        )}
                        
                        {conversation.lastMessage && (
                          <Text className="text-sm text-muted mt-2" numberOfLines={2}>
                            {conversation.lastMessage.content}
                          </Text>
                        )}
                      </View>
                      
                      {lastMessageDate && (
                        <Text className="text-xs text-muted leading-relaxed">
                          {lastMessageDate.toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-base text-muted text-center leading-relaxed">
                No conversations yet
              </Text>
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-full mt-4 active:opacity-80"
                onPress={() => router.push("/messages/new" as any)}
              >
                <Text className="text-background font-semibold">Start a Conversation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
