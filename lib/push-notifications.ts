/**
 * Push Notifications Utility
 * 
 * Handles sending push notifications to users for session events
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as Notifications.NotificationBehavior),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false; // Push notifications not supported on web
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Get push token for this device
 */
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // TODO: Replace with actual Expo project ID
    });
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Send local notification (for testing)
 */
export async function sendLocalNotification(title: string, body: string, data?: any) {
  if (Platform.OS === 'web') {
    console.log('Local notification (web):', title, body);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Notification types
 */
export interface SessionAssignedNotification {
  type: 'session_assigned';
  sessionId: number;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
}

export interface SessionRejectedNotification {
  type: 'session_rejected';
  sessionId: number;
  sessionTitle: string;
  facilitatorName: string;
  rejectionReason?: string;
}

export interface FeedbackReminderNotification {
  type: 'feedback_reminder';
  sessionId: number;
  sessionTitle: string;
  completedCount: number;
  expectedCount: number;
}

export type NotificationData = 
  | SessionAssignedNotification 
  | SessionRejectedNotification 
  | FeedbackReminderNotification;

/**
 * Format notification for session assignment
 */
export function formatSessionAssignedNotification(
  sessionTitle: string,
  sessionDate: string,
  sessionTime: string
): { title: string; body: string } {
  return {
    title: '📅 New Session Assigned',
    body: `You've been assigned to "${sessionTitle}" on ${sessionDate} at ${sessionTime}`,
  };
}

/**
 * Format notification for session rejection
 */
export function formatSessionRejectedNotification(
  sessionTitle: string,
  facilitatorName: string,
  rejectionReason?: string
): { title: string; body: string } {
  const reasonText = rejectionReason ? ` Reason: ${rejectionReason}` : '';
  return {
    title: '⚠️ Session Rejected',
    body: `${facilitatorName} rejected "${sessionTitle}".${reasonText}`,
  };
}

/**
 * Format notification for feedback reminder
 */
export function formatFeedbackReminderNotification(
  sessionTitle: string,
  completedCount: number,
  expectedCount: number
): { title: string; body: string } {
  const percentage = Math.round((completedCount / expectedCount) * 100);
  return {
    title: `📝 Feedback Progress: ${percentage}%`,
    body: `${completedCount}/${expectedCount} students have completed evaluation for "${sessionTitle}"`,
  };
}
