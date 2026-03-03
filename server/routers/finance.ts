import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { invoices, budgetLines, projects, expectedPayments } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const financeRouter = router({
  // Get all users (for historical invoice imports)
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
      throw new Error("Only admin and finance users can view all users");
    }

    const allUsers = await db.select({
      id: sql`${sql.raw('users.id')}`,
      name: sql`${sql.raw('users.name')}`,
      email: sql`${sql.raw('users.email')}`,
      role: sql`${sql.raw('users.role')}`,
    }).from(sql`users`);
    
    return allUsers;
  }),

  // Get all projects
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
      .from(projects);
    return allProjects;
  }),

  // Create a new project (admin only)
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        description: z.string().optional(),
        totalBudget: z.number().positive(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["active", "completed", "on_hold"]).default("active"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admin users can create projects");
      }

      const result = await db.insert(projects).values({
        name: input.name,
        code: input.code,
        description: input.description || null,
        totalBudget: input.totalBudget.toString(),
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: input.status,
      });

      return { success: true, projectId: Number(result[0].insertId) };
    }),

  // Update an existing project (admin only)
  updateProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        description: z.string().optional(),
        totalBudget: z.number().positive().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["active", "completed", "on_hold"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admin users can update projects");
      }

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.code) updateData.code = input.code;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.totalBudget) updateData.totalBudget = input.totalBudget.toString();
      if (input.startDate) updateData.startDate = new Date(input.startDate);
      if (input.endDate) updateData.endDate = new Date(input.endDate);
      if (input.status) updateData.status = input.status;

      await db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, input.projectId));

      return { success: true };
    }),


  // Create a new budget line (admin/finance only)
  createBudgetLine: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        category: z.string(),
        allocatedAmount: z.number().positive(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only admin and finance users can create budget lines");
      }

      const result = await db.insert(budgetLines).values({
        projectId: input.projectId,
        name: input.category, // Use category as name
        category: input.category as any,
        allocatedAmount: input.allocatedAmount.toString(),
        spentAmount: "0.00",
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        description: input.description || null,
      });

      return { success: true, budgetLineId: Number(result[0].insertId) };
    }),

  // Update an existing budget line (admin/finance only)
  updateBudgetLine: protectedProcedure
    .input(
      z.object({
        budgetLineId: z.number(),
        category: z.string().optional(),
        allocatedAmount: z.number().positive().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only admin and finance users can update budget lines");
      }

      const updateData: any = {};
      if (input.category) updateData.category = input.category;
      if (input.allocatedAmount) updateData.allocatedAmount = input.allocatedAmount.toString();
      if (input.startDate) updateData.startDate = new Date(input.startDate);
      if (input.endDate) updateData.endDate = new Date(input.endDate);
      if (input.description !== undefined) updateData.description = input.description;

      await db
        .update(budgetLines)
        .set(updateData)
        .where(eq(budgetLines.id, input.budgetLineId));

      return { success: true };
    }),

  // Delete a budget line (admin/finance only)
  deleteBudgetLine: protectedProcedure
    .input(z.object({ budgetLineId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only admin and finance users can delete budget lines");
      }

      // Delete the budget line
      await db.delete(budgetLines).where(eq(budgetLines.id, input.budgetLineId));

      return { success: true };
    }),

  // Get all budget lines with spending summary
  getBudgetLines: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const lines = await db.select().from(budgetLines).orderBy(desc(budgetLines.createdAt));
    
    // Calculate spent amount for each budget line
    const linesWithSpending = await Promise.all(
      lines.map(async (line) => {
        const result = await db
          .select({ total: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)` })
          .from(invoices)
          .where(
            and(
              // Note: With new invoice system, budget tracking is via invoice_line_items
              // This is a simplified query for backward compatibility
              eq(invoices.projectId, line.projectId),
              eq(invoices.status, "approved")
            )
          );
        
        const spent = result[0]?.total || 0;
        const allocated = parseFloat(line.allocatedAmount);
        const remaining = allocated - spent;
        
        return {
          ...line,
          spent,
          remaining,
          percentageUsed: allocated > 0 ? (spent / allocated) * 100 : 0,
        };
      })
    );

    return linesWithSpending;
  }),

  // Get project budget summary
  getProjectBudget: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const project = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (!project[0]) throw new Error("Project not found");

      const lines = await db.select().from(budgetLines).where(eq(budgetLines.projectId, input.projectId));
      
      const totalBudget = lines.reduce((sum, line) => sum + parseFloat(line.allocatedAmount), 0);
      
      const spentResult = await db
        .select({ total: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)` })
        .from(invoices)
        .where(
          and(
            eq(invoices.projectId, input.projectId),
            eq(invoices.status, "approved")
          )
        );
      
      const spent = spentResult[0]?.total || 0;
      const remaining = totalBudget - spent;

      return {
        project: project[0],
        totalBudget,
        spent,
        remaining,
        percentageUsed: totalBudget > 0 ? (spent / totalBudget) * 100 : 0,
        budgetLines: lines,
      };
    }),

  // Submit an invoice
  submitInvoice: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        budgetLineId: z.number(),
        amount: z.number().positive(),
        description: z.string(),
        invoiceNumber: z.string().optional(),
        invoiceDate: z.string(),
        fileUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(invoices).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        amount: input.amount.toString(), // Legacy column
        totalAmount: input.amount.toString(),
        paidAmount: "0.00",
        description: input.description,
        invoiceNumber: input.invoiceNumber || `INV-${ctx.user.id}-${Date.now()}`,
        fileUrl: input.fileUrl || null,
        status: "pending",
      });

      return { success: true, invoiceId: Number(result[0].insertId) };
    }),

  // Import historical invoice (admin/finance only)
  importHistoricalInvoice: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        projectId: z.number(),
        budgetLineId: z.number().optional(),
        amount: z.number().positive(),
        description: z.string(),
        invoiceNumber: z.string(),
        invoiceDate: z.string(),
        approvedDate: z.string().optional(),
        paidDate: z.string().optional(),
        fileUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only admin and finance users can import historical invoices");
      }

      // Determine status based on provided dates
      let status: "pending" | "approved" | "paid" = "pending";
      if (input.paidDate) {
        status = "paid";
      } else if (input.approvedDate) {
        status = "approved";
      }

      const result = await db.insert(invoices).values({
        userId: input.userId,
        projectId: input.projectId,
        amount: input.amount.toString(), // Legacy column
        totalAmount: input.amount.toString(),
        paidAmount: status === "paid" ? input.amount.toString() : "0.00",
        description: input.description,
        invoiceNumber: input.invoiceNumber,
        fileUrl: input.fileUrl || null,
        status,
        approvedBy: status !== "pending" ? ctx.user.id : null,
        approvedAt: input.approvedDate ? new Date(input.approvedDate) : null,
        paidAt: input.paidDate ? new Date(input.paidDate) : null,
        createdAt: new Date(input.invoiceDate),
      });

      return { success: true, invoiceId: Number(result[0].insertId) };
    }),

  // Bulk import historical invoices from CSV (admin/finance only)
  bulkImportHistoricalInvoices: protectedProcedure
    .input(
      z.object({
        invoices: z.array(
          z.object({
            userEmail: z.string().email(),
            projectName: z.string(),
            amount: z.number().positive(),
            invoiceNumber: z.string(),
            description: z.string().optional(),
            invoiceDate: z.string(),
            approvedDate: z.string().optional(),
            paidDate: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only admin and finance users can bulk import invoices");
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Get all users and projects for lookup
      const allUsers = await db.select().from(sql`users`);
      const allProjects = await db.select().from(projects);

      const userMap = new Map(allUsers.map((u: any) => [u.email?.toLowerCase(), u.id]));
      const projectMap = new Map(allProjects.map((p) => [p.name.toLowerCase(), p.id]));

      for (let i = 0; i < input.invoices.length; i++) {
        const invoice = input.invoices[i];
        try {
          // Find user by email
          const userId = userMap.get(invoice.userEmail.toLowerCase());
          if (!userId) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: User not found with email ${invoice.userEmail}`);
            continue;
          }

          // Find project by name
          const projectId = projectMap.get(invoice.projectName.toLowerCase());
          if (!projectId) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Project not found with name ${invoice.projectName}`);
            continue;
          }

          // Determine status
          let status: "pending" | "approved" | "paid" = "pending";
          if (invoice.paidDate) {
            status = "paid";
          } else if (invoice.approvedDate) {
            status = "approved";
          }

          // Insert invoice
          await db.insert(invoices).values({
            userId,
            projectId,
            amount: invoice.amount.toString(), // Legacy column
            totalAmount: invoice.amount.toString(),
            paidAmount: status === "paid" ? invoice.amount.toString() : "0.00",
            description: invoice.description || `Historical invoice ${invoice.invoiceNumber}`,
            invoiceNumber: invoice.invoiceNumber,
            fileUrl: null,
            status,
            approvedBy: status !== "pending" ? ctx.user.id : null,
            approvedAt: invoice.approvedDate ? new Date(invoice.approvedDate) : null,
            paidAt: invoice.paidDate ? new Date(invoice.paidDate) : null,
            createdAt: new Date(invoice.invoiceDate),
          });

          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      return results;
    }),

  // Get all invoices (with filters)
  getInvoices: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "paid"]).optional(),
        projectId: z.number().optional(),
        facilitatorId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(invoices);
      
      const conditions = [];
      if (input.status) conditions.push(eq(invoices.status, input.status));
      if (input.projectId) conditions.push(eq(invoices.projectId, input.projectId));
      if (input.facilitatorId) conditions.push(eq(invoices.userId, input.facilitatorId));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query.orderBy(desc(invoices.createdAt));
      return results;
    }),

  // Get current user's invoices only (for team members)
  getMyInvoices: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, ctx.user.id))
      .orderBy(desc(invoices.createdAt));

    return results;
  }),

  // Get invoice by ID (user can only view their own invoices unless admin/finance)
  getInvoiceById: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [invoice] = await db
        .select({
          id: invoices.id,
          userId: invoices.userId,
          projectId: invoices.projectId,
          invoiceNumber: invoices.invoiceNumber,
          totalAmount: invoices.totalAmount,
          paidAmount: invoices.paidAmount,
          description: invoices.description,
          fileUrl: invoices.fileUrl,
          budgetLineCategory: invoices.budgetLineCategory,
          status: invoices.status,
          dueDate: invoices.dueDate,
          submittedAt: invoices.submittedAt,
          approvedAt: invoices.approvedAt,
          approvedBy: invoices.approvedBy,
          paidAt: invoices.paidAt,
          rejectionReason: invoices.rejectionReason,
          notes: invoices.notes,
          invoiceCode: sql<string>`COALESCE(${invoices.invoiceNumber}, CONCAT('CIY2026-', LPAD(${invoices.id}, 3, '0')))`,
          projectName: projects.name,
        })
        .from(invoices)
        .leftJoin(projects, eq(invoices.projectId, projects.id))
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Check permissions: users can only view their own invoices unless admin/finance
      if (
        invoice.userId !== ctx.user.id &&
        ctx.user.role !== "admin" &&
        ctx.user.role !== "finance"
      ) {
        throw new Error("You don't have permission to view this invoice");
      }

      return invoice;
    }),

  // Approve/reject invoice (finance role only)
  reviewInvoice: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        status: z.enum(["approved", "rejected"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only finance team can review invoices");
      }

      await db
        .update(invoices)
        .set({
          status: input.status,
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          rejectionReason: input.status === "rejected" ? input.notes || null : null,
        })
        .where(eq(invoices.id, input.invoiceId));

      return { success: true };
    }),

  // Mark invoice as paid
  markInvoicePaid: protectedProcedure
    .input(z.object({ invoiceId: z.number(), paymentDate: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only finance team can mark invoices as paid");
      }

      await db
        .update(invoices)
        .set({
          status: "paid",
          paidAt: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        })
        .where(eq(invoices.id, input.invoiceId));

      return { success: true };
    }),

  // Get expected payments for a project
  getExpectedPayments: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(expectedPayments);
      
      if (input.projectId) {
        query = query.where(eq(expectedPayments.projectId, input.projectId)) as any;
      }

      const results = await query.orderBy(desc(expectedPayments.createdAt));
      return results;
    }),

  // Create expected payment
  createExpectedPayment: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        budgetLineId: z.number(),
        facilitatorId: z.number(),
        facilitatorName: z.string(),
        sessionId: z.number().optional(),
        amount: z.number().positive(),
        description: z.string(),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "finance" && ctx.user.role !== "admin") {
        throw new Error("Only finance team can create expected payments");
      }

      const result = await db.insert(expectedPayments).values({
        userId: input.facilitatorId,
        projectId: input.projectId,
        budgetLineId: input.budgetLineId,
        sessionId: input.sessionId || null,
        amount: input.amount.toString(),
        description: input.description,
        dueDate: new Date(input.dueDate),
      });

      return { success: true, expectedPaymentId: Number(result[0].insertId) };
    }),

  // TEMP ALIAS: getAllInvoices → getInvoices (for backward compatibility)
  // TODO: Remove after migrating all client calls to use getInvoices
  getAllInvoices: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "paid"]).optional(),
        projectId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      // Call the canonical getInvoices procedure
      const caller = financeRouter.createCaller(ctx);
      return caller.getInvoices(input);
    }),
});
