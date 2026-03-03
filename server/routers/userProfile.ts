import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { payRates, payslips, adminNotes, onboardingPacks, onboardingPackDocuments, userActivityLog, users } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const userProfileRouter = router({
  // ========================================
  // PROFILE MANAGEMENT
  // ========================================
  
  /**
   * Update user profile (name, email, profile image)
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        profileImageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const userId = ctx.user.id;

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.profileImageUrl !== undefined) updateData.profileImageUrl = input.profileImageUrl;

      await db.update(users).set(updateData).where(eq(users.id, userId));

      return {
        success: true,
        message: "Profile updated successfully",
      };
    }),

  /**
   * Get current user profile
   */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const userId = ctx.user.id;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user;
  }),
  
  // ========================================
  // PAY RATES
  // ========================================
  
  getPayRates: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const rates = await db
        .select()
        .from(payRates)
        .where(eq(payRates.userId, input.userId))
        .orderBy(desc(payRates.effectiveDate));
      
      return rates;
    }),
  
  getCurrentPayRate: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const rates = await db
        .select()
        .from(payRates)
        .where(eq(payRates.userId, input.userId))
        .orderBy(desc(payRates.effectiveDate))
        .limit(1);
      
      return rates[0] || null;
    }),
  
  createPayRate: protectedProcedure
    .input(z.object({
      userId: z.number(),
      hourlyRate: z.number().optional(),
      sessionRate: z.number().optional(),
      effectiveDate: z.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can create pay rates");
      }
      
      const [newRate] = await db.insert(payRates).values({
        userId: input.userId,
        hourlyRate: input.hourlyRate?.toString(),
        sessionRate: input.sessionRate?.toString(),
        effectiveDate: input.effectiveDate,
        notes: input.notes,
        createdBy: ctx.user.id,
      });
      
      // Log activity
      await db.insert(userActivityLog).values({
        userId: input.userId,
        actionType: "pay_rate_updated",
        actionDescription: `Pay rate updated to ${input.sessionRate ? `£${input.sessionRate}/session` : `£${input.hourlyRate}/hour`}`,
        entityType: "pay_rate",
        entityId: newRate.insertId,
        performedBy: ctx.user.id,
      });
      
      return { success: true, id: newRate.insertId };
    }),
  
  // ========================================
  // PAYSLIPS
  // ========================================
  
  getPayslips: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Users can only see their own payslips unless they're admin/finance
      const targetUserId = input.userId || ctx.user.id;
      
      if (targetUserId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("You can only view your own payslips");
      }
      
      const slips = await db
        .select()
        .from(payslips)
        .where(eq(payslips.userId, targetUserId))
        .orderBy(desc(payslips.payPeriodEnd));
      
      return slips;
    }),
  
  uploadPayslip: protectedProcedure
    .input(z.object({
      userId: z.number(),
      payPeriodStart: z.date(),
      payPeriodEnd: z.date(),
      grossAmount: z.number(),
      netAmount: z.number(),
      fileUrl: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can upload payslips");
      }
      
      const [newPayslip] = await db.insert(payslips).values({
        userId: input.userId,
        payPeriodStart: input.payPeriodStart,
        payPeriodEnd: input.payPeriodEnd,
        grossAmount: input.grossAmount.toString(),
        netAmount: input.netAmount.toString(),
        fileUrl: input.fileUrl,
        uploadedBy: ctx.user.id,
      });
      
      // Log activity
      await db.insert(userActivityLog).values({
        userId: input.userId,
        actionType: "payslip_uploaded",
        actionDescription: `Payslip uploaded for period ${input.payPeriodStart.toLocaleDateString()} - ${input.payPeriodEnd.toLocaleDateString()}`,
        entityType: "payslip",
        entityId: newPayslip.insertId,
        performedBy: ctx.user.id,
      });
      
      return { success: true, id: newPayslip.insertId };
    }),
  
  // ========================================
  // ADMIN NOTES
  // ========================================
  
  getAdminNotes: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view admin notes");
      }
      
      const notes = await db
        .select()
        .from(adminNotes)
        .where(eq(adminNotes.userId, input.userId))
        .orderBy(desc(adminNotes.createdAt));
      
      return notes;
    }),
  
  createAdminNote: protectedProcedure
    .input(z.object({
      userId: z.number(),
      note: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can create admin notes");
      }
      
      const [newNote] = await db.insert(adminNotes).values({
        userId: input.userId,
        note: input.note,
        createdBy: ctx.user.id,
      });
      
      return { success: true, id: newNote.insertId };
    }),
  
  deleteAdminNote: protectedProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can delete admin notes");
      }
      
      await db.delete(adminNotes).where(eq(adminNotes.id, input.noteId));
      
      return { success: true };
    }),
  
  // ========================================
  // ONBOARDING PACKS
  // ========================================
  
  getOnboardingPacks: protectedProcedure
    .input(z.object({ role: z.enum(["admin", "finance", "team_member", "student"]).optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(onboardingPacks);
      
      if (input.role) {
        query = query.where(eq(onboardingPacks.role, input.role)) as any;
      }
      
      const packs = await query;
      return packs;
    }),
  
  getOnboardingPackDocuments: protectedProcedure
    .input(z.object({ packId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const docs = await db
        .select()
        .from(onboardingPackDocuments)
        .where(eq(onboardingPackDocuments.packId, input.packId))
        .orderBy(onboardingPackDocuments.orderIndex);
      
      return docs;
    }),
  
  createOnboardingPack: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      role: z.enum(["admin", "finance", "team_member", "student"]),
      documentIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can create onboarding packs");
      }
      
      const [newPack] = await db.insert(onboardingPacks).values({
        name: input.name,
        description: input.description,
        role: input.role,
        createdBy: ctx.user.id,
      });
      
      // Add documents to pack
      if (input.documentIds.length > 0) {
        await db.insert(onboardingPackDocuments).values(
          input.documentIds.map((docId, index) => ({
            packId: newPack.insertId,
            documentId: docId,
            orderIndex: index,
          }))
        );
      }
      
      return { success: true, id: newPack.insertId };
    }),
  
  // ========================================
  // ACTIVITY LOG
  // ========================================
  
  getUserActivity: protectedProcedure
    .input(z.object({ 
      userId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const activities = await db
        .select()
        .from(userActivityLog)
        .where(eq(userActivityLog.userId, input.userId))
        .orderBy(desc(userActivityLog.createdAt))
        .limit(input.limit);
      
      return activities;
    }),
  
  logActivity: protectedProcedure
    .input(z.object({
      userId: z.number(),
      actionType: z.string(),
      actionDescription: z.string(),
      entityType: z.string().optional(),
      entityId: z.number().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [activity] = await db.insert(userActivityLog).values({
        userId: input.userId,
        actionType: input.actionType,
        actionDescription: input.actionDescription,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
        performedBy: ctx.user.id,
      });
      
      return { success: true, id: activity.insertId };
    }),
});
