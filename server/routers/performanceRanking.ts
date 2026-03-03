import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  sessionFeedback, 
  socialMediaSubmissions, 
  schoolFeedback,
  users 
} from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export const performanceRankingRouter = router({
  // Get performance metrics for a specific user
  getUserPerformanceMetrics: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get workshop feedback quality average
      const workshopFeedbackResult = await db
        .select({
          avgWorkshopQuality: sql<number>`AVG(${sessionFeedback.workshopQuality})`,
          avgFacilitatorPerformance: sql<number>`AVG(${sessionFeedback.facilitatorPerformance})`,
          avgVenueRating: sql<number>`AVG(${sessionFeedback.venueRating})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(sessionFeedback)
        .where(eq(sessionFeedback.userId, input.userId));

      // Get social media post quality average
      const socialMediaResult = await db
        .select({
          avgQualityRating: sql<number>`AVG(${socialMediaSubmissions.qualityRating})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(socialMediaSubmissions)
        .where(
          and(
            eq(socialMediaSubmissions.submittedBy, input.userId),
            eq(socialMediaSubmissions.status, "approved")
          )
        );

      // Get school feedback average
      const schoolFeedbackResult = await db
        .select({
          avgOverallRating: sql<number>`AVG(${schoolFeedback.overallRating})`,
          avgDeliveryQuality: sql<number>`AVG(${schoolFeedback.deliveryQuality})`,
          avgPunctuality: sql<number>`AVG(${schoolFeedback.punctuality})`,
          avgProfessionalism: sql<number>`AVG(${schoolFeedback.professionalism})`,
          avgStudentEngagement: sql<number>`AVG(${schoolFeedback.studentEngagement})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(schoolFeedback)
        .where(eq(schoolFeedback.facilitatorId, input.userId));

      const workshopMetrics = (workshopFeedbackResult[0] || {}) as any;
      const socialMediaMetrics = (socialMediaResult[0] || {}) as any;
      const schoolMetrics = (schoolFeedbackResult[0] || {}) as any;

      // Calculate overall performance score (average of all metrics)
      const scores = [];
      if (workshopMetrics.avgWorkshopQuality) scores.push(Number(workshopMetrics.avgWorkshopQuality));
      if (workshopMetrics.avgFacilitatorPerformance) scores.push(Number(workshopMetrics.avgFacilitatorPerformance));
      if (socialMediaMetrics.avgQualityRating) scores.push(Number(socialMediaMetrics.avgQualityRating));
      if (schoolMetrics.avgOverallRating) scores.push(Number(schoolMetrics.avgOverallRating));

      const overallScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;

      // Determine suggested rank based on score
      let suggestedRank = "probationary";
      if (overallScore >= 4.5) {
        suggestedRank = "trusted";
      } else if (overallScore >= 4.0) {
        suggestedRank = "high_performer";
      } else if (overallScore >= 3.0) {
        suggestedRank = "standard";
      }

      return {
        workshopFeedback: {
          avgWorkshopQuality: Number(workshopMetrics.avgWorkshopQuality) || 0,
          avgFacilitatorPerformance: Number(workshopMetrics.avgFacilitatorPerformance) || 0,
          avgVenueRating: Number(workshopMetrics.avgVenueRating) || 0,
          count: Number(workshopMetrics.count) || 0,
        },
        socialMedia: {
          avgQualityRating: Number(socialMediaMetrics.avgQualityRating) || 0,
          count: Number(socialMediaMetrics.count) || 0,
        },
        schoolFeedback: {
          avgOverallRating: Number(schoolMetrics.avgOverallRating) || 0,
          avgDeliveryQuality: Number(schoolMetrics.avgDeliveryQuality) || 0,
          avgPunctuality: Number(schoolMetrics.avgPunctuality) || 0,
          avgProfessionalism: Number(schoolMetrics.avgProfessionalism) || 0,
          avgStudentEngagement: Number(schoolMetrics.avgStudentEngagement) || 0,
          count: Number(schoolMetrics.count) || 0,
        },
        overallScore: Math.round(overallScore * 10) / 10,
        suggestedRank,
      };
    }),

  // Get performance leaderboard (all team members ranked by performance)
  getPerformanceLeaderboard: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all users with facilitator or admin roles
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(
          sql`${users.role} IN ('team_member', 'admin', 'super_admin')`
        );

      // Calculate performance for each user
      const leaderboard = await Promise.all(
        allUsers.map(async (user) => {
          // Get workshop feedback
          const workshopResult = await db
            .select({
              avgScore: sql<number>`AVG((${sessionFeedback.workshopQuality} + ${sessionFeedback.facilitatorPerformance}) / 2)`,
            })
            .from(sessionFeedback)
            .where(eq(sessionFeedback.userId, user.id));

          // Get social media quality
          const socialResult = await db
            .select({
              avgScore: sql<number>`AVG(${socialMediaSubmissions.qualityRating})`,
            })
            .from(socialMediaSubmissions)
            .where(
              and(
                eq(socialMediaSubmissions.submittedBy, user.id),
                eq(socialMediaSubmissions.status, "approved")
              )
            );

          // Get school feedback
          const schoolResult = await db
            .select({
              avgScore: sql<number>`AVG(${schoolFeedback.overallRating})`,
            })
            .from(schoolFeedback)
            .where(eq(schoolFeedback.facilitatorId, user.id));

          const scores = [];
          if (workshopResult[0]?.avgScore) scores.push(Number(workshopResult[0].avgScore));
          if (socialResult[0]?.avgScore) scores.push(Number(socialResult[0].avgScore));
          if (schoolResult[0]?.avgScore) scores.push(Number(schoolResult[0].avgScore));

          const overallScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

          return {
            userId: user.id,
            name: user.name || "Unknown",
            email: user.email,
            role: user.role,
            overallScore: Math.round(overallScore * 10) / 10,
          };
        })
      );

      // Sort by overall score descending
      return leaderboard
        .filter((item) => item.overallScore > 0)
        .sort((a, b) => b.overallScore - a.overallScore);
    }),

  // Submit school feedback
  submitSchoolFeedback: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        facilitatorId: z.number(),
        schoolName: z.string(),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        overallRating: z.number().min(1).max(5),
        deliveryQuality: z.number().min(1).max(5).optional(),
        punctuality: z.number().min(1).max(5).optional(),
        professionalism: z.number().min(1).max(5).optional(),
        studentEngagement: z.number().min(1).max(5).optional(),
        comments: z.string().optional(),
        wouldRecommend: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(schoolFeedback).values({
        sessionId: input.sessionId,
        facilitatorId: input.facilitatorId,
        schoolName: input.schoolName,
        contactName: input.contactName || null,
        contactEmail: input.contactEmail || null,
        overallRating: input.overallRating,
        deliveryQuality: input.deliveryQuality || null,
        punctuality: input.punctuality || null,
        professionalism: input.professionalism || null,
        studentEngagement: input.studentEngagement || null,
        comments: input.comments || null,
        wouldRecommend: input.wouldRecommend ?? true,
      });

      return { success: true };
    }),

  // Get all school feedback for a facilitator
  getFacilitatorSchoolFeedback: protectedProcedure
    .input(z.object({ facilitatorId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const feedback = await db
        .select()
        .from(schoolFeedback)
        .where(eq(schoolFeedback.facilitatorId, input.facilitatorId))
        .orderBy(desc(schoolFeedback.createdAt));

      return feedback;
    }),
});
