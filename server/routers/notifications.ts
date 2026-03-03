import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sessions, sessionFacilitators, users } from "../../drizzle/schema";
import { eq, gte, and } from "drizzle-orm";
import { registerPushToken, updateNotificationPreferences } from "../_core/push-notifications";

export const notificationsRouter = router({
  // Send session reminder notifications
  sendSessionReminders: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        hoursBeforeSession: z.number().default(24),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can send notifications");
      }

      // Get session details
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId));

      if (!session) {
        throw new Error("Session not found");
      }

      // Get assigned facilitators
      const facilitators = await db
        .select({
          userId: sessionFacilitators.userId,
          userName: users.name,
          userEmail: users.email,
        })
        .from(sessionFacilitators)
        .leftJoin(users, eq(sessionFacilitators.userId, users.id))
        .where(eq(sessionFacilitators.sessionId, input.sessionId));

      // In a real implementation, you would send emails/push notifications here
      // For now, we'll just return the list of people who should be notified
      const notifications = facilitators.map((facilitator) => ({
        userId: facilitator.userId,
        userName: facilitator.userName,
        userEmail: facilitator.userEmail,
        message: `Reminder: You have a session "${session.title}" on ${new Date(session.startTime).toLocaleString()}`,
        type: "session_reminder",
      }));

      // TODO: Integrate with email service (e.g., SendGrid, AWS SES)
      // TODO: Integrate with push notification service (e.g., Expo Push Notifications)

      return {
        success: true,
        notificationsSent: notifications.length,
        notifications,
      };
    }),

  // Send bulk reminders for upcoming sessions
  sendUpcomingSessionReminders: protectedProcedure
    .input(
      z.object({
        hoursAhead: z.number().default(24),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can send notifications");
      }

      // Get sessions in the next X hours
      const now = new Date();
      const futureTime = new Date(now.getTime() + input.hoursAhead * 60 * 60 * 1000);

      const upcomingSessions = await db
        .select()
        .from(sessions)
        .where(gte(sessions.startTime, now));

      let totalNotifications = 0;

      for (const session of upcomingSessions) {
        const sessionDate = new Date(session.startTime);
        if (sessionDate <= futureTime) {
          // Get facilitators for this session
          const facilitators = await db
            .select({
              userId: sessionFacilitators.userId,
              userName: users.name,
              userEmail: users.email,
            })
            .from(sessionFacilitators)
            .leftJoin(users, eq(sessionFacilitators.userId, users.id))
            .where(eq(sessionFacilitators.sessionId, session.id));

          totalNotifications += facilitators.length;

          // TODO: Send actual notifications here
        }
      }

      return {
        success: true,
        sessionsFound: upcomingSessions.length,
        notificationsSent: totalNotifications,
      };
    }),

  // Notify team members of new content
  notifyNewContent: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        sessionId: z.number(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all users (or filter by role/permissions)
      const allUsers = await db.select().from(users);

      // TODO: Send push notifications to all users
      // TODO: Send emails to users who have email notifications enabled

      return {
        success: true,
        notificationsSent: allUsers.length,
      };
    }),

  // Get notification preferences for current user
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    // In a real implementation, you'd store these in a database table
    // For now, return default preferences
    return {
      emailNotifications: true,
      pushNotifications: true,
      sessionReminders: true,
      contentUpdates: true,
      invoiceAlerts: true,
    };
  }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        sessionReminders: z.boolean().optional(),
        contentUpdates: z.boolean().optional(),
        invoiceAlerts: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Store preferences in database
      // For now, just return success
      return {
        success: true,
        preferences: input,
      };
    }),

  // Register push token for current user
  registerPushToken: protectedProcedure
    .input(z.object({
      pushToken: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await registerPushToken(ctx.user.id, input.pushToken);
      return result;
    }),

  // Get chat notification preferences
  getChatPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      
      const [user] = await db
        .select({ notificationPreferences: users.notificationPreferences })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      
      if (!user || !user.notificationPreferences) {
        return { mutedChannels: [] };
      }
      
      try {
        return JSON.parse(user.notificationPreferences as string);
      } catch {
        return { mutedChannels: [] };
      }
    }),

  // Mute/unmute channel notifications
  toggleChannelMute: protectedProcedure
    .input(z.object({
      channelId: z.number(),
      mute: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Get current preferences
      const [user] = await db
        .select({ notificationPreferences: users.notificationPreferences })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      
      let preferences: { mutedChannels: number[] } = { mutedChannels: [] };
      
      if (user?.notificationPreferences) {
        try {
          preferences = JSON.parse(user.notificationPreferences as string);
        } catch {
          preferences = { mutedChannels: [] };
        }
      }
      
      // Update muted channels list
      if (input.mute) {
        if (!preferences.mutedChannels.includes(input.channelId)) {
          preferences.mutedChannels.push(input.channelId);
        }
      } else {
        preferences.mutedChannels = preferences.mutedChannels.filter(
          id => id !== input.channelId
        );
      }
      
      const result = await updateNotificationPreferences(ctx.user.id, preferences);
      return result;
    }),

  // Check if channel is muted
  isChannelMuted: protectedProcedure
    .input(z.object({
      channelId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      
      const [user] = await db
        .select({ notificationPreferences: users.notificationPreferences })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      
      if (!user || !user.notificationPreferences) {
        return { isMuted: false };
      }
      
      try {
        const preferences = JSON.parse(user.notificationPreferences as string);
        const mutedChannels = preferences.mutedChannels || [];
        return { isMuted: mutedChannels.includes(input.channelId) };
      } catch {
        return { isMuted: false };
      }
    }),
});
