import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { chatChannels, chatMessages } from "../../drizzle/schema";
import { eq, and, desc, gte, or, sql, inArray } from "drizzle-orm";

export const chatRouter = router({
  // Create a chat channel
  createChannel: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["general", "student_forum", "project", "direct"]),
        description: z.string().optional(),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admins can create channels
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can create channels");
      }

      const result = await db.insert(chatChannels).values({
        name: input.name,
        type: input.type,
        description: input.description || null,
        projectId: input.projectId || null,
        createdBy: ctx.user.id,
      });

      return { success: true, channelId: Number(result[0].insertId) };
    }),

  // Get all channels user has access to
  getChannels: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const channels = await db
      .select()
      .from(chatChannels)
      .orderBy(desc(chatChannels.createdAt));

    // Filter channels based on user role
    const accessibleChannels = channels.filter((channel) => {
      if (channel.type === "general") {
        // Team channels for facilitators and admins only
        return ctx.user.role === "team_member" || ctx.user.role === "admin" || ctx.user.role === "finance";
      }
      if (channel.type === "student_forum") {
        // Student forum accessible to all
        return true;
      }
      if (channel.type === "project") {
        // Project channels accessible to all
        return true;
      }
      return false;
    });

    return accessibleChannels;
  }),

  // Send a message
  sendMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        content: z.string(),
        attachmentUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if channel exists
      const channel = await db
        .select()
        .from(chatChannels)
        .where(eq(chatChannels.id, input.channelId))
        .limit(1);

      if (!channel[0]) throw new Error("Channel not found");

      // Check access permissions
      if (channel[0].type === "general") {
        if (ctx.user.role !== "team_member" && ctx.user.role !== "admin" && ctx.user.role !== "finance") {
          throw new Error("You don't have access to this channel");
        }
      }

      const result = await db.insert(chatMessages).values({
        channelId: input.channelId,
        userId: ctx.user.id,
        content: input.content,
        fileUrl: input.attachmentUrl || null,
      });

      return { success: true, messageId: Number(result[0].insertId) };
    }),

  // Get messages for a channel
  getMessages: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        limit: z.number().default(50),
        before: z.number().optional(), // Message ID to fetch messages before
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if channel exists and user has access
      const channel = await db
        .select()
        .from(chatChannels)
        .where(eq(chatChannels.id, input.channelId))
        .limit(1);

      if (!channel[0]) throw new Error("Channel not found");

      // Check access permissions
      if (channel[0].type === "general") {
        if (ctx.user.role !== "team_member" && ctx.user.role !== "admin" && ctx.user.role !== "finance") {
          throw new Error("You don't have access to this channel");
        }
      }

      let conditions = [eq(chatMessages.channelId, input.channelId)];
      if (input.before) {
        conditions.push(sql`${chatMessages.id} < ${input.before}`);
      }

      const query = db
        .select()
        .from(chatMessages)
        .where(and(...conditions))
        .orderBy(desc(chatMessages.createdAt))
        .limit(input.limit);

      const messages = await query;
      return messages.reverse(); // Return in chronological order
    }),

  // Search messages
  searchMessages: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        channelId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let conditions = [sql`${chatMessages.content} LIKE ${`%${input.query}%`}`];
      if (input.channelId) {
        conditions.push(eq(chatMessages.channelId, input.channelId));
      }

      const results = await db
        .select()
        .from(chatMessages)
        .where(and(...conditions))
        .orderBy(desc(chatMessages.createdAt))
        .limit(50);

      // Filter results based on channel access
      const accessibleResults = [];
      for (const message of results) {
        const channel = await db
          .select()
          .from(chatChannels)
          .where(eq(chatChannels.id, message.channelId))
          .limit(1);

        if (channel[0]) {
          if (channel[0].type === "general") {
            if (ctx.user.role === "team_member" || ctx.user.role === "admin" || ctx.user.role === "finance") {
              accessibleResults.push(message);
            }
          } else {
            accessibleResults.push(message);
          }
        }
      }

      return accessibleResults;
    }),

  // Delete a message (sender or admin only)
  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const message = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, input.messageId))
        .limit(1);

      if (!message[0]) throw new Error("Message not found");

      // Only sender or admin can delete
      if (message[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("You don't have permission to delete this message");
      }

      await db.delete(chatMessages).where(eq(chatMessages.id, input.messageId));

      return { success: true };
    }),

  // Get unread message count
  getUnreadCount: protectedProcedure
    .input(z.object({ channelId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // This is a simplified version - in production, you'd track read receipts
      // For now, we'll return 0 as placeholder
      return { unreadCount: 0 };
    }),

  // Get channel details
  getChannel: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const channel = await db
        .select()
        .from(chatChannels)
        .where(eq(chatChannels.id, input.channelId))
        .limit(1);

      if (!channel[0]) throw new Error("Channel not found");

      // Check access permissions
      if (channel[0].type === "general") {
        if (ctx.user.role !== "team_member" && ctx.user.role !== "admin" && ctx.user.role !== "finance") {
          throw new Error("You don't have access to this channel");
        }
      }

      // Get message count
      const messageCountResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(chatMessages)
        .where(eq(chatMessages.channelId, input.channelId));

      const messageCount = messageCountResult[0]?.count || 0;

      return {
        ...channel[0],
        messageCount,
      };
    }),

  // Update channel
  updateChannel: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can update channels");
      }

      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;

      await db
        .update(chatChannels)
        .set(updates)
        .where(eq(chatChannels.id, input.channelId));

      return { success: true };
    }),

  // Delete channel (admin only)
  deleteChannel: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can delete channels");
      }

      // Delete all messages in channel first
      await db.delete(chatMessages).where(eq(chatMessages.channelId, input.channelId));

      // Delete channel
      await db.delete(chatChannels).where(eq(chatChannels.id, input.channelId));

      return { success: true };
    }),
});
