import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { videoCallAttendance, sessions, users } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const videoCallsRouter = router({
  // Start a video call session
  startCall: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user is assigned to this session
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session[0]) {
        throw new Error("Session not found");
      }

      // Record attendance start
      const [attendance] = await db.insert(videoCallAttendance).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        joinedAt: new Date(),
      });

      return {
        attendanceId: attendance.insertId,
        joinedAt: new Date(),
      };
    }),

  // End video call and calculate duration
  endCall: protectedProcedure
    .input(
      z.object({
        attendanceId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const leftAt = new Date();

      // Get attendance record
      const [attendanceRecord] = await db
        .select()
        .from(videoCallAttendance)
        .where(
          and(
            eq(videoCallAttendance.id, input.attendanceId),
            eq(videoCallAttendance.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!attendanceRecord) {
        throw new Error("Attendance record not found");
      }

      // Calculate duration in minutes
      const joinedAt = new Date(attendanceRecord.joinedAt);
      const durationMs = leftAt.getTime() - joinedAt.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));

      // Update attendance record
      await db
        .update(videoCallAttendance)
        .set({
          leftAt,
          durationMinutes,
        })
        .where(eq(videoCallAttendance.id, input.attendanceId));

      return {
        durationMinutes,
        leftAt,
      };
    }),

  // Get attendance for a session
  getSessionAttendance: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admin/finance can view all attendance
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can view session attendance");
      }

      const attendance = await db
        .select({
          id: videoCallAttendance.id,
          userId: videoCallAttendance.userId,
          userName: users.name,
          joinedAt: videoCallAttendance.joinedAt,
          leftAt: videoCallAttendance.leftAt,
          durationMinutes: videoCallAttendance.durationMinutes,
          calculatedPayment: videoCallAttendance.calculatedPayment,
        })
        .from(videoCallAttendance)
        .leftJoin(users, eq(videoCallAttendance.userId, users.id))
        .where(eq(videoCallAttendance.sessionId, input.sessionId))
        .orderBy(desc(videoCallAttendance.joinedAt));

      return attendance;
    }),

  // Calculate payment for attendance
  calculatePayment: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        userId: z.number(),
        hourlyRate: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admin/finance can calculate payments
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can calculate payments");
      }

      // Get attendance records for this user and session
      const attendanceRecords = await db
        .select()
        .from(videoCallAttendance)
        .where(
          and(
            eq(videoCallAttendance.sessionId, input.sessionId),
            eq(videoCallAttendance.userId, input.userId)
          )
        );

      if (attendanceRecords.length === 0) {
        throw new Error("No attendance records found");
      }

      // Calculate total duration
      const totalMinutes = attendanceRecords.reduce(
        (sum, record) => sum + (record.durationMinutes || 0),
        0
      );

      // Calculate payment based on hourly rate
      const totalHours = totalMinutes / 60;
      const payment = totalHours * input.hourlyRate;

      // Update attendance records with calculated payment
      for (const record of attendanceRecords) {
        const recordHours = (record.durationMinutes || 0) / 60;
        const recordPayment = recordHours * input.hourlyRate;

        await db
          .update(videoCallAttendance)
          .set({
            calculatedPayment: recordPayment.toFixed(2),
          })
          .where(eq(videoCallAttendance.id, record.id));
      }

      return {
        totalMinutes,
        totalHours: parseFloat(totalHours.toFixed(2)),
        payment: parseFloat(payment.toFixed(2)),
      };
    }),

  // Get my attendance history
  getMyAttendance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const attendance = await db
      .select({
        id: videoCallAttendance.id,
        sessionId: videoCallAttendance.sessionId,
        sessionTitle: sessions.title,
        joinedAt: videoCallAttendance.joinedAt,
        leftAt: videoCallAttendance.leftAt,
        durationMinutes: videoCallAttendance.durationMinutes,
        calculatedPayment: videoCallAttendance.calculatedPayment,
      })
      .from(videoCallAttendance)
      .leftJoin(sessions, eq(videoCallAttendance.sessionId, sessions.id))
      .where(eq(videoCallAttendance.userId, ctx.user.id))
      .orderBy(desc(videoCallAttendance.joinedAt))
      .limit(50);

    return attendance;
  }),

  // Check if currently in a call
  getCurrentCall: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Find any attendance record without a leftAt time
    const [currentCall] = await db
      .select({
        attendanceId: videoCallAttendance.id,
        sessionId: videoCallAttendance.sessionId,
        sessionTitle: sessions.title,
        joinedAt: videoCallAttendance.joinedAt,
      })
      .from(videoCallAttendance)
      .leftJoin(sessions, eq(videoCallAttendance.sessionId, sessions.id))
      .where(
        and(
          eq(videoCallAttendance.userId, ctx.user.id),
          eq(videoCallAttendance.leftAt, null as any)
        )
      )
      .limit(1);

    return currentCall || null;
  }),
});
