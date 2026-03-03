import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  projectChats,
  projectChatMembers,
  projectChatMessages,
  users,
} from "../../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export const projectChatRouter = router({
  // Get all chats for current user
  getMyChats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get chats where user is a member
    const memberChats = await db
      .select({
        chatId: projectChatMembers.chatId,
      })
      .from(projectChatMembers)
      .where(eq(projectChatMembers.userId, ctx.user.id));

    const chatIds = memberChats.map((m) => m.chatId);
    if (chatIds.length === 0) return [];

    // Get chat details
    const chats = await db
      .select({
        id: projectChats.id,
        projectId: projectChats.projectId,
        name: projectChats.name,
        description: projectChats.description,
        createdAt: projectChats.createdAt,
      })
      .from(projectChats)
      .where(inArray(projectChats.id, chatIds));

    // Get member counts for each chat
    const chatsWithCounts = await Promise.all(
      chats.map(async (chat) => {
        const members = await db
          .select({ count: projectChatMembers.id })
          .from(projectChatMembers)
          .where(eq(projectChatMembers.chatId, chat.id));

        const lastMessage = await db
          .select({
            content: projectChatMessages.content,
            createdAt: projectChatMessages.createdAt,
          })
          .from(projectChatMessages)
          .where(eq(projectChatMessages.chatId, chat.id))
          .orderBy(desc(projectChatMessages.createdAt))
          .limit(1);

        return {
          ...chat,
          memberCount: members.length,
          lastMessage: lastMessage[0] || null,
        };
      })
    );

    return chatsWithCounts;
  }),

  // Get chat messages
  getMessages: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user is member of chat
      const membership = await db
        .select()
        .from(projectChatMembers)
        .where(
          and(
            eq(projectChatMembers.chatId, input.chatId),
            eq(projectChatMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new Error("You are not a member of this chat");
      }

      // Get messages with user details
      const messages = await db
        .select({
          id: projectChatMessages.id,
          chatId: projectChatMessages.chatId,
          userId: projectChatMessages.userId,
          messageType: projectChatMessages.messageType,
          content: projectChatMessages.content,
          mediaUrl: projectChatMessages.mediaUrl,
          thumbnailUrl: projectChatMessages.thumbnailUrl,
          createdAt: projectChatMessages.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(projectChatMessages)
        .leftJoin(users, eq(projectChatMessages.userId, users.id))
        .where(eq(projectChatMessages.chatId, input.chatId))
        .orderBy(desc(projectChatMessages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return messages.reverse(); // Return in chronological order
    }),

  // Send message
  sendMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        messageType: z.enum(["text", "image", "video"]),
        content: z.string().optional(),
        mediaUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user is member of chat
      const membership = await db
        .select()
        .from(projectChatMembers)
        .where(
          and(
            eq(projectChatMembers.chatId, input.chatId),
            eq(projectChatMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new Error("You are not a member of this chat");
      }

      // Insert message using raw SQL to avoid Drizzle DEFAULT issues
      const client = (db as any).$client;
      const [result]: any = await client.promise().query(
        `INSERT INTO project_chat_messages (chat_id, user_id, message_type, content, media_url, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          input.chatId,
          ctx.user.id,
          input.messageType,
          input.content || null,
          input.mediaUrl || null,
          input.thumbnailUrl || null,
        ]
      );

      return { success: true, messageId: result.insertId };
    }),

  // Create new project chat (admin only)
  createChat: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        memberIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can create project chats");
      }

      // Create chat
      const chatResult = await db.insert(projectChats).values({
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        createdBy: ctx.user.id,
      });

      const chatId = chatResult[0].insertId;

      // Add members
      const memberValues = input.memberIds.map((userId) => ({
        chatId,
        userId,
        role: "member",
      }));

      await db.insert(projectChatMembers).values(memberValues);

      return { success: true, chatId };
    }),

  // Add members to chat (admin only)
  addMembers: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        memberIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can add members");
      }

      const memberValues = input.memberIds.map((userId) => ({
        chatId: input.chatId,
        userId,
        role: "member",
      }));

      await db.insert(projectChatMembers).values(memberValues);

      return { success: true };
    }),

  // Get chat members
  getMembers: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user is member or admin
      const membership = await db
        .select()
        .from(projectChatMembers)
        .where(
          and(
            eq(projectChatMembers.chatId, input.chatId),
            eq(projectChatMembers.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (membership.length === 0 && ctx.user.role !== "admin") {
        throw new Error("Access denied");
      }

      const members = await db
        .select({
          id: projectChatMembers.id,
          userId: projectChatMembers.userId,
          role: projectChatMembers.role,
          joinedAt: projectChatMembers.joinedAt,
          userName: users.name,
          userEmail: users.email,
          userRole: users.role,
        })
        .from(projectChatMembers)
        .leftJoin(users, eq(projectChatMembers.userId, users.id))
        .where(eq(projectChatMembers.chatId, input.chatId));

      return members;
    }),
});
