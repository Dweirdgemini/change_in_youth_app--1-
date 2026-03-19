import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getItem } from '@/lib/storage';

export default function TeamChatScreen() {
  const colors = useColors();
  const { data: channels, isLoading } = trpc.teamChats.getMyChannels.useQuery();
  const { data: unreadCounts } = trpc.teamChats.getUnreadCounts.useQuery();
  
  const getUnreadCount = (channelId: number) => {
    return unreadCounts?.find(c => c.channelId === channelId)?.unreadCount || 0;
  };

  // Auto-redirect to Team Chat if it's the only channel
  useEffect(() => {
    if (channels && channels.length === 1) {
      const getDevMode = async () => {
        const urlParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('dev_mode') : null;
        const storageDevMode = await getItem('dev_mode');
        const devMode = urlParam || storageDevMode;
        const url = devMode ? `/team-chat/${channels[0].id}?dev_mode=true` : `/team-chat/${channels[0].id}`;
        router.replace(url as any);
      };
      getDevMode();
    }
  }, [channels]);

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              
              <View>
                <Text className="text-2xl font-bold text-foreground">Team Channels</Text>
                <Text className="text-sm text-muted mt-0.5">
                  {channels?.length || 0} channels
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/team-chat/create" as any)}
              className="bg-primary px-4 py-2 rounded-full active:opacity-80"
            >
              <Text className="text-white font-semibold text-sm">+ Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1">
          {channels && channels.length > 0 ? (
            <View className="p-4 gap-3">
              {channels.map((channel) => (
                <TouchableOpacity
                  key={channel.id}
                  onPress={async () => {
                    const urlParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('dev_mode') : null;
                    const storageDevMode = await getItem('dev_mode');
                    const devMode = urlParam || storageDevMode;
                    const url = devMode ? `/team-chat/${channel.id}?dev_mode=true` : `/team-chat/${channel.id}`;
                    router.push(url as any);
                  }}
                  className="bg-surface rounded-xl p-4 border border-border active:opacity-70"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                          <Text className="text-primary font-bold text-lg">
                            {channel.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">
                            {channel.name}
                          </Text>
                          {channel.description && (
                            <Text className="text-sm text-muted mt-0.5" numberOfLines={1}>
                              {channel.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      <View className="flex-row items-center gap-4 mt-3">
                        <View className="flex-row items-center gap-1">
                          <IconSymbol name="person.2.fill" size={14} color={colors.muted} />
                          <Text className="text-xs text-muted leading-relaxed">
                            {channel.memberCount} members
                          </Text>
                        </View>
                        {channel.lastMessageAt && (
                          <Text className="text-xs text-muted leading-relaxed">
                            Last: {new Date(channel.lastMessageAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View className="flex-row items-center gap-2">
                      {getUnreadCount(channel.id) > 0 && (
                        <View 
                          className="bg-primary rounded-full min-w-[24px] h-6 px-2 items-center justify-center"
                        >
                          <Text className="text-white font-bold text-xs">
                            {getUnreadCount(channel.id)}
                          </Text>
                        </View>
                      )}
                      <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center p-8">
              <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-4">
                <IconSymbol name="bubble.left.and.bubble.right.fill" size={40} color={colors.muted} />
              </View>
              <Text className="text-lg font-semibold text-foreground text-center">
                No Channels Yet
              </Text>
              <Text className="text-sm text-muted text-center mt-2">
                Click "+ Create" to start a new team channel
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
