import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { useState } from "react";

// Mock notifications data (will be replaced with real API)
const mockNotifications = [
  {
    id: 1,
    title: "Welcome to Change In Youth!",
    message: "Thank you for joining our team. Complete your profile and training modules to get started.",
    type: "info",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 2,
    title: "New Session Assigned",
    message: "You've been assigned to 'Positive ID Workshop - Session 1' on Jan 12, 2026",
    type: "session",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: 3,
    title: "Training Reminder",
    message: "Please complete your required 'Safeguarding Essentials' training module.",
    type: "training",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 4,
    title: "Payment Processed",
    message: "Your payment for January sessions (£240.00) has been processed successfully.",
    type: "payment",
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];

export default function NotificationsScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);

  if (authLoading) {
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
            Sign in to view notifications
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "session":
        return "📅";
      case "training":
        return "📚";
      case "payment":
        return "💰";
      case "info":
        return "ℹ️";
      default:
        return "🔔";
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllAsRead}>
                <Text className="text-primary text-sm font-semibold">Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">Notifications</Text>
              {unreadCount > 0 && (
                <Text className="text-base text-muted mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        {notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-6xl mb-4">🔔</Text>
            <Text className="text-xl font-semibold text-foreground text-center">
              No Notifications
            </Text>
            <Text className="text-base text-muted text-center mt-2">
              You're all caught up!
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`rounded-2xl p-4 border active:opacity-70 ${
                  item.read
                    ? "bg-surface border-border"
                    : "bg-primary/5 border-primary/20"
                }`}
                onPress={() => handleMarkAsRead(item.id)}
              >
                <View className="flex-row items-start gap-3">
                  <Text className="text-3xl">{getNotificationIcon(item.type)}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        className={`text-base font-semibold ${
                          item.read ? "text-foreground" : "text-primary"
                        }`}
                      >
                        {item.title}
                      </Text>
                      {!item.read && (
                        <View className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </View>
                    <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                      {item.message}
                    </Text>
                    <Text className="text-xs text-muted leading-relaxed mt-2">
                      {getTimeAgo(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
