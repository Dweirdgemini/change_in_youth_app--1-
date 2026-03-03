import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { privateMessages, users } from "../../drizzle/schema";
import { eq, or, and, desc } from "drizzle-orm";

export const privateMessagesRouter = router({
  // Get all private messages for current user (sent or received)
  getMyMessages: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const messages = await db
      .select()
      .from(privateMessages)
      .where(
        or(
          eq(privateMessages.senderId, ctx.user.id),
          eq(privateMessages.recipientId, ctx.user.id)
        )
      )
      .orderBy(desc(privateMessages.createdAt));
    
    return messages;
  }),
  
  // Get conversation between two users
  getConversation: protectedProcedure
    .input(z.object({ otherUserId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const messages = await db
        .select()
        .from(privateMessages)
        .where(
          or(
            and(
              eq(privateMessages.senderId, ctx.user.id),
              eq(privateMessages.recipientId, input.otherUserId)
            ),
            and(
              eq(privateMessages.senderId, input.otherUserId),
              eq(privateMessages.recipientId, ctx.user.id)
            )
          )
        )
        .orderBy(desc(privateMessages.createdAt));
      
      return messages;
    }),
  
  // Get all messages for a specific participant (admin only)
  getParticipantMessages: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view all participant messages");
      }
      
      const messages = await db
        .select()
        .from(privateMessages)
        .where(
          or(
            eq(privateMessages.senderId, input.participantId),
            eq(privateMessages.recipientId, input.participantId)
          )
        )
        .orderBy(desc(privateMessages.createdAt));
      
      return messages;
    }),
  
  // Send a private message
  sendMessage: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      subject: z.string().optional(),
      content: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if recipient exists
      const recipient = await db
        .select()
        .from(users)
        .where(eq(users.id, input.recipientId))
        .limit(1);
      
      if (recipient.length === 0) {
        throw new Error("Recipient not found");
      }
      
      const [newMessage] = await db.insert(privateMessages).values({
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        subject: input.subject,
        content: input.content,
      });
      
      return { success: true, id: newMessage.insertId };
    }),
  
  // Mark message as read
  markAsRead: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Only recipient or admin can mark as read
      const message = await db
        .select()
        .from(privateMessages)
        .where(eq(privateMessages.id, input.messageId))
        .limit(1);
      
      if (message.length === 0) {
        throw new Error("Message not found");
      }
      
      if (message[0].recipientId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("You can only mark your own messages as read");
      }
      
      await db
        .update(privateMessages)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(privateMessages.id, input.messageId));
      
      return { success: true };
    }),
  
  // Get unread message count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const unreadMessages = await db
      .select()
      .from(privateMessages)
      .where(
        and(
          eq(privateMessages.recipientId, ctx.user.id),
          eq(privateMessages.isRead, false)
        )
      );
    
    return { count: unreadMessages.length };
  }),
  
  // Get list of users the current user has conversations with
  getConversationList: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get all messages involving the current user
    const messages = await db
      .select()
      .from(privateMessages)
      .where(
        or(
          eq(privateMessages.senderId, ctx.user.id),
          eq(privateMessages.recipientId, ctx.user.id)
        )
      )
      .orderBy(desc(privateMessages.createdAt));
    
    // Extract unique user IDs and get their details
    const userIds = new Set<number>();
    messages.forEach(msg => {
      if (msg.senderId !== ctx.user.id) userIds.add(msg.senderId);
      if (msg.recipientId !== ctx.user.id) userIds.add(msg.recipientId);
    });
    
    if (userIds.size === 0) return [];
    
    const conversationUsers = await db
      .select()
      .from(users)
      .where(
        or(...Array.from(userIds).map(id => eq(users.id, id)))
      );
    
    // Add last message and unread count for each conversation
    const conversations = await Promise.all(
      conversationUsers.map(async (user) => {
        const userMessages = messages.filter(
          m => m.senderId === user.id || m.recipientId === user.id
        );
        
        const lastMessage = userMessages[0];
        const unreadCount = userMessages.filter(
          m => m.recipientId === ctx.user.id && !m.isRead
        ).length;
        
        return {
          user,
          lastMessage,
          unreadCount,
        };
      })
    );
    
    return conversations;
  }),
});
