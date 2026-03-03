import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

export default function AnnouncementsScreen() {
  const { data: announcements, refetch } = trpc.organizations.getAnnouncements.useQuery();
  const markRead = trpc.organizations.markAnnouncementRead.useMutation({
    onSuccess: () => refetch(),
  });

  const handleMarkRead = (announcementId: number) => {
    markRead.mutate({ announcementId });
  };

  const unreadCount = Array.isArray(announcements) ? announcements.filter((a: any) => a.status === "unread" || !a.status).length : 0;

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-4">
          

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">System Announcements</Text>
              <Text className="text-sm text-muted mt-1">
                Platform updates and new features
              </Text>
            </View>
            {unreadCount > 0 && (
              <View className="bg-error px-3 py-1 rounded-full">
                <Text className="text-background font-bold text-sm">{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Announcements List */}
        <View className="gap-4">
          {Array.isArray(announcements) && announcements.length === 0 && (
            <View className="bg-surface border border-border rounded-2xl p-8 items-center">
              <Text className="text-muted text-center">No announcements yet</Text>
            </View>
          )}

          {Array.isArray(announcements) && announcements.map((announcement: any) => {
            const isUnread = announcement.status === "unread" || !announcement.status;
            const isPaid = announcement.is_paid_update;

            return (
              <TouchableOpacity
                key={announcement.id}
                className={`border rounded-2xl p-4 ${
                  isUnread ? "bg-primary/5 border-primary" : "bg-surface border-border"
                }`}
                onPress={() => handleMarkRead(announcement.id)}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-4">
                    <Text className={`text-base font-bold ${isUnread ? "text-primary" : "text-foreground"}`}>
                      {announcement.title}
                    </Text>
                    <Text className="text-xs text-muted leading-relaxed mt-1">
                      {new Date(announcement.published_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {isUnread && (
                    <View className="bg-primary w-2 h-2 rounded-full" />
                  )}
                </View>

                <Text className="text-sm text-foreground mt-2 leading-relaxed">
                  {announcement.message}
                </Text>

                {isPaid && announcement.cost && (
                  <View className="mt-3 pt-3 border-t border-border">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-warning">
                        Paid Update: £{announcement.cost}/month
                      </Text>
                      <TouchableOpacity className="bg-primary px-4 py-2 rounded-lg">
                        <Text className="text-background font-semibold text-xs">Upgrade</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {!isPaid && announcement.auto_install && (
                  <View className="mt-3 pt-3 border-t border-border">
                    <Text className="text-xs text-success">
                      ✓ Auto-installed (Free update)
                    </Text>
                  </View>
                )}

                {announcement.feature_slug && (
                  <View className="mt-3">
                    <View className="bg-primary/10 px-3 py-1 rounded-full self-start">
                      <Text className="text-xs font-semibold text-primary capitalize">
                        {announcement.feature_slug.replace(/_/g, " ")}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
