import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

// Create a new Expo SDK client
const expo = new Expo();

export interface PushNotificationData {
  userId: number;
  expoPushToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send push notification to a single user
 */
export async function sendPushNotification(notification: PushNotificationData): Promise<void> {
  // Check that the token is valid
  if (!Expo.isExpoPushToken(notification.expoPushToken)) {
    console.error(`Push token ${notification.expoPushToken} is not a valid Expo push token`);
    return;
  }

  // Construct the message
  const message: ExpoPushMessage = {
    to: notification.expoPushToken,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
  };

  try {
    // Send the notification
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log("Push notification sent:", tickets);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

/**
 * Send push notifications to multiple users
 */
export async function sendBulkPushNotifications(
  notifications: PushNotificationData[]
): Promise<void> {
  // Filter out invalid tokens
  const messages: ExpoPushMessage[] = notifications
    .filter((notif) => Expo.isExpoPushToken(notif.expoPushToken))
    .map((notif) => ({
      to: notif.expoPushToken,
      sound: "default",
      title: notif.title,
      body: notif.body,
      data: notif.data || {},
    }));

  // Split into chunks (Expo recommends max 100 per request)
  const chunks = expo.chunkPushNotifications(messages);

  try {
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      console.log(`Sent ${tickets.length} push notifications`);
    }
  } catch (error) {
    console.error("Error sending bulk push notifications:", error);
  }
}

/**
 * Send notification when invoice is approved
 */
export async function notifyInvoiceApproved(
  userId: number,
  expoPushToken: string,
  invoiceNumber: string,
  amount: string
): Promise<void> {
  await sendPushNotification({
    userId,
    expoPushToken,
    title: "Invoice Approved! 🎉",
    body: `Your invoice ${invoiceNumber} for £${amount} has been approved and will be paid soon.`,
    data: { type: "invoice_approved", invoiceNumber },
  });
}

/**
 * Send notification when invoice is paid
 */
export async function notifyInvoicePaid(
  userId: number,
  expoPushToken: string,
  invoiceNumber: string,
  amount: string
): Promise<void> {
  await sendPushNotification({
    userId,
    expoPushToken,
    title: "Payment Received! 💰",
    body: `£${amount} has been paid for invoice ${invoiceNumber}. Check your earnings dashboard.`,
    data: { type: "invoice_paid", invoiceNumber },
  });
}

/**
 * Send notification when new session is assigned
 */
export async function notifySessionAssigned(
  userId: number,
  expoPushToken: string,
  sessionTitle: string,
  sessionDate: Date
): Promise<void> {
  await sendPushNotification({
    userId,
    expoPushToken,
    title: "New Session Assigned 📅",
    body: `You've been assigned to "${sessionTitle}" on ${sessionDate.toLocaleDateString()}.`,
    data: { type: "session_assigned", sessionTitle },
  });
}

/**
 * Send notification when DBS is expiring soon
 */
export async function notifyDBSExpiring(
  userId: number,
  expoPushToken: string,
  daysUntilExpiry: number
): Promise<void> {
  await sendPushNotification({
    userId,
    expoPushToken,
    title: "DBS Certificate Expiring Soon ⚠️",
    body: `Your DBS certificate expires in ${daysUntilExpiry} days. Please renew it as soon as possible.`,
    data: { type: "dbs_expiring", daysUntilExpiry },
  });
}
