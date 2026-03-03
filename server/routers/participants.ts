import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  participants,
  participantSessionLinks,
  privateChats,
  privateChatMessages,
  users,
} from "../../drizzle/schema";
import { eq, and, desc, or } from "drizzle-orm";

export const participantsRouter = router({
  // Public participant registration
  register: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.string().optional(),
        ethnicity: z.string().optional(),
        postcode: z.string().optional(),
        referralSource: z.string().optional(),
        schoolId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(participants).values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        gender: input.gender,
        ethnicity: input.ethnicity,
        postcode: input.postcode,
        referralSource: input.referralSource,
        schoolId: input.schoolId,
        consentGiven: true,
      });

      return { success: true, participantId: result[0].insertId };
    }),

  // Get all participants (staff only)
  getAllParticipants: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allParticipants = await db
      .select()
      .from(participants)
      .orderBy(desc(participants.registeredAt));

    return allParticipants;
  }),

  // Get participant by ID (staff only)
  getParticipant: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const participant = await db
        .select()
        .from(participants)
        .where(eq(participants.id, input.participantId))
        .limit(1);

      if (participant.length === 0) {
        throw new Error("Participant not found");
      }

      return participant[0];
    }),

  // Link participant to session (staff only)
  linkToSession: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
        sessionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(participantSessionLinks).values({
        participantId: input.participantId,
        sessionId: input.sessionId,
      });

      return { success: true };
    }),

  // Get participant's sessions
  getParticipantSessions: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sessions = await db
        .select()
        .from(participantSessionLinks)
        .where(eq(participantSessionLinks.participantId, input.participantId));

      return sessions;
    }),

  // ========================================
  // PRIVATE CHAT FUNCTIONS
  // ========================================

  // Initiate private chat with participant (staff only)
  initiateChat: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if chat already exists
      const existing = await db
        .select()
        .from(privateChats)
        .where(
          and(
            eq(privateChats.participantId, input.participantId),
            eq(privateChats.staffId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { success: true, chatId: existing[0].id };
      }

      // Create new chat
      const result = await db.insert(privateChats).values({
        participantId: input.participantId,
        staffId: ctx.user.id,
        status: "active",
      });

      return { success: true, chatId: result[0].insertId };
    }),

  // Get my private chats (staff view)
  getMyPrivateChats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const chats = await db
      .select({
        id: privateChats.id,
        participantId: privateChats.participantId,
        participantName: participants.name,
        status: privateChats.status,
        createdAt: privateChats.createdAt,
        lastMessageAt: privateChats.lastMessageAt,
      })
      .from(privateChats)
      .leftJoin(participants, eq(privateChats.participantId, participants.id))
      .where(eq(privateChats.staffId, ctx.user.id))
      .orderBy(desc(privateChats.lastMessageAt));

    return chats;
  }),

  // Get all private chats (admin/safeguarding oversight)
  getAllPrivateChats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin") {
      throw new Error("Access denied");
    }

    const chats = await db
      .select({
        id: privateChats.id,
        participantId: privateChats.participantId,
        participantName: participants.name,
        staffId: privateChats.staffId,
        staffName: users.name,
        status: privateChats.status,
        createdAt: privateChats.createdAt,
        lastMessageAt: privateChats.lastMessageAt,
      })
      .from(privateChats)
      .leftJoin(participants, eq(privateChats.participantId, participants.id))
      .leftJoin(users, eq(privateChats.staffId, users.id))
      .orderBy(desc(privateChats.lastMessageAt));

    return chats;
  }),

  // Get private chat messages
  getPrivateChatMessages: protectedProcedure
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

      // Verify access (staff member in chat or admin)
      const chat = await db
        .select()
        .from(privateChats)
        .where(eq(privateChats.id, input.chatId))
        .limit(1);

      if (chat.length === 0) {
        throw new Error("Chat not found");
      }

      if (chat[0].staffId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Access denied");
      }

      const messages = await db
        .select()
        .from(privateChatMessages)
        .where(eq(privateChatMessages.chatId, input.chatId))
        .orderBy(desc(privateChatMessages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return messages.reverse();
    }),

  // Send private chat message
  sendPrivateMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        messageType: z.enum(["text", "image", "video"]),
        content: z.string().optional(),
        mediaUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify access
      const chat = await db
        .select()
        .from(privateChats)
        .where(eq(privateChats.id, input.chatId))
        .limit(1);

      if (chat.length === 0) {
        throw new Error("Chat not found");
      }

      if (chat[0].staffId !== ctx.user.id) {
        throw new Error("Access denied");
      }

      // Insert message
      const result = await db.insert(privateChatMessages).values({
        chatId: input.chatId,
        senderId: ctx.user.id,
        senderType: "staff",
        messageType: input.messageType,
        content: input.content,
        mediaUrl: input.mediaUrl,
      });

      // Update last message time
      await db
        .update(privateChats)
        .set({ lastMessageAt: new Date() })
        .where(eq(privateChats.id, input.chatId));

      return { success: true, messageId: result[0].insertId };
    }),

  // Mark messages as read
  markAsRead: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(privateChatMessages)
        .set({ read: true })
        .where(
          and(
            eq(privateChatMessages.chatId, input.chatId),
            eq(privateChatMessages.read, false)
          )
        );

      return { success: true };
    }),
});
