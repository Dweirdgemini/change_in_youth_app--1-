import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { videoCallAttendance, sessions, projects, invoices, users } from "../../drizzle/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { notifyInvoiceApproved, notifyInvoicePaid } from "../_core/pushNotifications";
import { generateInvoicePDF } from "../_core/pdfInvoice";
import mysql from "mysql2/promise";
import { ENV } from "../_core/env";

export const autoInvoicesRouter = router({
  // Get draft invoice preview (query version)
  getDraftInvoice: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get unpaid video call attendance
    const unpaidActivities = await db
      .select({
        id: videoCallAttendance.id,
        sessionId: videoCallAttendance.sessionId,
        sessionTitle: sessions.title,
        projectName: projects.name,
        joinedAt: videoCallAttendance.joinedAt,
        durationMinutes: videoCallAttendance.durationMinutes,
        calculatedPayment: videoCallAttendance.calculatedPayment,
        isVirtual: sql<boolean>`true`,
      })
      .from(videoCallAttendance)
      .leftJoin(sessions, eq(videoCallAttendance.sessionId, sessions.id))
      .leftJoin(projects, eq(sessions.projectId, projects.id))
      .where(
        and(
          eq(videoCallAttendance.userId, ctx.user.id),
          eq(videoCallAttendance.invoiceStatus, "unpaid"),
          isNull(videoCallAttendance.invoiceId)
        )
      );

    // Calculate totals
    const totalMinutes = unpaidActivities.reduce(
      (sum, activity) => sum + (activity.durationMinutes || 0),
      0
    );

    const totalAmount = unpaidActivities.reduce(
      (sum, activity) => sum + parseFloat(activity.calculatedPayment || "0"),
      0
    );

    // Get next invoice number
    const [counter] = await db.execute(sql`SELECT current_number FROM invoice_counter WHERE id = 1`);
    const nextInvoiceNumber = ((counter as any)?.current_number || 0) + 1;

    return {
      activities: unpaidActivities,
      totalMinutes,
      totalAmount,
      nextInvoiceNumber,
    };
  }),

  // Generate invoice from unpaid activities
  generateInvoice: protectedProcedure
    .input(z.object({
      budgetLineCategory: z.enum([
        "coordinator",
        "delivery",
        "venue_hire",
        "evaluation_report",
        "contingency",
        "management_fee"
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get unpaid activities
    const unpaidActivities = await db
      .select({
        id: videoCallAttendance.id,
        sessionId: videoCallAttendance.sessionId,
        sessionTitle: sessions.title,
        projectId: sessions.projectId,
        projectName: projects.name,
        durationMinutes: videoCallAttendance.durationMinutes,
        calculatedPayment: videoCallAttendance.calculatedPayment,
      })
      .from(videoCallAttendance)
      .leftJoin(sessions, eq(videoCallAttendance.sessionId, sessions.id))
      .leftJoin(projects, eq(sessions.projectId, projects.id))
      .where(
        and(
          eq(videoCallAttendance.userId, ctx.user.id),
          eq(videoCallAttendance.invoiceStatus, "unpaid"),
          isNull(videoCallAttendance.invoiceId)
        )
      );

    if (unpaidActivities.length === 0) {
      throw new Error("No unpaid activities to invoice");
    }

    // Calculate total
    const totalAmount = unpaidActivities.reduce(
      (sum, activity) => sum + parseFloat(activity.calculatedPayment || "0"),
      0
    );

    // Get and increment invoice number
    await db.execute(sql`UPDATE invoice_counter SET current_number = current_number + 1 WHERE id = 1`);
    const [counter] = await db.execute(sql`SELECT current_number FROM invoice_counter WHERE id = 1`);
    const invoiceNumber = (counter as any)?.current_number || 1;

    // Get primary project for invoice code
    const primaryProject = unpaidActivities[0];
    const invoiceCode = `CIY2026-${String(invoiceNumber).padStart(3, "0")}`;

    // Create invoice using direct MySQL2 connection to avoid Drizzle schema mismatch
    const connection = await mysql.createConnection(ENV.databaseUrl);
    let invoiceId: number;
    
    try {
      const description = `Invoice #${invoiceNumber} - ${unpaidActivities.length} activities`;
      
      const [result] = await connection.execute(
        `INSERT INTO invoices (
          userId, projectId, invoiceNumber, amount, totalAmount, paidAmount,
          description, budgetLineCategory, status, auto_generated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ctx.user.id,
          primaryProject.projectId || 1,
          invoiceCode,
          totalAmount,  // amount column (legacy)
          totalAmount,  // totalAmount column (current)
          0.00,
          description,
          input.budgetLineCategory,
          'pending',
          1  // auto_generated = true
        ]
      );

      invoiceId = (result as any).insertId;
      await connection.end();
      
      if (!invoiceId) {
        throw new Error("Failed to create invoice");
      }

      // Mark activities as invoiced
      for (const activity of unpaidActivities) {
        await db
          .update(videoCallAttendance)
          .set({
            invoiceStatus: "invoiced",
            invoiceId,
            invoicedAt: new Date(),
          })
          .where(eq(videoCallAttendance.id, activity.id));
      }
    } catch (error) {
      await connection.end();
      throw error;
    }

    // Get user name for invoice title
    const [userData] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    return {
      invoiceId,
      invoiceNumber,
      invoiceCode,
      totalAmount,
      title: `${primaryProject.projectName} Invoice ${invoiceNumber} ${invoiceCode}`,
      userName: userData?.name || "Unknown",
    };
  }),

  // Get invoice history
  getInvoiceHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const invoiceHistory = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceCode: invoices.invoiceCode,
        amount: invoices.amount,
        status: invoices.status,
        projectName: projects.name,
        submittedAt: invoices.submittedAt,
        approvedAt: invoices.approvedAt,
      })
      .from(invoices)
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .where(
        and(
          eq(invoices.userId, ctx.user.id),
          eq(invoices.autoGenerated, true)
        )
      )
      .orderBy(sql`${invoices.invoiceNumber} DESC`);

    return invoiceHistory;
  }),

  // Get pending auto-generated invoices (finance/admin only)
  getPendingAutoInvoices: protectedProcedure.query(async ({ ctx }) => {
    console.log("[getPendingAutoInvoices] Called by user:", ctx.user.email, "role:", ctx.user.role);
    const db = await getDb();
    if (!db) {
      console.error("[getPendingAutoInvoices] Database not available");
      throw new Error("Database not available");
    }

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      console.error("[getPendingAutoInvoices] Unauthorized role:", ctx.user.role);
      throw new Error("Only finance/admin can view pending invoices");
    }

    console.log("[getPendingAutoInvoices] Returning test data");
    // Temporary test: return hardcoded data to verify endpoint is working
    return [
      {
        id: 1,
        invoiceNumber: 1,
        invoiceCode: "CIY2026-001",
        amount: 75.00,
        status: "pending",
        userId: 1,
        userName: "Test User",
        userEmail: "test@example.com",
        projectId: 1,
        projectName: "Test Project",
        submittedAt: new Date(),
        description: "Test Invoice",
        activityCount: 1,
        totalHours: "1.00",
      }
    ];
  }),

  // Approve auto-generated invoice
  approveAutoInvoice: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only finance/admin can approve invoices");
      }

      // Update invoice status
      await db
        .update(invoices)
        .set({
          status: "approved",
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
          notes: input.notes || null,
        })
        .where(eq(invoices.id, input.invoiceId));

      // Mark all associated activities as paid
      await db
        .update(videoCallAttendance)
        .set({ invoiceStatus: "paid" })
        .where(eq(videoCallAttendance.invoiceId, input.invoiceId));

      // Get invoice details for notification
      const [invoiceData] = await db
        .select({
          invoiceNumber: invoices.invoiceNumber,
          amount: invoices.amount,
          userId: invoices.userId,
        })
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      // Get user's push token
      const [userData] = await db
        .select({ pushToken: users.pushToken })
        .from(users)
        .where(eq(users.id, invoiceData.userId))
        .limit(1);

      // Send push notification if user has a push token
      if (userData?.pushToken) {
        await notifyInvoicePaid(
          invoiceData.userId,
          userData.pushToken,
          `Invoice #${invoiceData.invoiceNumber}`,
          invoiceData.amount
        );
      }

      return { success: true };
    }),

  // Reject auto-generated invoice
  rejectAutoInvoice: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        notes: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only finance/admin can reject invoices");
      }

      // Update invoice status
      await db
        .update(invoices)
        .set({
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: ctx.user.id,
          notes: input.notes,
        })
        .where(eq(invoices.id, input.invoiceId));

      // Mark all associated activities back to unpaid so they can be re-invoiced
      await db
        .update(videoCallAttendance)
        .set({
          invoiceStatus: "unpaid",
          invoiceId: null,
          invoicedAt: null,
        })
        .where(eq(videoCallAttendance.invoiceId, input.invoiceId));

      // Get invoice details for notification
      const [invoiceData] = await db
        .select({
          invoiceNumber: invoices.invoiceNumber,
          userId: invoices.userId,
        })
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      // Get user's push token
      const [userData] = await db
        .select({ pushToken: users.pushToken })
        .from(users)
        .where(eq(users.id, invoiceData.userId))
        .limit(1);

      // Send push notification if user has a push token
      if (userData?.pushToken) {
        await notifyInvoiceApproved(
          invoiceData.userId,
          userData.pushToken,
          `Invoice #${invoiceData.invoiceNumber}`,
          input.notes
        );
      }

      return { success: true };
    }),

  // Export invoice as PDF
  exportInvoicePDF: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get invoice details (simple query without joins to avoid Drizzle errors)
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Check permission
      if (invoice.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Not authorized to export this invoice");
      }

      // Get user details separately
      const [userData] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, invoice.userId))
        .limit(1);

      // Get project details separately
      const [projectData] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, invoice.projectId))
        .limit(1);

      // Get activities
      const activities = await db
        .select({
          sessionTitle: sessions.title,
          projectName: projects.name,
          joinedAt: videoCallAttendance.joinedAt,
          durationMinutes: videoCallAttendance.durationMinutes,
          calculatedPayment: videoCallAttendance.calculatedPayment,
        })
        .from(videoCallAttendance)
        .leftJoin(sessions, eq(videoCallAttendance.sessionId, sessions.id))
        .leftJoin(projects, eq(sessions.projectId, projects.id))
        .where(eq(videoCallAttendance.invoiceId, input.invoiceId));

      const totalMinutes = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
      const totalHours = (totalMinutes / 60).toFixed(2);

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber: Number(invoice.invoiceNumber) || 0,
        invoiceCode: invoice.invoiceCode || invoice.invoiceNumber || `CIY2026-${String(invoice.id).padStart(3, '0')}`,
        userName: userData?.name || "Unknown",
        userEmail: userData?.email || "",
        projectName: projectData?.name || "Unknown Project",
        submittedDate: invoice.submittedAt
          ? new Date(invoice.submittedAt).toLocaleDateString()
          : "N/A",
        totalHours,
        totalAmount: invoice.totalAmount ? String(invoice.totalAmount) : "0.00",
        activities: activities.map((a) => ({
          sessionTitle: a.sessionTitle || "Untitled Session",
          projectName: a.projectName || "Unknown Project",
          date: a.joinedAt ? new Date(a.joinedAt).toLocaleDateString() : "N/A",
          hours: ((a.durationMinutes || 0) / 60).toFixed(2),
          payment: a.calculatedPayment || "0.00",
        })),
      });

      // Return base64 encoded PDF
      return {
        success: true,
        pdf: pdfBuffer.toString("base64"),
        filename: `Invoice_${invoice.invoiceNumber}_${invoice.invoiceCode}.pdf`,
      };
    }),
});
