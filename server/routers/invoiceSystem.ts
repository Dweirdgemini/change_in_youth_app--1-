import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  invoices, 
  invoiceLineItems, 
  expenses, 
  projects, 
  budgetLines,
  sessionTypes,
  sessions
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const invoiceSystemRouter = router({
  // Get all projects with codes
  getProjects: protectedProcedure.query(async () => {
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
      .where(eq(projects.status, "active"))
      .orderBy(desc(projects.createdAt));
    
    return allProjects;
  }),
  
  // Get budget lines for a project
  getBudgetLines: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const lines = await db
        .select()
        .from(budgetLines)
        .where(eq(budgetLines.projectId, input.projectId))
        .orderBy(budgetLines.name);
      
      return lines;
    }),
  
  // Get session types with pay rates
  getSessionTypes: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const types = await db
      .select()
      .from(sessionTypes)
      .orderBy(sessionTypes.name);
    
    return types;
  }),
  
  // Get my invoices
  getMyInvoices: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const myInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, ctx.user.id))
      .orderBy(desc(invoices.createdAt));
    
    return myInvoices;
  }),
  
  // Get invoice details with line items
  getInvoiceDetails: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const invoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);
      
      if (invoice.length === 0) throw new Error("Invoice not found");
      
      // Check permission
      if (invoice[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Not authorized to view this invoice");
      }
      
      const lineItems = await db
        .select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, input.invoiceId))
        .orderBy(invoiceLineItems.createdAt);
      
      return { invoice: invoice[0], lineItems };
    }),
  
  // Generate invoice from completed sessions and expenses
  generateInvoice: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      includeSessionIds: z.array(z.number()).optional(),
      includeExpenseIds: z.array(z.number()).optional(),
      budgetLineCategory: z.enum([
        "coordinator",
        "delivery",
        "venue_hire",
        "evaluation_report",
        "contingency",
        "management_fee"
      ]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Generate invoice number
      const invoiceCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(eq(invoices.userId, ctx.user.id));
      
      const invoiceNumber = `INV-${ctx.user.id}-${Date.now()}`;
      
      // Create invoice
      const [newInvoice] = await db.insert(invoices).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        invoiceNumber,
        amount: "0.00", // Legacy column
        totalAmount: "0.00",
        budgetLineCategory: input.budgetLineCategory,
        status: "draft",
      });
      
      const invoiceId = newInvoice.insertId;
      let totalAmount = 0;
      
      // Add session line items
      if (input.includeSessionIds && input.includeSessionIds.length > 0) {
        for (const sessionId of input.includeSessionIds) {
          const session = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);
          
          if (session.length > 0) {
            const sessionData = session[0];
            const payment = sessionData.paymentPerFacilitator 
              ? parseFloat(sessionData.paymentPerFacilitator) 
              : 0;
            
            if (payment > 0) {
              // Find appropriate budget line (default to first one)
              const projectBudgetLines = await db
                .select()
                .from(budgetLines)
                .where(eq(budgetLines.projectId, input.projectId))
                .limit(1);
              
              if (projectBudgetLines.length > 0) {
                await db.insert(invoiceLineItems).values({
                  invoiceId,
                  budgetLineId: projectBudgetLines[0].id,
                  description: `Session: ${sessionData.title}`,
                  quantity: "1.00",
                  unitPrice: payment.toFixed(2),
                  totalPrice: payment.toFixed(2),
                  sessionId,
                });
                
                totalAmount += payment;
              }
            }
          }
        }
      }
      
      // Add expense line items
      if (input.includeExpenseIds && input.includeExpenseIds.length > 0) {
        for (const expenseId of input.includeExpenseIds) {
          const expense = await db
            .select()
            .from(expenses)
            .where(
              and(
                eq(expenses.id, expenseId),
                eq(expenses.userId, ctx.user.id)
              )
            )
            .limit(1);
          
          if (expense.length > 0) {
            const expenseData = expense[0];
            const amount = parseFloat(expenseData.amount);
            
            await db.insert(invoiceLineItems).values({
              invoiceId,
              budgetLineId: expenseData.budgetLineId,
              description: `Expense: ${expenseData.description}`,
              quantity: "1.00",
              unitPrice: amount.toFixed(2),
              totalPrice: amount.toFixed(2),
              expenseId,
            });
            
            totalAmount += amount;
          }
        }
      }
      
      // Update invoice total
      await db
        .update(invoices)
        .set({ totalAmount: totalAmount.toFixed(2) })
        .where(eq(invoices.id, invoiceId));
      
      return { success: true, invoiceId };
    }),
  
  // Submit invoice for approval
  submitInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const invoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);
      
      if (invoice.length === 0) throw new Error("Invoice not found");
      if (invoice[0].userId !== ctx.user.id) throw new Error("Not authorized");
      
      await db
        .update(invoices)
        .set({ 
          status: "pending",
          submittedAt: new Date()
        })
        .where(eq(invoices.id, input.invoiceId));
      
      return { success: true };
    }),
  
  // Admin: Approve invoice
  approveInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can approve invoices");
      }
      
      await db
        .update(invoices)
        .set({ 
          status: "approved",
          approvedAt: new Date(),
          approvedBy: ctx.user.id
        })
        .where(eq(invoices.id, input.invoiceId));
      
      return { success: true };
    }),
  
  // Admin: Request changes to invoice
  requestChanges: protectedProcedure
    .input(z.object({ 
      invoiceId: z.number(),
      comments: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can request changes");
      }
      
      await db
        .update(invoices)
        .set({ 
          status: "pending",
          adminComments: input.comments
        })
        .where(eq(invoices.id, input.invoiceId));
      
      return { success: true };
    }),
  
  // Admin: Mark invoice as paid
  markInvoicePaid: protectedProcedure
    .input(z.object({ 
      invoiceId: z.number(),
      paidAmount: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can mark invoices as paid");
      }
      
      await db
        .update(invoices)
        .set({ 
          status: "paid",
          paidAt: new Date(),
          paidAmount: input.paidAmount.toFixed(2)
        })
        .where(eq(invoices.id, input.invoiceId));
      
      return { success: true };
    }),
  
  // Create expense
  createExpense: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      budgetLineId: z.number(),
      description: z.string(),
      amount: z.number(),
      receiptUrl: z.string().optional(),
      expenseDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [newExpense] = await db.insert(expenses).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        budgetLineId: input.budgetLineId,
        description: input.description,
        amount: input.amount.toFixed(2),
        receiptUrl: input.receiptUrl,
        expenseDate: input.expenseDate,
        status: "pending",
      });
      
      return { success: true, expenseId: newExpense.insertId };
    }),
  
  // Get my expenses
  getMyExpenses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const myExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, ctx.user.id))
      .orderBy(desc(expenses.createdAt));
    
    return myExpenses;
  }),

  // Get all expenses (admin only)
  getAllExpenses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Unauthorized: Admin access required");
    }
    
    const allExpenses = await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.createdAt));
    
    return allExpenses;
  }),
  
  // Get pending invoices (admin)
  getPendingInvoices: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins and finance can view pending invoices");
    }
    
    const pending = await db
      .select()
      .from(invoices)
      .where(eq(invoices.status, "pending"))
      .orderBy(desc(invoices.submittedAt));
    
    return pending;
  }),
});
