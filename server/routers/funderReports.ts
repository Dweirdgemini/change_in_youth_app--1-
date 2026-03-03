import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  funderReports,
  users,
  sessions,
  sessionFacilitators,
  programRegistrations,
  participantInteractions,
} from "../../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export const funderReportsRouter = router({
  // Generate a new report
  generateReport: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        reportType: z.enum(["participant_summary", "session_statistics", "individual_journey", "group_outcomes", "financial_overview"]),
        dateFrom: z.string(), // ISO date string
        dateTo: z.string(),
        filters: z.object({
          projectIds: z.array(z.number()).optional(),
          participantIds: z.array(z.number()).optional(),
          includePhotos: z.boolean().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can generate reports");
      }

      const dateFrom = new Date(input.dateFrom);
      const dateTo = new Date(input.dateTo);

      // Aggregate data based on report type
      let reportData: any = {};

      if (input.reportType === "session_statistics") {
        // Get all sessions in date range
        const sessionsData = await db
          .select({
            id: sessions.id,
            title: sessions.title,
            startTime: sessions.startTime,
            endTime: sessions.endTime,
            status: sessions.status,
            projectId: sessions.projectId,
          })
          .from(sessions)
          .where(
            and(
              gte(sessions.startTime, dateFrom),
              lte(sessions.startTime, dateTo)
            )
          );

        // Get participant counts
        const participantCounts = await Promise.all(
          sessionsData.map(async (session) => {
            const participants = await db
              .select()
              .from(sessionFacilitators)
              .where(eq(sessionFacilitators.sessionId, session.id));
            return {
              sessionId: session.id,
              count: participants.length,
            };
          })
        );

        reportData = {
          totalSessions: sessionsData.length,
          completedSessions: sessionsData.filter((s) => s.status === "completed").length,
          totalParticipants: participantCounts.reduce((sum, p) => sum + p.count, 0),
          sessions: sessionsData.map((s) => ({
            ...s,
            participantCount: participantCounts.find((p) => p.sessionId === s.id)?.count || 0,
          })),
        };
      } else if (input.reportType === "participant_summary") {
        // Get all registrations in date range
        const registrations = await db
          .select()
          .from(programRegistrations)
          .where(
            and(
              gte(programRegistrations.registeredAt, dateFrom),
              lte(programRegistrations.registeredAt, dateTo)
            )
          );

        // Get unique participants from sessions
        const sessionParts = await db
          .select({
            userId: sessionFacilitators.userId,
            userName: users.name,
            userEmail: users.email,
          })
          .from(sessionFacilitators)
          .leftJoin(users, eq(sessionFacilitators.userId, users.id))
          .leftJoin(sessions, eq(sessionFacilitators.sessionId, sessions.id))
          .where(
            and(
              gte(sessions.startTime, dateFrom),
              lte(sessions.startTime, dateTo)
            )
          );

        const uniqueParticipants = Array.from(
          new Set(sessionParts.map((p) => p.userId))
        );

        reportData = {
          totalRegistrations: registrations.length,
          newRegistrations: registrations.filter((r) => r.status === "new").length,
          enrolledParticipants: registrations.filter((r) => r.status === "enrolled").length,
          uniqueSessionParticipants: uniqueParticipants.length,
          ageBreakdown: {
            under18: registrations.filter((r) => r.age && r.age < 18).length,
            age18to25: registrations.filter((r) => r.age && r.age >= 18 && r.age <= 25).length,
            over25: registrations.filter((r) => r.age && r.age > 25).length,
          },
          registrations: registrations.slice(0, 50), // Limit to 50 for performance
        };
      } else if (input.reportType === "individual_journey") {
        // Get specific participant's journey
        const participantId = input.filters?.participantIds?.[0];
        if (!participantId) {
          throw new Error("Participant ID required for individual journey report");
        }

        // Get all interactions
        const interactions = await db
          .select({
            id: participantInteractions.id,
            type: participantInteractions.interactionType,
            title: participantInteractions.title,
            description: participantInteractions.description,
            notes: participantInteractions.notes,
            date: participantInteractions.interactionDate,
            recordedBy: users.name,
          })
          .from(participantInteractions)
          .leftJoin(users, eq(participantInteractions.recordedBy, users.id))
          .where(eq(participantInteractions.participantId, participantId))
          .orderBy(desc(participantInteractions.interactionDate));

        // Get session attendance
        const attendance = await db
          .select({
            sessionTitle: sessions.title,
            sessionDate: sessions.startTime,
            clockInTime: sessionFacilitators.clockInTime,
          })
          .from(sessionFacilitators)
          .leftJoin(sessions, eq(sessionFacilitators.sessionId, sessions.id))
          .where(eq(sessionFacilitators.userId, participantId));

        reportData = {
          participantId,
          interactions: interactions,
          sessionAttendance: attendance,
          totalInteractions: interactions.length,
          totalSessionsAttended: attendance.filter((a) => a.clockInTime !== null).length,
        };
      }

      // Save report
      const report = await (db.insert(funderReports).values({
        title: input.title,
        description: input.description || null,
        reportType: input.reportType,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        filters: JSON.stringify(input.filters || {}),
        generatedBy: ctx.user.id,
        reportData: JSON.stringify(reportData),
        status: "generated",
      } as any) as any);

      return {
        reportId: (report as any).insertId,
        reportData,
      };
    }),

  // Get all reports
  getAllReports: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins and finance can view reports");
    }

    const reports = await db
      .select({
        id: funderReports.id,
        title: funderReports.title,
        description: funderReports.description,
        reportType: funderReports.reportType,
        dateFrom: funderReports.dateFrom,
        dateTo: funderReports.dateTo,
        status: funderReports.status,
        pdfUrl: funderReports.pdfUrl,
        createdAt: funderReports.createdAt,
        generatedBy: users.name,
      })
      .from(funderReports)
      .leftJoin(users, eq(funderReports.generatedBy, users.id))
      .orderBy(desc(funderReports.createdAt));

    return reports;
  }),

  // Get specific report
  getReport: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can view reports");
      }

      const [report] = await db
        .select()
        .from(funderReports)
        .where(eq(funderReports.id, input.reportId))
        .limit(1);

      if (!report) {
        throw new Error("Report not found");
      }

      return {
        ...report,
        reportData: report.reportData ? JSON.parse(report.reportData) : null,
        filters: report.filters ? JSON.parse(report.filters) : null,
      };
    }),

  // Delete report
  deleteReport: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can delete reports");
      }

      await db.delete(funderReports).where(eq(funderReports.id, input.reportId));

      return { success: true };
    }),
});
