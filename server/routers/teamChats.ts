import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { teamChannels, channelMembers, teamChatMessages, users } from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { sendChatNotification } from "../_core/push-notifications";

export const teamChatsRouter = router({
  // Get unread message counts for all channels
  getUnreadCounts: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      
      // Get all channels user is member of
      const memberships = await db
        .select({ channelId: channelMembers.channelId })
        .from(channelMembers)
        .where(eq(channelMembers.userId, ctx.user.id));
      
      if (memberships.length === 0) {
        return [];
      }
      
      const channelIds = memberships.map(m => m.channelId);
      
      // Get last read message ID for each channel
      const lastReadData = await db
        .select({
          channelId: channelMembers.channelId,
          // lastReadMessageId: channelMembers.id,
        })
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.userId, ctx.user.id),
            inArray(channelMembers.channelId, channelIds)
          )
        );
      
      // Count unread messages for each channel
      const unreadCounts = await Promise.all(
        lastReadData.map(async (data) => {
          const unreadCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(teamChatMessages)
            .where(eq(teamChatMessages.channelId, data.channelId));
          
          return {
            channelId: data.channelId,
            unreadCount: Number(unreadCount[0]?.count || 0),
          };
        })
      );
      
      return unreadCounts;
    }),

  // Mark channel as read
  markChannelAsRead: protectedProcedure
    .input(z.object({
      channelId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Get latest message ID in channel
      const [latestMessage] = await db
        .select({ id: teamChatMessages.id })
        .from(teamChatMessages)
        .where(eq(teamChatMessages.channelId, input.channelId))
        .orderBy(desc(teamChatMessages.id))
        .limit(1);
      
      // TODO: Add lastReadMessageId field to channelMembers schema to track read status
      // if (latestMessage) {
      //   await db
      //     .update(channelMembers)
      //     .set({ lastReadMessageId: latestMessage.id })
      //     .where(
      //       and(
      //         eq(channelMembers.channelId, input.channelId),
      //         eq(channelMembers.userId, ctx.user.id)
      //       )
      //     );
      // }
      
      return { success: true };
    }),

  // Create a new team channel (admin only)
  createChannel: adminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      memberIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      console.log('[Team Chat] Creating channel:', input.name, 'by user:', ctx.user.id);
      
      // Use raw SQL to avoid Drizzle ORM DEFAULT issues
      const client = db.$client;
      
      // Create channel
      const [result] = await client.promise().query<any>(
        `INSERT INTO team_chat_channels (name, description, created_by)
         VALUES (?, ?, ?)`,
        [input.name, input.description || null, ctx.user.id]
      );
      
      const channelId = result.insertId;
      console.log('[Team Chat] Channel created with ID:', channelId);
      
      // Add creator as member automatically
      const memberIds = input.memberIds || [];
      if (!memberIds.includes(ctx.user.id)) {
        memberIds.push(ctx.user.id);
      }
      
      // Add members
      for (const userId of memberIds) {
        await client.promise().query(
          `INSERT INTO team_chat_members (channel_id, user_id) VALUES (?, ?)`,
          [channelId, userId]
        );
      }
      
      console.log('[Team Chat] Added', memberIds.length, 'members to channel');
      
      return { channelId };
    }),

  // Get all channels user is member of
  getMyChannels: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      console.log('[Team Chat] getMyChannels called for user:', ctx.user.id, ctx.user.email);
      
      // Use raw SQL to avoid Drizzle ORM issues
      const client = db.$client;
      const [rows] = await client.promise().query<any[]>(
        `SELECT 
          c.id,
          c.name,
          c.description,
          c.last_message_at AS lastMessageAt,
          (SELECT COUNT(*) FROM team_chat_members WHERE channel_id = c.id) AS memberCount
        FROM team_chat_channels c
        INNER JOIN team_chat_members m ON m.channel_id = c.id
        WHERE m.user_id = ?
        ORDER BY c.last_message_at DESC`,
        [ctx.user.id]
      );
      
      console.log('[Team Chat] Found channels:', rows.length, rows);
      
      const channels = rows;
      
      return channels;
    }),

  // Get messages from a channel
  getChannelMessages: protectedProcedure
    .input(z.object({
      channelId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      try {
        console.log('[Team Chat] getChannelMessages called', { channelId: input.channelId, userId: ctx.user.id });
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Use raw SQL to avoid Drizzle issues
        const client = (db as any).$client;
        
        console.log('[Team Chat] Checking membership...');
        // Check if user is member
        const [membershipRows]: any = await client.promise().query(
          `SELECT * FROM team_chat_members WHERE channel_id = ? AND user_id = ? LIMIT 1`,
          [input.channelId, ctx.user.id]
        );
        
        console.log('[Team Chat] Membership check result:', membershipRows?.length);
        
        if (!membershipRows || membershipRows.length === 0) {
          throw new Error("Not a member of this channel");
        }
        
        console.log('[Team Chat] Fetching messages...');
        // Get messages with user info
        const [messages]: any = await client.promise().query(
          `SELECT 
            cm.id,
            cm.content as message,
            cm.user_id as userId,
            u.name as userName,
            cm.created_at as createdAt,
            tc.name as channelName
          FROM team_chat_messages cm
          INNER JOIN users u ON u.id = cm.user_id
          INNER JOIN team_chat_channels tc ON tc.id = cm.channel_id
          WHERE cm.channel_id = ?
          ORDER BY cm.created_at
          LIMIT ?`,
          [input.channelId, input.limit]
        );
        
        console.log('[Team Chat] Messages fetched:', messages?.length);
        return messages;
      } catch (error) {
        console.error('[Team Chat] getChannelMessages ERROR:', error);
        throw error;
      }
    }),

  // Send a message to a channel
  sendMessage: protectedProcedure
    .input(z.object({
      channelId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('[Team Chat] sendMessage called:', { channelId: input.channelId, userId: ctx.user.id, messageLength: input.message.length });
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if user is member
      const [membership] = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, input.channelId),
            eq(channelMembers.userId, ctx.user.id)
          )
        )
        .limit(1);
      
      if (!membership) {
        console.log('[Team Chat] User is not a member of channel:', input.channelId);
        throw new Error("Not a member of this channel");
      }
      
      console.log('[Team Chat] User is member, inserting message...');
      
      // Insert message using raw SQL to avoid Drizzle DEFAULT issues
      const client = (db as any).$client;
      const [result]: any = await client.promise().query(
        `INSERT INTO team_chat_messages (channel_id, user_id, content) VALUES (?, ?, ?)`,
        [input.channelId, ctx.user.id, input.message]
      );
      const newMessage = { id: result.insertId };
      
      console.log('[Team Chat] Message inserted with ID:', newMessage.id);
      
      // Update channel's lastMessageAt
      await db
        .update(teamChannels)
        .set({ lastMessageAt: new Date() })
        .where(eq(teamChannels.id, input.channelId));
      
      // Get channel info for notification
      const [channel] = await db
        .select({ name: teamChannels.name })
        .from(teamChannels)
        .where(eq(teamChannels.id, input.channelId))
        .limit(1);
      
      // Send push notification to other channel members
      if (channel && ctx.user.name) {
        sendChatNotification({
          channelId: input.channelId,
          channelName: channel.name,
          senderId: ctx.user.id,
          senderName: ctx.user.name,
          message: input.message,
        }).catch(err => {
          console.error("Failed to send push notification:", err);
        });
      }
      
      return { success: true, messageId: newMessage.id };
    }),

  // Generate AI summary of conversation
  summarizeConversation: protectedProcedure
    .input(z.object({
      channelId: z.number(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if user is member or admin
      const [membership] = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, input.channelId),
            eq(channelMembers.userId, ctx.user.id)
          )
        )
        .limit(1);
      
      if (!membership && ctx.user.role !== "admin") {
        throw new Error("Not authorized to view this channel");
      }
      
      // Get messages in date range
      let conditions: any[] = [eq(teamChatMessages.channelId, input.channelId)];
      if (input.dateFrom) {
        conditions.push(gte(teamChatMessages.createdAt, input.dateFrom));
      }
      if (input.dateTo) {
        conditions.push(lte(teamChatMessages.createdAt, input.dateTo));
      }
      
      const messages = await db
        .select({
          message: teamChatMessages.content,
          userId: teamChatMessages.userId,
          createdAt: teamChatMessages.createdAt,
        })
        .from(teamChatMessages)
        .where(and(...conditions))
        .orderBy(teamChatMessages.createdAt);
      
      if (messages.length === 0) {
        return {
          summary: "No messages in this time period",
          keyPoints: [],
          actionItems: [],
        };
      }

      // Format messages for AI
      const conversationText = messages
        .map((m: any) => {
          const date = m.createdAt ? new Date(m.createdAt).toISOString() : 'N/A';
          return `[${date}] User ${m.userId}: ${m.message}`;
        })
        .join("\n");

      // Generate summary using AI
      const prompt = `Summarize this team chat conversation and extract key information:

${conversationText}

Please provide:
1. A brief summary of the main discussion topics (2-3 sentences)
2. Key points discussed (bullet points)
3. Action items or decisions made (bullet points)

Format your response as JSON with this structure:
{
  "summary": "Brief summary here",
  "keyPoints": ["point 1", "point 2", ...],
  "actionItems": ["action 1", "action 2", ...]
}`;

      const result = await invokeLLM({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Parse AI response
      try {
        const responseText = (typeof result.choices[0]?.message.content === 'string' ? result.choices[0].message.content : JSON.stringify(result.choices[0]?.message.content)) || JSON.stringify(result);
        
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            summary: parsed.summary || "Summary generated",
            keyPoints: parsed.keyPoints || [],
            actionItems: parsed.actionItems || [],
          };
        }
        
        // Fallback if JSON parsing fails
        return {
          summary: responseText.substring(0, 500),
          keyPoints: [],
          actionItems: [],
        };
      } catch (error) {
        console.error("Failed to parse AI response:", error);
        return {
          summary: "Failed to generate summary",
          keyPoints: [],
          actionItems: [],
        };
      }
    }),

  // Export channel history
  exportChannelHistory: protectedProcedure
    .input(z.object({
      channelId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if user is member or admin
      const [membership] = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, input.channelId),
            eq(channelMembers.userId, ctx.user.id)
          )
        )
        .limit(1);
      
      if (!membership && ctx.user.role !== "admin") {
        throw new Error("Not authorized to view this channel");
      }
      
      // Get channel info
      const [channel] = await db
        .select()
        .from(teamChannels)
        .where(eq(teamChannels.id, input.channelId))
        .limit(1);
      
      // Get all messages
      const messages = await db
        .select({
          message: teamChatMessages.content,
          userId: teamChatMessages.userId,
          userName: users.name,
          createdAt: teamChatMessages.createdAt,
        })
        .from(teamChatMessages)
        .innerJoin(users, eq(users.id, teamChatMessages.userId))
        .where(eq(teamChatMessages.channelId, input.channelId))
        .orderBy(teamChatMessages.createdAt);
      
      const dateRange = {
        from: messages[0]?.createdAt 
          ? new Date(messages[0].createdAt).toLocaleDateString() 
          : "N/A",
        to: messages[messages.length - 1]?.createdAt 
          ? new Date(messages[messages.length - 1].createdAt).toLocaleDateString() 
          : "N/A",
      };
      
      return {
        channelName: channel?.name || "Unknown Channel",
        messageCount: messages.length,
        dateRange,
        messages: messages.map((m: any) => ({
          userName: m.userName || `User ${m.userId}`,
          message: m.message,
          timestamp: m.createdAt ? new Date(m.createdAt).toISOString() : "N/A",
        })),
      };
    }),
});
