import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { dbsRecords, users } from "../../drizzle/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";
import { sendEmail, generateDbsReminderEmail } from "../_core/email";

export const dbsTrackingRouter = router({
  // Add or update DBS record
  upsertDbsRecord: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        userId: z.number(),
        certificateNumber: z.string(),
        dbsType: z.enum(["basic", "standard", "enhanced", "enhanced_barred"]),
        issueDate: z.string(), // ISO date string
        expiryDate: z.string(), // ISO date string
        certificateUrl: z.string().optional(),
        notes: z.string().optional(),
        renewalPeriodYears: z.number().default(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can manage DBS records");
      }

      // Calculate status based on expiry date
      const expiryDate = new Date(input.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let status: "valid" | "expiring_soon" | "expired" | "pending" = "valid";
      if (daysUntilExpiry < 0) {
        status = "expired";
      } else if (daysUntilExpiry <= 60) {
        status = "expiring_soon";
      }

      const recordData = {
        userId: input.userId,
        certificateNumber: input.certificateNumber,
        dbsType: input.dbsType,
        issueDate: new Date(input.issueDate),
        expiryDate: new Date(input.expiryDate),
        status,
        certificateUrl: input.certificateUrl || null,
        notes: input.notes || null,
        renewalPeriodYears: input.renewalPeriodYears,
      };

      if (input.id) {
        // Update existing record
        await db
          .update(dbsRecords)
          .set(recordData)
          .where(eq(dbsRecords.id, input.id));

        return { success: true, recordId: input.id };
      } else {
        // Create new record
        const [result] = await db.insert(dbsRecords).values(recordData);
        return { success: true, recordId: result.insertId };
      }
    }),

  // Get DBS record for a user
  getDbsRecord: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Users can view their own DBS, admins can view anyone's
      if (ctx.user.role !== "admin" && ctx.user.id !== input.userId) {
        throw new Error("Not authorized to view this DBS record");
      }

      const [record] = await db
        .select()
        .from(dbsRecords)
        .where(eq(dbsRecords.userId, input.userId))
        .orderBy(sql`${dbsRecords.createdAt} DESC`)
        .limit(1);

      return record || null;
    }),

  // Get all DBS records (admin only)
  getAllDbsRecords: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can view all DBS records");
    }

    const records = await db
      .select({
        id: dbsRecords.id,
        userId: dbsRecords.userId,
        userName: users.name,
        userEmail: users.email,
        certificateNumber: dbsRecords.certificateNumber,
        dbsType: dbsRecords.dbsType,
        issueDate: dbsRecords.issueDate,
        expiryDate: dbsRecords.expiryDate,
        status: dbsRecords.status,
        certificateUrl: dbsRecords.certificateUrl,
        notes: dbsRecords.notes,
        renewalPeriodYears: dbsRecords.renewalPeriodYears,
        createdAt: dbsRecords.createdAt,
        updatedAt: dbsRecords.updatedAt,
      })
      .from(dbsRecords)
      .leftJoin(users, eq(dbsRecords.userId, users.id))
      .orderBy(sql`${dbsRecords.expiryDate} ASC`);

    return records;
  }),

  // Get DBS records expiring soon (for reminders)
  getExpiringRecords: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().default(60),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view expiring records");
      }

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysAhead);

      const records = await db
        .select({
          id: dbsRecords.id,
          userId: dbsRecords.userId,
          userName: users.name,
          userEmail: users.email,
          certificateNumber: dbsRecords.certificateNumber,
          expiryDate: dbsRecords.expiryDate,
          status: dbsRecords.status,
        })
        .from(dbsRecords)
        .leftJoin(users, eq(dbsRecords.userId, users.id))
        .where(
          and(
            gte(dbsRecords.expiryDate, now),
            lte(dbsRecords.expiryDate, futureDate)
          )
        )
        .orderBy(sql`${dbsRecords.expiryDate} ASC`);

      return records;
    }),

  // Get compliance statistics
  getComplianceStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can view compliance stats");
    }

    const allRecords = await db.select().from(dbsRecords);

    const stats = {
      total: allRecords.length,
      valid: allRecords.filter((r) => r.status === "valid").length,
      expiringSoon: allRecords.filter((r) => r.status === "expiring_soon").length,
      expired: allRecords.filter((r) => r.status === "expired").length,
      pending: allRecords.filter((r) => r.status === "pending").length,
    };

    return stats;
  }),

  // Delete DBS record
  deleteDbsRecord: protectedProcedure
    .input(
      z.object({
        recordId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can delete DBS records");
      }

      await db.delete(dbsRecords).where(eq(dbsRecords.id, input.recordId));

      return { success: true };
    }),

  // Update DBS statuses (cron job helper)
  updateStatuses: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can update statuses");
    }

    const allRecords = await db.select().from(dbsRecords);
    const now = new Date();

    let updated = 0;

    for (const record of allRecords) {
      const expiryDate = new Date(record.expiryDate);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let newStatus: "valid" | "expiring_soon" | "expired" | "pending" = record.status;

      if (daysUntilExpiry < 0) {
        newStatus = "expired";
      } else if (daysUntilExpiry <= 60) {
        newStatus = "expiring_soon";
      } else {
        newStatus = "valid";
      }

      if (newStatus !== record.status) {
        await db
          .update(dbsRecords)
          .set({ status: newStatus })
          .where(eq(dbsRecords.id, record.id));
        updated++;
      }
    }

    return { success: true, updated };
  }),

  // Send DBS expiry reminders
  sendExpiryReminders: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can send expiry reminders");
    }

    // Get records expiring in 60, 30, or 7 days
    const now = new Date();
    const reminderDays = [60, 30, 7];
    let sentCount = 0;

    for (const days of reminderDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      const records = await db
        .select({
          id: dbsRecords.id,
          userId: dbsRecords.userId,
          userName: users.name,
          userEmail: users.email,
          certificateNumber: dbsRecords.certificateNumber,
          expiryDate: dbsRecords.expiryDate,
        })
        .from(dbsRecords)
        .leftJoin(users, eq(dbsRecords.userId, users.id))
        .where(eq(dbsRecords.expiryDate, new Date(targetDateStr)));

      for (const record of records) {
        if (!record.userEmail || !record.userName) continue;

        const emailContent = generateDbsReminderEmail({
          recipientName: record.userName,
          daysUntilExpiry: days,
          expiryDate: typeof record.expiryDate === 'string' ? record.expiryDate : record.expiryDate.toISOString(),
          certificateNumber: record.certificateNumber,
        });

        // Send to team member
        await sendEmail({
          to: record.userEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        // Also send to admin (you would get admin emails from users table)
        // For now, just log that reminder was sent
        console.log(`DBS reminder sent to ${record.userEmail} (${days} days)`);
        sentCount++;
      }
    }

    return { success: true, sent: sentCount };
  }),
});
