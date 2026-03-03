import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { developmentRecords, users } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const personalDevelopmentRouter = router({
  // Get development records for a user
  getDevelopmentRecords: protectedProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Users can only view their own records unless they're admin
      if (ctx.user.id !== input.userId && ctx.user.role !== "admin") {
        throw new Error("Not authorized to view these records");
      }
      
      const records = await db
        .select({
          id: developmentRecords.id,
          recordType: developmentRecords.recordType,
          title: developmentRecords.title,
          description: developmentRecords.description,

          completedDate: developmentRecords.completedDate,
          createdAt: developmentRecords.createdAt,
          createdByName: users.name,
        })
        .from(developmentRecords)
        .leftJoin(users, eq(users.id, developmentRecords.addedBy))
        .where(eq(developmentRecords.userId, input.userId))
        .orderBy(desc(developmentRecords.createdAt));
      
      return records;
    }),

  // Create a development record (admin only)
  createDevelopmentRecord: adminProcedure
    .input(z.object({
      userId: z.number(),
      recordType: z.enum(["skill_assessment", "goal", "performance_note", "milestone"]),
      title: z.string(),
      description: z.string().optional(),
      targetDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      const [record] = await db.insert(developmentRecords).values({
        userId: input.userId,
        recordType: input.recordType,
        title: input.title,
        description: input.description,
        addedBy: ctx.user.id,
      }).$returningId();
      
      return { recordId: record.id };
    }),

  // Update development record status
  updateRecordStatus: adminProcedure
    .input(z.object({
      recordId: z.number(),
      status: z.enum(["not_started", "in_progress", "completed", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // Update completedDate when marking as completed
      await db
        .update(developmentRecords)
        .set({ completedDate: new Date() })
        .where(eq(developmentRecords.id, input.recordId));
      
      return { success: true };
    }),

  // Get development summary for a user
  getDevelopmentSummary: protectedProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Users can only view their own summary unless they're admin
      if (ctx.user.id !== input.userId && ctx.user.role !== "admin") {
        throw new Error("Not authorized to view this summary");
      }
      
      const records = await db
        .select()
        .from(developmentRecords)
        .where(eq(developmentRecords.userId, input.userId));
      
      const summary = {
        totalRecords: records.length,
        byType: {
          skill_assessment: records.filter(r => r.recordType === "skill_assessment").length,
          goal: records.filter(r => r.recordType === "goal").length,
          performance_note: records.filter(r => r.recordType === "performance_note").length,
          milestone: records.filter(r => r.recordType === "milestone").length,
        },
        recentCompletions: records
          .filter(r => r.completedDate)
          .sort((a, b) => {
            const dateA = a.completedDate ? new Date(a.completedDate).getTime() : 0;
            const dateB = b.completedDate ? new Date(b.completedDate).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map(r => ({
            title: r.title,
            recordType: r.recordType,
            completedDate: r.completedDate,
          })),
      };
      
      return summary;
    }),

  // Delete a development record (admin only)
  deleteDevelopmentRecord: adminProcedure
    .input(z.object({
      recordId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db
        .delete(developmentRecords)
        .where(eq(developmentRecords.id, input.recordId));
      
      return { success: true };
    }),
});
