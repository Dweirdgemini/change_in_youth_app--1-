import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { appAnalytics, userSessions, jobPostings, jobApplications, users, sessions } from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";

export const analyticsRouter = router({
  // Track app event
  trackEvent: protectedProcedure
    .input(
      z.object({
        eventType: z.string(),
        eventName: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
        platform: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(appAnalytics).values({
        eventType: input.eventType,
        eventName: input.eventName,
        userId: ctx.user.id,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        platform: input.platform || "mobile",
      });

      return { success: true };
    }),

  // Start user session
  startSession: protectedProcedure
    .input(
      z.object({
        platform: z.string().optional(),
        deviceInfo: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(userSessions).values({
        userId: ctx.user.id,
        sessionStart: new Date(),
        platform: input.platform || "mobile",
        deviceInfo: input.deviceInfo ? JSON.stringify(input.deviceInfo) : null,
      });

      return { success: true, sessionId: Number(result[0].insertId) };
    }),

  // End user session
  endSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const session = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.id, input.sessionId))
        .limit(1);

      if (!session[0]) throw new Error("Session not found");

      const sessionEnd = new Date();
      const sessionStart = session[0].sessionStart ? new Date(session[0].sessionStart) : new Date();
      const duration = Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / 1000); // seconds

      await db
        .update(userSessions)
        .set({
          sessionEnd,
          duration,
        })
        .where(eq(userSessions.id, input.sessionId));

      return { success: true, duration };
    }),

  // Get app usage overview (admin only)
  getAppUsageOverview: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins can view analytics");
    }

    // Total users
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Active users (users with sessions in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsersResult = await db
      .select({ userId: userSessions.userId })
      .from(userSessions)
      .where(gte(userSessions.sessionStart, thirtyDaysAgo))
      .groupBy(userSessions.userId);

    const activeUsers = activeUsersResult.length;

    // Total sessions
    const totalSessionsResult = await db.select({ count: count() }).from(userSessions);
    const totalSessions = totalSessionsResult[0]?.count || 0;

    // Average session duration
    const avgDurationResult = await db
      .select({ avg: sql<number>`AVG(${userSessions.duration})` })
      .from(userSessions)
      .where(sql`${userSessions.duration} IS NOT NULL`);

    const avgSessionDuration = avgDurationResult[0]?.avg || 0;

    // Total events tracked
    const totalEventsResult = await db.select({ count: count() }).from(appAnalytics);
    const totalEvents = totalEventsResult[0]?.count || 0;

    // Most common events
    const topEventsResult = await db
      .select({
        eventName: appAnalytics.eventName,
        count: count(),
      })
      .from(appAnalytics)
      .groupBy(appAnalytics.eventName)
      .orderBy(desc(count()))
      .limit(10);

    return {
      totalUsers,
      activeUsers,
      totalSessions,
      avgSessionDuration: Math.round(avgSessionDuration),
      totalEvents,
      topEvents: topEventsResult,
    };
  }),

  // Get job engagement metrics (admin only)
  getJobEngagementMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins can view analytics");
    }

    // Total job postings
    const totalJobsResult = await db.select({ count: count() }).from(jobPostings);
    const totalJobs = totalJobsResult[0]?.count || 0;

    // Active jobs
    const activeJobsResult = await db
      .select({ count: count() })
      .from(jobPostings)
      .where(eq(jobPostings.status, "active"));
    const activeJobs = activeJobsResult[0]?.count || 0;

    // Total applications
    const totalApplicationsResult = await db.select({ count: count() }).from(jobApplications);
    const totalApplications = totalApplicationsResult[0]?.count || 0;

    // Total views
    const totalViewsResult = await db
      .select({ total: sql<number>`SUM(${jobPostings.viewCount})` })
      .from(jobPostings);
    const totalViews = totalViewsResult[0]?.total || 0;

    // Average applications per job
    const avgApplicationsPerJob = totalJobs > 0 ? totalApplications / totalJobs : 0;

    // Top performing jobs
    const topJobs = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        views: jobPostings.viewCount,
        applications: jobPostings.applicationCount,
      })
      .from(jobPostings)
      .orderBy(desc(jobPostings.applicationCount))
      .limit(5);

    // Application status breakdown
    const applicationStatusResult = await db
      .select({
        status: jobApplications.status,
        count: count(),
      })
      .from(jobApplications)
      .groupBy(jobApplications.status);

    return {
      totalJobs,
      activeJobs,
      totalApplications,
      totalViews,
      avgApplicationsPerJob: Math.round(avgApplicationsPerJob * 10) / 10,
      topJobs,
      applicationsByStatus: applicationStatusResult,
    };
  }),

  // Get project delivery metrics (admin only)
  getProjectDeliveryMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins can view analytics");
    }

    // Total sessions delivered
    const totalSessionsResult = await db.select({ count: count() }).from(sessions);
    const totalSessions = totalSessionsResult[0]?.count || 0;

    // Completed sessions
    const completedSessionsResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.status, "completed"));
    const completedSessions = completedSessionsResult[0]?.count || 0;

    // In progress sessions
    const inProgressSessionsResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.status, "in_progress"));
    const inProgressSessions = inProgressSessionsResult[0]?.count || 0;

    // Scheduled sessions
    const scheduledSessionsResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.status, "scheduled"));
    const scheduledSessions = scheduledSessionsResult[0]?.count || 0;

    // Completion rate
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    return {
      totalSessions,
      completedSessions,
      inProgressSessions,
      scheduledSessions,
      completionRate: Math.round(completionRate * 10) / 10,
    };
  }),

  // Get user activity timeline (admin only)
  getUserActivityTimeline: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can view analytics");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const dailyActivity = await db
        .select({
          date: sql<string>`DATE(${userSessions.sessionStart})`,
          sessions: count(),
        })
        .from(userSessions)
        .where(gte(userSessions.sessionStart, startDate))
        .groupBy(sql`DATE(${userSessions.sessionStart})`)
        .orderBy(sql`DATE(${userSessions.sessionStart})`);

      return dailyActivity;
    }),

  // Get invoice analytics for admins
  getInvoiceAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if user is admin or finance
    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Not authorized to view analytics");
    }

    const { invoices: invoicesTable, projects, users: usersTable } = await import("../../drizzle/schema");

    // Get totals by status
    const [totals] = await db
      .select({
        totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${invoicesTable.status} = 'approved' THEN ${invoicesTable.amount} ELSE 0 END), 0)`,
        paidCount: sql<number>`COUNT(CASE WHEN ${invoicesTable.status} = 'approved' THEN 1 END)`,
        totalPending: sql<string>`COALESCE(SUM(CASE WHEN ${invoicesTable.status} = 'pending' THEN ${invoicesTable.amount} ELSE 0 END), 0)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${invoicesTable.status} = 'pending' THEN 1 END)`,
        totalRejected: sql<string>`COALESCE(SUM(CASE WHEN ${invoicesTable.status} = 'rejected' THEN ${invoicesTable.amount} ELSE 0 END), 0)`,
        rejectedCount: sql<number>`COUNT(CASE WHEN ${invoicesTable.status} = 'rejected' THEN 1 END)`,
      })
      .from(invoicesTable);

    // Get payments by project
    const byProject = await db
      .select({
        projectId: invoicesTable.projectId,
        projectName: projects.name,
        totalAmount: sql<string>`COALESCE(SUM(${invoicesTable.amount}), 0)`,
        invoiceCount: sql<number>`COUNT(*)`,
      })
      .from(invoicesTable)
      .leftJoin(projects, eq(invoicesTable.projectId, projects.id))
      .where(eq(invoicesTable.status, "approved"))
      .groupBy(invoicesTable.projectId, projects.name)
      .orderBy(sql`SUM(${invoicesTable.amount}) DESC`);

    // Get top earners
    const topEarners = await db
      .select({
        userId: invoicesTable.userId,
        userName: usersTable.name,
        totalEarnings: sql<string>`COALESCE(SUM(${invoicesTable.amount}), 0)`,
        invoiceCount: sql<number>`COUNT(*)`,
      })
      .from(invoicesTable)
      .leftJoin(usersTable, eq(invoicesTable.userId, usersTable.id))
      .where(eq(invoicesTable.status, "approved"))
      .groupBy(invoicesTable.userId, usersTable.name)
      .orderBy(sql`SUM(${invoicesTable.amount}) DESC`)
      .limit(10);

    // Get monthly trends (last 6 months)
    const monthlyTrends = await db
      .select({
        month: sql<string>`DATE_FORMAT(${invoicesTable.submittedAt}, '%Y-%m')`,
        totalAmount: sql<string>`COALESCE(SUM(${invoicesTable.amount}), 0)`,
        invoiceCount: sql<number>`COUNT(*)`,
      })
      .from(invoicesTable)
      .where(
        and(
          eq(invoicesTable.status, "approved"),
          gte(invoicesTable.submittedAt, sql`DATE_SUB(NOW(), INTERVAL 6 MONTH)`)
        )
      )
      .groupBy(sql`DATE_FORMAT(${invoicesTable.submittedAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${invoicesTable.submittedAt}, '%Y-%m') DESC`);

    return {
      totalPaid: totals.totalPaid,
      paidCount: totals.paidCount,
      totalPending: totals.totalPending,
      pendingCount: totals.pendingCount,
      totalRejected: totals.totalRejected,
      rejectedCount: totals.rejectedCount,
      byProject,
      topEarners,
      monthlyTrends,
    };
  }),
});
