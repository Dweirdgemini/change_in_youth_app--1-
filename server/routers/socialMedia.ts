import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  socialMediaSubmissions,
  socialMediaPosts,
  contentCreatorStats,
  projectChatMessages,
  users,
  socialMediaQualityRankings,
  socialMediaReachRankings,
  monthlyBonuses,
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { socialMediaAPI } from "../_core/social-media-api";

export const socialMediaRouter = router({
  // Submit content for social media approval
  submitContent: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        caption: z.string(),
        platforms: z.array(z.enum(["instagram", "twitter", "tiktok", "linkedin"])),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify message exists and user owns it
      const message = await db
        .select()
        .from(projectChatMessages)
        .where(eq(projectChatMessages.id, input.messageId))
        .limit(1);

      if (message.length === 0 || message[0].userId !== ctx.user.id) {
        throw new Error("Message not found or access denied");
      }

      // Create submission
      const result = await db.insert(socialMediaSubmissions).values({
        messageId: input.messageId,
        submittedBy: ctx.user.id,
        caption: input.caption,
        platforms: input.platforms.join(","),
        status: "pending",
      });

      // Send notification to social media manager (Tobe)
      try {
        const socialMediaManagers = await db
          .select()
          .from(users)
          .where(eq(users.role, "social_media_manager"));
        
        // Log notification for now (can be extended with push notifications)
        console.log("[Notification] New submission for social media managers:", {
          submissionId: result[0].insertId,
          submittedBy: ctx.user.name,
          platforms: input.platforms,
          notifyUsers: socialMediaManagers.map(u => u.email),
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      return { success: true, submissionId: result[0].insertId };
    }),

  // Get pending submissions (social media manager only)
  getPendingSubmissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if user is admin (social media manager role can be added later)
    if (ctx.user.role !== "admin") {
      throw new Error("Access denied");
    }

    const submissions = await db
      .select({
        id: socialMediaSubmissions.id,
        messageId: socialMediaSubmissions.messageId,
        caption: socialMediaSubmissions.caption,
        platforms: socialMediaSubmissions.platforms,
        status: socialMediaSubmissions.status,
        submittedAt: socialMediaSubmissions.submittedAt,
        submitterName: users.name,
        submitterEmail: users.email,
        mediaUrl: projectChatMessages.mediaUrl,
        thumbnailUrl: projectChatMessages.thumbnailUrl,
        messageType: projectChatMessages.messageType,
      })
      .from(socialMediaSubmissions)
      .leftJoin(users, eq(socialMediaSubmissions.submittedBy, users.id))
      .leftJoin(
        projectChatMessages,
        eq(socialMediaSubmissions.messageId, projectChatMessages.id)
      )
      .where(eq(socialMediaSubmissions.status, "pending"))
      .orderBy(desc(socialMediaSubmissions.submittedAt));

    return submissions;
  }),

  // Approve submission and post to social media
  approveSubmission: protectedProcedure
    .input(
      z.object({
        submissionId: z.number(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Access denied");
      }

      // Update submission status
      await db
        .update(socialMediaSubmissions)
        .set({
          status: "approved",
          reviewedBy: ctx.user.id,
          reviewNotes: input.reviewNotes,
          reviewedAt: new Date(),
        })
        .where(eq(socialMediaSubmissions.id, input.submissionId));

      // Get submission details
      const submission = await db
        .select()
        .from(socialMediaSubmissions)
        .where(eq(socialMediaSubmissions.id, input.submissionId))
        .limit(1);

      if (submission.length === 0) {
        throw new Error("Submission not found");
      }

      const platforms = submission[0].platforms?.split(",") || [];

      // Create post records (actual posting to Instagram/Twitter would happen here)
      // For now, we'll create placeholder records
      for (const platform of platforms) {
        await db.insert(socialMediaPosts).values({
          submissionId: input.submissionId,
          platform,
          postId: `${platform}_${Date.now()}`, // Placeholder
          postUrl: `https://${platform}.com/post/${Date.now()}`, // Placeholder
        });
      }

      return { success: true, message: "Content approved and posted" };
    }),

  // Reject submission
  rejectSubmission: protectedProcedure
    .input(
      z.object({
        submissionId: z.number(),
        reviewNotes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Access denied");
      }

      await db
        .update(socialMediaSubmissions)
        .set({
          status: "rejected",
          reviewedBy: ctx.user.id,
          reviewNotes: input.reviewNotes,
          reviewedAt: new Date(),
        })
        .where(eq(socialMediaSubmissions.id, input.submissionId));

      return { success: true, message: "Submission rejected" };
    }),

  // Get my submissions
  getMySubmissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const submissions = await db
      .select({
        id: socialMediaSubmissions.id,
        caption: socialMediaSubmissions.caption,
        platforms: socialMediaSubmissions.platforms,
        status: socialMediaSubmissions.status,
        reviewNotes: socialMediaSubmissions.reviewNotes,
        submittedAt: socialMediaSubmissions.submittedAt,
        reviewedAt: socialMediaSubmissions.reviewedAt,
        mediaUrl: projectChatMessages.mediaUrl,
        thumbnailUrl: projectChatMessages.thumbnailUrl,
      })
      .from(socialMediaSubmissions)
      .leftJoin(
        projectChatMessages,
        eq(socialMediaSubmissions.messageId, projectChatMessages.id)
      )
      .where(eq(socialMediaSubmissions.submittedBy, ctx.user.id))
      .orderBy(desc(socialMediaSubmissions.submittedAt));

    return submissions;
  }),

  // Get performance leaderboard
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        month: z.string().optional(), // 'YYYY-MM' format
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const month = input.month || new Date().toISOString().slice(0, 7);

      const leaderboard = await db
        .select({
          userId: contentCreatorStats.userId,
          userName: users.name,
          totalSubmissions: contentCreatorStats.totalSubmissions,
          approvedSubmissions: contentCreatorStats.approvedSubmissions,
          totalLikes: contentCreatorStats.totalLikes,
          totalViews: contentCreatorStats.totalViews,
          totalReach: contentCreatorStats.totalReach,
          totalEngagement: contentCreatorStats.totalEngagement,
          rank: contentCreatorStats.rank,
        })
        .from(contentCreatorStats)
        .leftJoin(users, eq(contentCreatorStats.userId, users.id))
        .where(eq(contentCreatorStats.month, month))
        .orderBy(contentCreatorStats.rank);

      return leaderboard;
    }),

  // Update post metrics (called periodically to sync from social platforms)
  updatePostMetrics: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        likes: z.number(),
        comments: z.number(),
        shares: z.number(),
        views: z.number(),
        reach: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Access denied");
      }

      const engagement = input.likes + input.comments + input.shares;

      await db
        .update(socialMediaPosts)
        .set({
          likes: input.likes,
          comments: input.comments,
          shares: input.shares,
          views: input.views,
          reach: input.reach,
          engagement,
          lastSyncedAt: new Date(),
        })
        .where(eq(socialMediaPosts.id, input.postId));

      return { success: true };
    }),

  // Rate submission quality (1-5 stars) - Social Media Manager only
  rateSubmissionQuality: protectedProcedure
    .input(
      z.object({
        submissionId: z.number(),
        qualityRating: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user is social media manager or admin
      if (ctx.user.role !== "social_media_manager" && ctx.user.role !== "admin") {
        throw new Error("Access denied");
      }

      await db
        .update(socialMediaSubmissions)
        .set({
          qualityRating: input.qualityRating,
        })
        .where(eq(socialMediaSubmissions.id, input.submissionId));

      return { success: true };
    }),

  // Get quality rankings for a month
  getQualityRankings: protectedProcedure
    .input(
      z.object({
        month: z.string().optional(), // 'YYYY-MM' format
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const month = input.month || new Date().toISOString().slice(0, 7);

      const rankings = await db
        .select({
          userId: socialMediaQualityRankings.userId,
          userName: users.name,
          averageQualityRating: socialMediaQualityRankings.averageQualityRating,
          totalApprovedPosts: socialMediaQualityRankings.totalApprovedPosts,
          rank: socialMediaQualityRankings.rank,
          bonusAwarded: socialMediaQualityRankings.bonusAwarded,
          bonusAmount: socialMediaQualityRankings.bonusAmount,
        })
        .from(socialMediaQualityRankings)
        .leftJoin(users, eq(socialMediaQualityRankings.userId, users.id))
        .where(eq(socialMediaQualityRankings.month, month))
        .orderBy(socialMediaQualityRankings.rank);

      return rankings;
    }),

  // Get reach rankings for a month
  getReachRankings: protectedProcedure
    .input(
      z.object({
        month: z.string().optional(), // 'YYYY-MM' format
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const month = input.month || new Date().toISOString().slice(0, 7);

      const rankings = await db
        .select({
          userId: socialMediaReachRankings.userId,
          userName: users.name,
          totalReach: socialMediaReachRankings.totalReach,
          totalLikes: socialMediaReachRankings.totalLikes,
          totalShares: socialMediaReachRankings.totalShares,
          totalEngagement: socialMediaReachRankings.totalEngagement,
          rank: socialMediaReachRankings.rank,
          bonusAwarded: socialMediaReachRankings.bonusAwarded,
          bonusAmount: socialMediaReachRankings.bonusAmount,
        })
        .from(socialMediaReachRankings)
        .leftJoin(users, eq(socialMediaReachRankings.userId, users.id))
        .where(eq(socialMediaReachRankings.month, month))
        .orderBy(socialMediaReachRankings.rank);

      return rankings;
    }),

  // Get monthly bonuses for a user
  getMonthlyBonuses: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        month: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = input.userId || ctx.user.id;
      const conditions = [eq(monthlyBonuses.userId, userId)];

      if (input.month) {
        conditions.push(eq(monthlyBonuses.month, input.month));
      }

      const bonuses = await db
        .select()
        .from(monthlyBonuses)
        .where(and(...conditions))
        .orderBy(desc(monthlyBonuses.month));

      return bonuses;
    }),

  // Award monthly bonuses (admin only)
  awardMonthlyBonuses: protectedProcedure
    .input(
      z.object({
        month: z.string(), // 'YYYY-MM' format
        qualityWinnerId: z.number(),
        reachWinnerId: z.number(),
        bonusAmount: z.number(), // 50 GBP
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new Error("Access denied");
      }

      // Award quality bonus
      await db.insert(monthlyBonuses).values({
        userId: input.qualityWinnerId,
        month: input.month,
        category: "quality",
        rank: 1,
        amount: input.bonusAmount.toString(),
        status: "pending",
      });

      // Award reach bonus
      await db.insert(monthlyBonuses).values({
        userId: input.reachWinnerId,
        month: input.month,
        category: "reach",
        rank: 1,
        amount: input.bonusAmount.toString(),
        status: "pending",
      });

      // Update quality rankings
      await db
        .update(socialMediaQualityRankings)
        .set({ bonusAwarded: true, bonusAmount: input.bonusAmount.toString() })
        .where(
          and(
            eq(socialMediaQualityRankings.userId, input.qualityWinnerId),
            eq(socialMediaQualityRankings.month, input.month)
          )
        );

      // Update reach rankings
      await db
        .update(socialMediaReachRankings)
        .set({ bonusAwarded: true, bonusAmount: input.bonusAmount.toString() })
        .where(
          and(
            eq(socialMediaReachRankings.userId, input.reachWinnerId),
            eq(socialMediaReachRankings.month, input.month)
          )
        );

      return { success: true, message: "Bonuses awarded successfully" };
    }),

  // Sync metrics from social media platforms (admin only)
  syncSocialMediaMetrics: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        platforms: z.array(z.string()),
        platformPostIds: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "social_media_manager") {
        throw new Error("Access denied");
      }

      try {
        // Fetch metrics from all platforms
        const platformMetrics = await socialMediaAPI.getAllPlatformMetrics(
          input.platforms,
          input.platformPostIds as Record<string, string>
        );

        // Aggregate metrics
        const aggregated = socialMediaAPI.aggregateMetrics(platformMetrics);

        // Update post with aggregated metrics
        await db
          .update(socialMediaPosts)
          .set({
            likes: aggregated.likes,
            comments: aggregated.comments,
            shares: aggregated.shares,
            views: aggregated.views,
            reach: aggregated.reach,
            engagement: aggregated.likes + aggregated.comments + aggregated.shares,
            lastSyncedAt: new Date(),
          })
          .where(eq(socialMediaPosts.id, input.postId));

        return {
          success: true,
          metrics: aggregated,
          message: "Metrics synced successfully",
        };
      } catch (error) {
        console.error("Failed to sync metrics:", error);
        throw new Error("Failed to sync social media metrics");
      }
    }),
});
