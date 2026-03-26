import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenWithBackButton } from "@/components/screen-with-back-button";
import { useAuthContext } from "@/contexts/auth-context";
import { router, useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";

export default function ConversationScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const params = useLocalSearchParams();
  const otherUserId = Number(params.userId);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [message, setMessage] = useState("");
  
  const { data: messages, isLoading, refetch } = trpc.privateMessages.getConversation.useQuery(
    { otherUserId },
    { enabled: isAuthenticated && !isNaN(otherUserId) }
  );
  
  const sendMessageMutation = trpc.privateMessages.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });
  
  const markAsReadMutation = trpc.privateMessages.markAsRead.useMutation();
  
  // Mark unread messages as read when viewing conversation
  useEffect(() => {
    if (messages && user) {
      const unreadMessages = messages.filter(
        m => m.recipientId === user.id && !m.isRead
      );
      unreadMessages.forEach(m => markAsReadMutation.mutate({ messageId: m.id }));
    }
  }, [messages, user]);
  
  if (authLoading || isLoading) {
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
            Sign in to view messages
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
  
  const handleSend = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      recipientId: otherUserId,
      content: message.trim(),
    });
  };
  
  // Reverse messages to show oldest first
  const sortedMessages = messages ? [...messages].reverse() : [];
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={90}
    >
      <ScreenWithBackButton>
        <View className="flex-1">
          {/* Header */}
          <View className="p-6 pb-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground">Private Conversation</Text>
                <Text className="text-sm text-muted leading-relaxed">User ID: {otherUserId}</Text>
              </View>
            </View>
          </View>
          
          {/* Messages */}
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 24, paddingBottom: 16, gap: 12 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {sortedMessages.length > 0 ? (
              sortedMessages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                const messageDate = new Date(msg.createdAt);
                
                return (
                  <View
                    key={msg.id}
                    className={`flex-row ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <View
                      className={`max-w-[75%] rounded-2xl p-4 ${
                        isMine 
                          ? "bg-primary" 
                          : "bg-surface border border-border"
                      }`}
                    >
                      <Text className={`text-base ${isMine ? "text-background" : "text-foreground"}`}>
                        {msg.content}
                      </Text>
                      <Text className={`text-xs mt-2 ${isMine ? "text-background/70" : "text-muted"}`}>
                        {messageDate.toLocaleDateString()} at{" "}
                        {messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="items-center justify-center py-12">
                <Text className="text-base text-muted text-center leading-relaxed">
                  No messages yet. Start the conversation!
                </Text>
              </View>
            )}
          </ScrollView>
          
          {/* Message Input */}
          <View className="p-4 border-t border-border bg-background">
            <View className="flex-row gap-2">
              <TextInput
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="Type your message..."
                placeholderTextColor="#9BA1A6"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                className="bg-primary w-12 h-12 rounded-xl items-center justify-center active:opacity-80"
                onPress={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <Text className="text-background text-xl">➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScreenWithBackButton>
    </KeyboardAvoidingView>
  );
}
