import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { participantInteractions, users } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const participantJourneyRouter = router({
  // Log a new interaction
  logInteraction: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
        interactionType: z.enum([
          "outreach",
          "survey",
          "app_download",
          "mentoring",
          "meeting",
          "note",
          "phone_call",
          "email",
          "workshop",
          "other",
        ]),
        title: z.string(),
        description: z.string().optional(),
        notes: z.string().optional(),
        interactionDate: z.string().optional(), // ISO date string
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [interaction] = await db.insert(participantInteractions).values({
        participantId: input.participantId,
        interactionType: input.interactionType,
        title: input.title,
        description: input.description || null,
        notes: input.notes || null,
        recordedBy: ctx.user.id,
        interactionDate: input.interactionDate ? new Date(input.interactionDate) : new Date(),
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });

      return {
        interactionId: interaction.insertId,
        success: true,
      };
    }),

  // Get participant's full journey
  getParticipantJourney: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const interactions = await db
        .select({
          id: participantInteractions.id,
          type: participantInteractions.interactionType,
          title: participantInteractions.title,
          description: participantInteractions.description,
          notes: participantInteractions.notes,
          interactionDate: participantInteractions.interactionDate,
          recordedBy: users.name,
          recordedById: participantInteractions.recordedBy,
          metadata: participantInteractions.metadata,
          createdAt: participantInteractions.createdAt,
        })
        .from(participantInteractions)
        .leftJoin(users, eq(participantInteractions.recordedBy, users.id))
        .where(eq(participantInteractions.participantId, input.participantId))
        .orderBy(desc(participantInteractions.interactionDate));

      return interactions.map((i) => ({
        ...i,
        metadata: i.metadata ? JSON.parse(i.metadata) : null,
      }));
    }),

  // Get all participants with interaction counts
  getAllParticipants: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all unique participant IDs
    const allInteractions = await db
      .select({
        participantId: participantInteractions.participantId,
        participantName: users.name,
        participantEmail: users.email,
        lastInteraction: participantInteractions.interactionDate,
      })
      .from(participantInteractions)
      .leftJoin(users, eq(participantInteractions.participantId, users.id))
      .orderBy(desc(participantInteractions.interactionDate));

    // Group by participant
    const participantsMap = new Map();
    allInteractions.forEach((interaction) => {
      if (!participantsMap.has(interaction.participantId)) {
        participantsMap.set(interaction.participantId, {
          participantId: interaction.participantId,
          participantName: interaction.participantName || "Unknown",
          participantEmail: interaction.participantEmail,
          interactionCount: 0,
          lastInteraction: interaction.lastInteraction,
        });
      }
      const participant = participantsMap.get(interaction.participantId);
      participant.interactionCount++;
    });

    return Array.from(participantsMap.values());
  }),

  // Update an interaction
  updateInteraction: protectedProcedure
    .input(
      z.object({
        interactionId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: any = {};
      if (input.title) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.notes !== undefined) updates.notes = input.notes;

      await db
        .update(participantInteractions)
        .set(updates)
        .where(eq(participantInteractions.id, input.interactionId));

      return { success: true };
    }),

  // Delete an interaction
  deleteInteraction: protectedProcedure
    .input(
      z.object({
        interactionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can delete interactions");
      }

      await db
        .delete(participantInteractions)
        .where(eq(participantInteractions.id, input.interactionId));

      return { success: true };
    }),

  // Get interaction statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const interactions = await db.select().from(participantInteractions);

    // Count by type
    const byType: Record<string, number> = {};
    interactions.forEach((i) => {
      byType[i.interactionType] = (byType[i.interactionType] || 0) + 1;
    });

    // Unique participants
    const uniqueParticipants = new Set(interactions.map((i) => i.participantId));

    return {
      totalInteractions: interactions.length,
      uniqueParticipants: uniqueParticipants.size,
      totalParticipants: uniqueParticipants.size, // Alias for client compatibility
      activeParticipants: uniqueParticipants.size, // Assume all are active for now
      byType,
      recentInteractions: interactions.slice(0, 10),
    };
  }),
});
