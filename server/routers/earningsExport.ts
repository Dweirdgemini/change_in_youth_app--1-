import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { invoices, projects, invoiceLineItems } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export const earningsExportRouter = router({
  // Export earnings to CSV
  exportToCSV: protectedProcedure
    .input(z.object({
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select({
          invoiceNumber: invoices.invoiceNumber,
          projectId: invoices.projectId,
          amount: invoices.totalAmount,
          paidAmount: invoices.paidAmount,
          status: invoices.status,
          submittedAt: invoices.submittedAt,
          approvedAt: invoices.approvedAt,
          paidAt: invoices.paidAt,
        })
        .from(invoices)
        .where(eq(invoices.userId, ctx.user.id))
        .$dynamic();

      if (input.dateFrom) {
        query = query.where(gte(invoices.createdAt, input.dateFrom));
      }
      if (input.dateTo) {
        query = query.where(lte(invoices.createdAt, input.dateTo));
      }

      const invoiceData = await query.orderBy(desc(invoices.createdAt));

      // Get project names
      const allProjects = await db.select().from(projects);
      const projectMap = new Map(allProjects.map(p => [p.id, p.name]));

      // Generate CSV
      const headers = "Invoice Number,Project,Amount,Paid Amount,Status,Submitted Date,Approved Date,Paid Date\n";
      const rows = invoiceData.map(inv => {
        const projectName = projectMap.get(inv.projectId) || "Unknown";
        return [
          inv.invoiceNumber,
          projectName,
          inv.amount,
          inv.paidAmount || "0.00",
          inv.status,
          inv.submittedAt ? new Date(inv.submittedAt).toLocaleDateString() : "",
          inv.approvedAt ? new Date(inv.approvedAt).toLocaleDateString() : "",
          inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "",
        ].join(",");
      }).join("\n");

      const csvContent = headers + rows;

      return { csv: csvContent };
    }),

  // Get earnings summary for PDF export
  getEarningsSummary: protectedProcedure
    .input(z.object({
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, ctx.user.id))
        .$dynamic();

      if (input.dateFrom) {
        query = query.where(gte(invoices.createdAt, input.dateFrom));
      }
      if (input.dateTo) {
        query = query.where(lte(invoices.createdAt, input.dateTo));
      }

      const invoiceData = await query.orderBy(desc(invoices.createdAt));

      // Get project names
      const allProjects = await db.select().from(projects);
      const projectMap = new Map(allProjects.map(p => [p.id, p.name]));

      // Calculate totals
      const totalPaid = invoiceData
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + parseFloat(inv.paidAmount || "0"), 0);

      const totalPending = invoiceData
        .filter(inv => inv.status === "approved" || inv.status === "pending")
        .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);

      // Group by project
      const byProject = allProjects.map(project => {
        const projectInvoices = invoiceData.filter(inv => inv.projectId === project.id);
        const paid = projectInvoices
          .filter(inv => inv.status === "paid")
          .reduce((sum, inv) => sum + parseFloat(inv.paidAmount || "0"), 0);
        const pending = projectInvoices
          .filter(inv => inv.status === "approved" || inv.status === "pending")
          .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);

        return {
          projectName: project.name,
          paid,
          pending,
          total: paid + pending,
          invoiceCount: projectInvoices.length,
        };
      }).filter(p => p.invoiceCount > 0);

      return {
        userName: ctx.user.name || ctx.user.email,
        totalPaid,
        totalPending,
        grandTotal: totalPaid + totalPending,
        byProject,
        invoices: invoiceData.map(inv => ({
          ...inv,
          projectName: projectMap.get(inv.projectId) || "Unknown",
        })),
      };
    }),
});
