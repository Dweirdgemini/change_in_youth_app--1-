import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sessionContent, sessions, users } from "../../drizzle/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

export const contentSharingRouter = router({
  // Upload content for a session
  uploadContent: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        contentUrl: z.string(),
        contentType: z.enum(["photo", "video"]),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [content] = await db.insert(sessionContent).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        contentUrl: input.contentUrl,
        contentType: input.contentType,
        caption: input.caption || null,
        status: "pending",
      });

      return {
        contentId: content.insertId,
      };
    }),

  // Get content for a session
  getSessionContent: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const content = await db
        .select({
          id: sessionContent.id,
          contentUrl: sessionContent.contentUrl,
          contentType: sessionContent.contentType,
          caption: sessionContent.caption,
          status: sessionContent.status,
          userId: sessionContent.userId,
          userName: users.name,
          views: sessionContent.views,
          reach: sessionContent.reach,
          createdAt: sessionContent.createdAt,
        })
        .from(sessionContent)
        .leftJoin(users, eq(sessionContent.userId, users.id))
        .where(eq(sessionContent.sessionId, input.sessionId))
        .orderBy(desc(sessionContent.createdAt));

      return content;
    }),

  // Get pending content for review (admin only)
  getPendingContent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can review content");
    }

    const content = await db
      .select({
        id: sessionContent.id,
        sessionId: sessionContent.sessionId,
        sessionTitle: sessions.title,
        contentUrl: sessionContent.contentUrl,
        contentType: sessionContent.contentType,
        caption: sessionContent.caption,
        userId: sessionContent.userId,
        userName: users.name,
        uploaderName: users.name, // Alias for client compatibility
        createdAt: sessionContent.createdAt,
      })
      .from(sessionContent)
      .leftJoin(sessions, eq(sessionContent.sessionId, sessions.id))
      .leftJoin(users, eq(sessionContent.userId, users.id))
      .where(eq(sessionContent.status, "pending"))
      .orderBy(desc(sessionContent.createdAt));

    return content;
  }),

  // Approve content (admin only)
  approveContent: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        views: z.number().optional(),
        reach: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can approve content");
      }

      await db
        .update(sessionContent)
        .set({
          status: "approved",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          views: input.views || 0,
          reach: input.reach || 0,
        })
        .where(eq(sessionContent.id, input.contentId));

      return { success: true };
    }),

  // Reject content (admin only)
  rejectContent: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can reject content");
      }

      await db
        .update(sessionContent)
        .set({
          status: "rejected",
          // rejectionReason field not in schema yet
        })
        .where(eq(sessionContent.id, input.contentId));

      return { success: true };
    }),

  // Get engagement leaderboard
  getEngagementLeaderboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all users with their content stats
    const leaderboard = await db
      .select({
        userId: users.id,
        userName: users.name,
        totalPosts: count(sessionContent.id),
        totalViews: sql<number>`COALESCE(SUM(${sessionContent.views}), 0)`,
        totalReach: sql<number>`COALESCE(SUM(${sessionContent.reach}), 0)`,
      })
      .from(users)
      .leftJoin(
        sessionContent,
        and(
          eq(sessionContent.userId, users.id),
          eq(sessionContent.status, "approved")
        )
      )
      .where(eq(users.role, "team_member"))
      .groupBy(users.id, users.name)
      .orderBy(desc(sql`COALESCE(SUM(${sessionContent.reach}), 0)`));

    return leaderboard;
  }),

  // Get my content stats
  getMyContentStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const stats = await db
      .select({
        totalPosts: count(sessionContent.id),
        approvedPosts: sql<number>`SUM(CASE WHEN ${sessionContent.status} = 'approved' THEN 1 ELSE 0 END)`,
        pendingPosts: sql<number>`SUM(CASE WHEN ${sessionContent.status} = 'pending' THEN 1 ELSE 0 END)`,
        totalViews: sql<number>`COALESCE(SUM(${sessionContent.views}), 0)`,
        totalReach: sql<number>`COALESCE(SUM(${sessionContent.reach}), 0)`,
      })
      .from(sessionContent)
      .where(eq(sessionContent.userId, ctx.user.id));

    return stats[0] || {
      totalPosts: 0,
      approvedPosts: 0,
      pendingPosts: 0,
      totalViews: 0,
      totalReach: 0,
    };
  }),

  // Get my uploaded content
  getMyContent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const content = await db
      .select({
        id: sessionContent.id,
        sessionId: sessionContent.sessionId,
        sessionTitle: sessions.title,
        contentUrl: sessionContent.contentUrl,
        contentType: sessionContent.contentType,
        caption: sessionContent.caption,
        status: sessionContent.status,
        views: sessionContent.views,
        reach: sessionContent.reach,
        // rejectionReason: sessionContent.rejectionReason,
        createdAt: sessionContent.createdAt,
        reviewedAt: sessionContent.reviewedAt,
      })
      .from(sessionContent)
      .leftJoin(sessions, eq(sessionContent.sessionId, sessions.id))
      .where(eq(sessionContent.userId, ctx.user.id))
      .orderBy(desc(sessionContent.createdAt));

    return content;
  }),
});
