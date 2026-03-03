import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../db";
import { sessionFeedback, sessions, users, projects } from "../../drizzle/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

export const feedbackRouter = router({
  // Submit feedback for a session
  submitFeedback: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        rating: z.number().min(1).max(5),
        whatWentWell: z.string().optional(),
        improvements: z.string().optional(),
        engagementLevel: z.enum(["low", "medium", "high"]).optional(),
        venueFeedback: z.string().optional(),
        suggestions: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if feedback already exists
      const existing = await db
        .select()
        .from(sessionFeedback)
        .where(
          and(
            eq(sessionFeedback.sessionId, input.sessionId),
            eq(sessionFeedback.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing feedback
        await db
          .update(sessionFeedback)
          .set({
            rating: input.rating,
            whatWentWell: input.whatWentWell,
            improvements: input.improvements,
            engagementLevel: input.engagementLevel,
            venueFeedback: input.venueFeedback,
            suggestions: input.suggestions,
            updatedAt: new Date(),
          })
          .where(eq(sessionFeedback.id, existing[0].id));

        return { success: true, feedbackId: existing[0].id };
      }

      // Create new feedback
      const result = await db.insert(sessionFeedback).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        rating: input.rating,
        whatWentWell: input.whatWentWell,
        improvements: input.improvements,
        engagementLevel: input.engagementLevel,
        venueFeedback: input.venueFeedback,
        suggestions: input.suggestions,
      });

      return { success: true, feedbackId: Number((result as any).insertId) };
    }),

  // Get feedback completion count for a session
  getSessionFeedbackCount: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { completed: 0, expected: 0 };

      // Get session to find expected attendee count
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session[0]) return { completed: 0, expected: 0 };

      // Count submitted feedback
      const feedbackCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(sessionFeedback)
        .where(eq(sessionFeedback.sessionId, input.sessionId));

      return {
        completed: feedbackCount[0]?.count || 0,
        expected: session[0].attendeeCount || 0,
      };
    }),

  // Get feedback for a session (admin only)
  getSessionFeedback: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const feedback = await db
        .select({
          id: sessionFeedback.id,
          rating: sessionFeedback.rating,
          whatWentWell: sessionFeedback.whatWentWell,
          improvements: sessionFeedback.improvements,
          engagementLevel: sessionFeedback.engagementLevel,
          venueFeedback: sessionFeedback.venueFeedback,
          suggestions: sessionFeedback.suggestions,
          createdAt: sessionFeedback.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(sessionFeedback)
        .leftJoin(users, eq(sessionFeedback.userId, users.id))
        .where(eq(sessionFeedback.sessionId, input.sessionId))
        .orderBy(desc(sessionFeedback.createdAt));

      return feedback;
    }),

  // Get project-level analytics
  getProjectAnalytics: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      // Get all feedback for project sessions
      const feedback = await db
        .select({
          rating: sessionFeedback.rating,
          engagementLevel: sessionFeedback.engagementLevel,
          whatWentWell: sessionFeedback.whatWentWell,
          improvements: sessionFeedback.improvements,
          createdAt: sessionFeedback.createdAt,
        })
        .from(sessionFeedback)
        .leftJoin(sessions, eq(sessionFeedback.sessionId, sessions.id))
        .where(eq(sessions.projectId, input.projectId));

      if (feedback.length === 0) {
        return {
          averageRating: 0,
          totalFeedback: 0,
          engagementDistribution: { low: 0, medium: 0, high: 0 },
          commonThemes: { positive: [], improvements: [] },
        };
      }

      // Calculate average rating
      const averageRating =
        feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;

      // Engagement distribution
      const engagementDistribution = {
        low: feedback.filter((f) => f.engagementLevel === "low").length,
        medium: feedback.filter((f) => f.engagementLevel === "medium").length,
        high: feedback.filter((f) => f.engagementLevel === "high").length,
      };

      // Extract common themes (simplified - in production, use AI/NLP)
      const positive = feedback
        .filter((f) => f.whatWentWell)
        .map((f) => f.whatWentWell)
        .slice(0, 5);

      const improvements = feedback
        .filter((f) => f.improvements)
        .map((f) => f.improvements)
        .slice(0, 5);

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalFeedback: feedback.length,
        engagementDistribution,
        commonThemes: { positive, improvements },
      };
    }),

  // Get facilitator performance
  getFacilitatorPerformance: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const feedback = await db
        .select({
          rating: sessionFeedback.rating,
          createdAt: sessionFeedback.createdAt,
          sessionTitle: sessions.title,
        })
        .from(sessionFeedback)
        .leftJoin(sessions, eq(sessionFeedback.sessionId, sessions.id))
        .where(eq(sessionFeedback.userId, input.userId))
        .orderBy(desc(sessionFeedback.createdAt));

      if (feedback.length === 0) {
        return {
          averageRating: 0,
          totalSessions: 0,
          recentFeedback: [],
        };
      }

      const averageRating =
        feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalSessions: feedback.length,
        recentFeedback: feedback.slice(0, 10),
      };
    }),
});
