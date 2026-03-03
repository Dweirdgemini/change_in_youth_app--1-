import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState, useRef, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChannelChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const channelId = parseInt(id || "0");
  
  // Redirect if invalid channel ID (like "create")
  useEffect(() => {
    if (isNaN(channelId) || channelId === 0) {
      router.replace("/team-chat");
    }
  }, [channelId]);
  
  const [message, setMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { data: messages, isLoading, refetch } = trpc.teamChats.getChannelMessages.useQuery({ channelId });
  const sendMessageMutation = trpc.teamChats.sendMessage.useMutation();
  const markAsReadMutation = trpc.teamChats.markChannelAsRead.useMutation();
  const utils = trpc.useUtils();

  // Mark as read when opening and auto-refresh messages
  useEffect(() => {
    // Mark as read immediately
    markAsReadMutation.mutate({ channelId });
    
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [channelId]);

  const handleSend = async () => {
    console.log('[Frontend] handleSend called', { channelId, messageLength: message.length });
    
    if (!message.trim()) {
      console.log('[Frontend] Message is empty, returning');
      return;
    }
    
    const messageText = message.trim();
    setMessage("");
    
    console.log('[Frontend] Calling sendMessage mutation...', { channelId, messageText });
    
    try {
      await sendMessageMutation.mutateAsync({
        channelId,
        message: messageText,
      });
      
      console.log('[Frontend] Message sent successfully');
      
      // Invalidate and refetch messages
      await utils.teamChats.getChannelMessages.invalidate({ channelId });
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[Frontend] Failed to send message:', error);
      console.error('[Frontend] Error details:', JSON.stringify(error, null, 2));
      setMessage(messageText); // Restore message on error
      alert('Failed to send message: ' + (error as any)?.message || 'Unknown error');
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-border flex-row items-center gap-3">
          
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">
              {messages?.[0]?.channelName || "Team Chat"}
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              {messages?.length || 0} messages
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push(`/team-chat/${channelId}/export`)}
            className="active:opacity-50"
          >
            <IconSymbol name="square.and.arrow.up" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages && messages.length > 0 ? (
            <View className="gap-3">
              {messages.map((msg) => (
                <View key={msg.id} className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                      <Text className="text-primary font-semibold text-xs">
                        {msg.userName?.charAt(0).toUpperCase() || "U"}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-foreground">
                      {msg.userName || `User ${msg.userId}`}
                    </Text>
                    <Text className="text-xs text-muted leading-relaxed">
                      {new Date(msg.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <View className="ml-10 bg-surface rounded-lg p-3 border border-border">
                    <Text className="text-sm text-foreground leading-relaxed">
                      {msg.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-12">
              <View className="w-16 h-16 rounded-full bg-surface items-center justify-center mb-3">
                <IconSymbol name="bubble.left.and.bubble.right" size={32} color={colors.muted} />
              </View>
              <Text className="text-base font-semibold text-foreground">
                No messages yet
              </Text>
              <Text className="text-sm text-muted text-center mt-1">
                Start the conversation
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Message Input */}
        <View 
          className="px-4 py-3 border-t border-border bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-row items-center gap-2">
            <View className="flex-1 bg-surface rounded-full px-4 py-3 border border-border">
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor={colors.muted}
                className="text-sm text-foreground"
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="w-10 h-10 rounded-full bg-primary items-center justify-center active:opacity-70"
              style={{
                opacity: !message.trim() || sendMessageMutation.isPending ? 0.5 : 1
              }}
            >
              {sendMessageMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol name="paperplane.fill" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
