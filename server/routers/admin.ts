import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  projects,
  invoices,
  sessions,
  users,
  tasks,
  jobPostings,
  jobApplications,
  budgetLines,
  documents,
} from "../../drizzle/schema";
import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";

export const adminRouter = router({
  // Get workshop count
  getWorkshopCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins and finance can view workshop count");
    }

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sessions)
      .where(eq(sessions.status, "completed"));

    return {
      total: result[0]?.count || 0,
    };
  }),


  // Create booking letter for a session
  createBookingLetter: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        schoolName: z.string(),
        contactName: z.string(),
        contactEmail: z.string(),
        contactPhone: z.string(),
        additionalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can create booking letters");
      }

      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session[0]) {
        throw new Error("Session not found");
      }

      const bookingInfo = {
        schoolName: input.schoolName,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        sessionDetails: {
          title: session[0].title,
          venue: session[0].venue,
          startTime: session[0].startTime,
          endTime: session[0].endTime,
        },
        additionalNotes: input.additionalNotes,
      };

      await db.insert(documents).values({
        sessionId: input.sessionId,
        projectId: session[0].projectId,
        title: `Booking Letter - ${input.schoolName}`,
        description: JSON.stringify(bookingInfo),
        type: "other",
        fileUrl: "/booking-letters/generated",
        uploadedBy: ctx.user.id,
      });

      return {
        success: true,
        bookingInfo,
      };
    }),


  // Get dashboard overview metrics
  getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Only admin and finance can view dashboard
    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins and finance team can view dashboard");
    }

    // Active projects count
    const activeProjectsResult = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.status, "active"));

    // Pending payments count and total amount
    const pendingInvoicesResult = await db
      .select({
        count: count(),
        total: sql<number>`SUM(CAST(${invoices.totalAmount} AS DECIMAL(10,2)))`,
      })
      .from(invoices)
      .where(eq(invoices.status, "pending"));

    // Upcoming sessions (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

      const upcomingSessionsResult = await db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(
            gte(sessions.startTime, today),
            lte(sessions.startTime, nextWeek),
            eq(sessions.status, "scheduled")
          )
        );

    // Active facilitators count
    const activeFacilitatorsResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "team_member"));

    // Open job postings
    const openJobsResult = await db
      .select({ count: count() })
      .from(jobPostings)
      .where(eq(jobPostings.status, "active"));

    // Pending tasks
    const pendingTasksResult = await db
      .select({ count: count() })
      .from(tasks)
      .where(eq(tasks.status, "pending"));

    return {
      activeProjects: activeProjectsResult[0]?.count || 0,
      pendingPayments: {
        count: pendingInvoicesResult[0]?.count || 0,
        total: pendingInvoicesResult[0]?.total || 0,
      },
      upcomingSessions: upcomingSessionsResult[0]?.count || 0,
      activeFacilitators: activeFacilitatorsResult[0]?.count || 0,
      openJobs: openJobsResult[0]?.count || 0,
      pendingTasks: pendingTasksResult[0]?.count || 0,
    };
  }),

  // Get financial summary
  getFinancialSummary: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance team can view financial summary");
      }

      // Get all budget lines
      let budgetQuery = db.select().from(budgetLines);
      if (input.projectId) {
        budgetQuery = budgetQuery.where(eq(budgetLines.projectId, input.projectId)) as any;
      }
      const allBudgetLines = await budgetQuery;

      // Calculate budget utilization
      const budgetSummary = allBudgetLines.map((line) => {
        const allocated = parseFloat(line.allocatedAmount);
        const spent = parseFloat(line.spentAmount);
        const remaining = allocated - spent;
        const utilizationPercent = allocated > 0 ? (spent / allocated) * 100 : 0;

        return {
          id: line.id,
          name: line.name,
          projectId: line.projectId,
          allocated,
          spent,
          remaining,
          utilizationPercent: Math.round(utilizationPercent * 10) / 10,
        };
      });

      // Get pending invoices
      let invoiceQuery = db
        .select()
        .from(invoices)
        .where(eq(invoices.status, "pending"));

      if (input.projectId) {
        const conditions = [eq(invoices.status, "pending"), eq(invoices.projectId, input.projectId)];
        invoiceQuery = db.select().from(invoices).where(and(...conditions)) as any;
      }

      const pendingInvoices = await invoiceQuery.orderBy(desc(invoices.createdAt)).limit(10);

      // Get approved invoices waiting for payment
      let approvedQuery = db
        .select()
        .from(invoices)
        .where(eq(invoices.status, "approved"));

      if (input.projectId) {
        const conditions = [eq(invoices.status, "approved"), eq(invoices.projectId, input.projectId)];
        approvedQuery = db.select().from(invoices).where(and(...conditions)) as any;
      }

      const approvedInvoices = await approvedQuery.orderBy(desc(invoices.approvedAt)).limit(10);

      return {
        budgetLines: budgetSummary,
        pendingInvoices: pendingInvoices.map((inv) => ({
          ...inv,
          amount: parseFloat(inv.totalAmount),
        })),
        approvedInvoices: approvedInvoices.map((inv) => ({
          ...inv,
          amount: parseFloat(inv.totalAmount),
        })),
        totalAllocated: budgetSummary.reduce((sum, b) => sum + b.allocated, 0),
        totalSpent: budgetSummary.reduce((sum, b) => sum + b.spent, 0),
        totalRemaining: budgetSummary.reduce((sum, b) => sum + b.remaining, 0),
      };
    }),

  // Get team performance analytics
  getTeamPerformance: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view team performance");
      }

      // Get all facilitators
      const facilitators = await db
        .select()
        .from(users)
        .where(eq(users.role, "team_member"));

      // For each facilitator, get their session count and task completion
      const performanceData = await Promise.all(
        facilitators.map(async (facilitator) => {
          // Count sessions delivered
          const sessionsDelivered = await db
            .select({ count: count() })
            .from(sessions)
            .where(
              and(
                sql`EXISTS(SELECT 1 FROM session_facilitators WHERE sessionId = ${sessions.id} AND userId = ${facilitator.id})`,
                eq(sessions.status, "completed")
              )
            );

          // Count tasks completed
          const tasksCompleted = await db
            .select({ count: count() })
            .from(tasks)
            .where(
              and(
                eq(tasks.assignedTo, facilitator.id),
                eq(tasks.status, "completed")
              )
            );

          // Count pending tasks
          const tasksPending = await db
            .select({ count: count() })
            .from(tasks)
            .where(
              and(
                eq(tasks.assignedTo, facilitator.id),
                eq(tasks.status, "pending")
              )
            );

          return {
            facilitatorId: facilitator.id,
            facilitatorName: facilitator.name || "Unknown",
            sessionsDelivered: sessionsDelivered[0]?.count || 0,
            tasksCompleted: tasksCompleted[0]?.count || 0,
            tasksPending: tasksPending[0]?.count || 0,
          };
        })
      );

      return performanceData;
    }),

  // Get quick actions data
  getQuickActions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins and finance team can view quick actions");
    }

    // Pending invoice approvals
    const pendingApprovals = await db
      .select()
      .from(invoices)
      .where(eq(invoices.status, "pending"))
      .orderBy(desc(invoices.createdAt))
      .limit(5);

    // Upcoming sessions needing facilitator assignment
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const unassignedSessions = await db
      .select()
      .from(sessions)
      .where(
        and(
          gte(sessions.startTime, today),
          lte(sessions.startTime, nextMonth),
          eq(sessions.status, "scheduled")
        )
      )
        .orderBy(sessions.startTime)
      .limit(5);

    // Filter sessions with no facilitators assigned
    const sessionsNeedingAssignment = unassignedSessions.filter((session) => {
      // Sessions use session_facilitators junction table, so we need to check that
      return true; // Placeholder - would need to join with session_facilitators table
    });

    // Recent job applications
    const recentApplications = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.status, "submitted"))
        .orderBy(desc(jobApplications.appliedAt))
      .limit(5);

    return {
      pendingApprovals: pendingApprovals.map((inv) => ({
        ...inv,
        amount: parseFloat(inv.totalAmount),
      })),
      sessionsNeedingAssignment,
      recentApplications,
    };
  }),

  // Get project overview
  getProjectOverview: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance team can view project overview");
      }

      // Get project details
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (!project[0]) throw new Error("Project not found");

      // Get budget lines for this project
      const projectBudgetLines = await db
        .select()
        .from(budgetLines)
        .where(eq(budgetLines.projectId, input.projectId));

      // Get sessions for this project
      const projectSessions = await db
        .select({ count: count() })
        .from(sessions)
        .where(eq(sessions.projectId, input.projectId));

      // Get completed sessions
      const completedSessions = await db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(
            eq(sessions.projectId, input.projectId),
            eq(sessions.status, "completed")
          )
        );

      // Get invoices for this project
      const projectInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.projectId, input.projectId));

      const totalSpent = projectInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
      const totalAllocated = projectBudgetLines.reduce(
        (sum, line) => sum + parseFloat(line.allocatedAmount),
        0
      );

      return {
        project: project[0],
        budgetLines: projectBudgetLines.map((line) => ({
          ...line,
          allocatedAmount: parseFloat(line.allocatedAmount),
          spentAmount: parseFloat(line.spentAmount),
        })),
        totalSessions: projectSessions[0]?.count || 0,
        completedSessions: completedSessions[0]?.count || 0,
        totalAllocated,
        totalSpent,
        remainingBudget: totalAllocated - totalSpent,
      };
    }),

  // Get all projects (for consent form link generation)
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        code: projects.code,
        description: projects.description,
        totalBudget: projects.totalBudget,
        budget: projects.totalBudget, // Alias for client compatibility
        spentBudget: projects.spentBudget,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        organizationId: projects.organizationId,
      })
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return allProjects;
  }),
});
