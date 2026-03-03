import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  invoices,
  sessions,
  sessionFacilitators,
  surveyResponses,
  users,
  surveys,
} from "../../drizzle/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { sendPushNotification } from "../_core/push";

export const bulkRouter = router({
  // Bulk approve invoices
  bulkApproveInvoices: protectedProcedure
    .input(
      z.object({
        invoiceIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only finance and admin can approve invoices
      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only finance team can approve invoices");
      }

      const now = new Date();

      // Update all invoices to approved status
      await db
        .update(invoices)
        .set({
          status: "approved",
          approvedBy: ctx.user.id,
          approvedAt: now,
        })
        .where(inArray(invoices.id, input.invoiceIds));

      // Get invoice details to send notifications
      const approvedInvoices = await db
        .select()
        .from(invoices)
        .where(inArray(invoices.id, input.invoiceIds));

      // Send notifications to facilitators
      for (const invoice of approvedInvoices) {
        const facilitator = await db
          .select()
          .from(users)
          .where(eq(users.id, invoice.userId))
          .limit(1);

        // Temporarily disabled push notifications
        if (false && facilitator[0]) {
          await sendPushNotification({
            to: '', // facilitator[0].pushToken,
            title: "Invoice Approved",
            body: `Your invoice for £${invoice.totalAmount} has been approved.`,
            data: {
              type: "invoice_approved",
              invoiceId: invoice.id,
            },
          });
        }
      }

      return {
        success: true,
        approvedCount: input.invoiceIds.length,
      };
    }),

  // Bulk reject invoices
  bulkRejectInvoices: protectedProcedure
    .input(
      z.object({
        invoiceIds: z.array(z.number()),
        rejectionReason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only finance team can reject invoices");
      }

      await db
        .update(invoices)
        .set({
          status: "rejected",
          rejectionReason: input.rejectionReason,
        })
        .where(inArray(invoices.id, input.invoiceIds));

      // Get invoice details to send notifications
      const rejectedInvoices = await db
        .select()
        .from(invoices)
        .where(inArray(invoices.id, input.invoiceIds));

      // Send notifications to facilitators
      for (const invoice of rejectedInvoices) {
        const facilitator = await db
          .select()
          .from(users)
          .where(eq(users.id, invoice.userId))
          .limit(1);

        // Temporarily disabled push notifications
        if (false && facilitator[0]) {
          await sendPushNotification({
            to: '', // facilitator[0].pushToken,
            title: "Invoice Rejected",
            body: `Your invoice for £${invoice.totalAmount} was rejected. Reason: ${input.rejectionReason}`,
            data: {
              type: "invoice_rejected",
              invoiceId: invoice.id,
            },
          });
        }
      }

      return {
        success: true,
        rejectedCount: input.invoiceIds.length,
      };
    }),

  // Bulk assign facilitators to sessions
  bulkAssignFacilitators: protectedProcedure
    .input(
      z.object({
        sessionIds: z.array(z.number()),
        facilitatorIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admin and facilitators can assign
      if (ctx.user.role !== "admin" && ctx.user.role !== "team_member") {
        throw new Error("Only admins can assign facilitators");
      }

      // For each session, assign all facilitators
      for (const sessionId of input.sessionIds) {
        // Remove existing assignments
        await db
          .delete(sessionFacilitators)
          .where(eq(sessionFacilitators.sessionId, sessionId));

        // Add new assignments
        for (const facilitatorId of input.facilitatorIds) {
          await db.insert(sessionFacilitators).values({
            sessionId,
            userId: facilitatorId,
          });
        }
      }

      // Get session details
      const assignedSessions = await db
        .select()
        .from(sessions)
        .where(inArray(sessions.id, input.sessionIds));

      // Send notifications to facilitators
      const facilitators = await db
        .select()
        .from(users)
        .where(inArray(users.id, input.facilitatorIds));

      for (const facilitator of facilitators) {
        // Temporarily disabled push notifications
        if (false) {
          await sendPushNotification({
            to: '', // facilitator.pushToken,
            title: "New Sessions Assigned",
            body: `You have been assigned to ${input.sessionIds.length} new session(s).`,
            data: {
              type: "sessions_assigned",
              sessionIds: input.sessionIds,
            },
          });
        }
      }

      return {
        success: true,
        assignedCount: input.sessionIds.length * input.facilitatorIds.length,
      };
    }),

  // Bulk send surveys
  bulkSendSurveys: protectedProcedure
    .input(
      z.object({
        surveyId: z.number(),
        recipientIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admin and facilitators can send surveys
      if (ctx.user.role !== "admin" && ctx.user.role !== "team_member") {
        throw new Error("Only admins and facilitators can send surveys");
      }

      // Get survey details
      const survey = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, input.surveyId))
        .limit(1);

      if (!survey[0]) throw new Error("Survey not found");

      // Get recipients
      const recipients = await db
        .select()
        .from(users)
        .where(inArray(users.id, input.recipientIds));

      // Send notifications
      let sentCount = 0;
      for (const recipient of recipients) {
        // Temporarily disabled push notifications
        if (false) {
          await sendPushNotification({
            to: '', // recipient.pushToken,
            title: "New Survey",
            body: `Please complete: ${survey[0].title}`,
            data: {
              type: "survey_invitation",
              surveyId: input.surveyId,
            },
          });
          sentCount++;
        }
      }

      return {
        success: true,
        sentCount,
        totalRecipients: input.recipientIds.length,
      };
    }),

  // Bulk export reports
  bulkExportReports: protectedProcedure
    .input(
      z.object({
        reportTypes: z.array(
          z.enum([
            "invoices",
            "sessions",
            "budget",
            "team_performance",
            "survey_responses",
          ])
        ),
        projectId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admin and finance can export reports
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance team can export reports");
      }

      const reports: Record<string, any> = {};

      // Generate each requested report
      for (const reportType of input.reportTypes) {
        switch (reportType) {
          case "invoices": {
            let query = db.select().from(invoices);
            if (input.projectId) {
              query = query.where(eq(invoices.projectId, input.projectId)) as any;
            }
            const data = await query;
            reports.invoices = {
              headers: [
                "ID",
                "Facilitator ID",
                "Project ID",
                "Budget Line ID",
                "Amount",
                "Status",
                "Created At",
              ],
              rows: data.map((inv) => [
                inv.id,
                inv.userId,
                inv.projectId,
                inv.totalAmount,
                inv.status,
                inv.createdAt.toISOString(),
              ]),
            };
            break;
          }

          case "sessions": {
            let query = db.select().from(sessions);
            if (input.projectId) {
              query = query.where(eq(sessions.projectId, input.projectId)) as any;
            }
            const data = await query;
            reports.sessions = {
              headers: [
                "ID",
                "Project ID",
                "Title",
                "Venue",
                "Start Time",
                "End Time",
                "Status",
              ],
              rows: data.map((sess) => [
                sess.id,
                sess.projectId,
                sess.title,
                sess.venue,
                sess.startTime.toISOString(),
                sess.endTime.toISOString(),
                sess.status,
              ]),
            };
            break;
          }

          case "team_performance": {
            const facilitators = await db
              .select()
              .from(users)
              .where(eq(users.role, "team_member"));

            const performanceData = [];
            for (const facilitator of facilitators) {
              const sessionsCount = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(sessionFacilitators)
                .where(eq(sessionFacilitators.userId, facilitator.id));

              performanceData.push([
                facilitator.id,
                facilitator.name || "Unknown",
                sessionsCount[0]?.count || 0,
              ]);
            }

            reports.team_performance = {
              headers: ["Facilitator ID", "Name", "Sessions Delivered"],
              rows: performanceData,
            };
            break;
          }

          default:
            break;
        }
      }

      return {
        success: true,
        reports,
        generatedAt: new Date().toISOString(),
      };
    }),

  // Bulk delete items (admin only)
  bulkDelete: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["invoices", "sessions", "surveys", "documents"]),
        ids: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admin can bulk delete
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can perform bulk delete");
      }

      switch (input.entityType) {
        case "invoices":
          await db.delete(invoices).where(inArray(invoices.id, input.ids));
          break;
        case "sessions":
          // Delete session facilitators first
          await db
            .delete(sessionFacilitators)
            .where(inArray(sessionFacilitators.sessionId, input.ids));
          await db.delete(sessions).where(inArray(sessions.id, input.ids));
          break;
        case "surveys":
          // Delete survey responses first
          await db
            .delete(surveyResponses)
            .where(inArray(surveyResponses.surveyId, input.ids));
          await db.delete(surveys).where(inArray(surveys.id, input.ids));
          break;
        default:
          throw new Error("Invalid entity type");
      }

      return {
        success: true,
        deletedCount: input.ids.length,
      };
    }),
});
