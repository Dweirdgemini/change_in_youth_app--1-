import { getDb } from "../db";
import { users, channelMembers } from "../../drizzle/schema";
import { eq, and, ne } from "drizzle-orm";

interface SendChatNotificationParams {
  channelId: number;
  channelName: string;
  senderId: number;
  senderName: string;
  message: string;
}

/**
 * Send push notification to all channel members except the sender
 */
export async function sendChatNotification(params: SendChatNotificationParams) {
  const { channelId, channelName, senderId, senderName, message } = params;
  
  try {
    const db = await getDb();
    
    // Get all channel members except sender
    const members = await db
      .select({
        userId: channelMembers.userId,
        pushToken: users.pushToken,
        notificationPreferences: users.notificationPreferences,
      })
      .from(channelMembers)
      .innerJoin(users, eq(channelMembers.userId, users.id))
      .where(
        and(
          eq(channelMembers.channelId, channelId),
          ne(channelMembers.userId, senderId)
        )
      );
    
    // Filter members who have push tokens and haven't muted this channel
    const recipientsWithTokens = members.filter(member => {
      if (!member.pushToken) return false;
      
      // Check if user has muted this channel
      try {
        const prefs = member.notificationPreferences 
          ? JSON.parse(member.notificationPreferences as string)
          : {};
        const mutedChannels = prefs.mutedChannels || [];
        return !mutedChannels.includes(channelId);
      } catch {
        return true; // If parsing fails, assume not muted
      }
    });
    
    if (recipientsWithTokens.length === 0) {
      return { sent: 0 };
    }
    
    // Prepare notification payload
    const messagePreview = message.length > 100 
      ? message.substring(0, 100) + "..." 
      : message;
    
    const notifications = recipientsWithTokens.map(recipient => ({
      to: recipient.pushToken!,
      sound: "default",
      title: `${senderName} in ${channelName}`,
      body: messagePreview,
      data: {
        type: "chat_message",
        channelId,
        channelName,
        senderId,
        senderName,
      },
      categoryId: "chat_message",
      priority: "default" as const,
    }));
    
    // Send notifications using Expo Push Notification service
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(notifications),
    });
    
    if (!response.ok) {
      console.error("Failed to send push notifications:", await response.text());
      return { sent: 0, error: "Failed to send notifications" };
    }
    
    const result = await response.json();
    console.log("Push notifications sent:", result);
    
    return { sent: notifications.length, result };
  } catch (error) {
    console.error("Error sending chat notification:", error);
    return { sent: 0, error: String(error) };
  }
}

/**
 * Register push token for user
 */
export async function registerPushToken(userId: number, pushToken: string) {
  try {
    const db = await getDb();
    
    await db
      .update(users)
      .set({ pushToken })
      .where(eq(users.id, userId));
    
    return { success: true };
  } catch (error) {
    console.error("Error registering push token:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Update notification preferences for user
 */
export async function updateNotificationPreferences(
  userId: number, 
  preferences: { mutedChannels?: number[] }
) {
  try {
    const db = await getDb();
    
    await db
      .update(users)
      .set({ 
        notificationPreferences: JSON.stringify(preferences) 
      })
      .where(eq(users.id, userId));
    
    return { success: true };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: String(error) };
  }
}
