import axios from "axios";

interface PushNotificationData {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send a push notification using Expo Push Notification service
 */
export async function sendPushNotification(notification: PushNotificationData): Promise<void> {
  try {
    await axios.post("https://exp.host/--/api/v2/push/send", {
      to: notification.to,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    });
  } catch (error) {
    console.error("Failed to send push notification:", error);
    // Don't throw - notifications are not critical
  }
}

/**
 * Send multiple push notifications in batch
 */
export async function sendBatchPushNotifications(
  notifications: PushNotificationData[]
): Promise<void> {
  try {
    await axios.post(
      "https://exp.host/--/api/v2/push/send",
      notifications.map((n) => ({
        to: n.to,
        sound: "default",
        title: n.title,
        body: n.body,
        data: n.data || {},
      }))
    );
  } catch (error) {
    console.error("Failed to send batch push notifications:", error);
  }
}
