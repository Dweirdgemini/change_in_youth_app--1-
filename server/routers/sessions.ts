import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sessions, sessionFacilitators, projects } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const sessionsRouter = router({
  // Get sessions for a specific date
  getSessionsByDate: protectedProcedure
    .input(
      z.object({
        date: z.string(), // ISO date string
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const dateObj = new Date(input.date);
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

      const daySessions = await db
        .select({
          session: sessions,
          project: projects,
        })
        .from(sessions)
        .leftJoin(projects, eq(sessions.projectId, projects.id))
        .where(
          and(
            gte(sessions.startTime, startOfDay),
            lte(sessions.startTime, endOfDay)
          )
        );

      return daySessions.map((s) => ({
        id: s.session.id,
        title: s.session.title,
        venue: s.session.venue,
        startTime: s.session.startTime,
        endTime: s.session.endTime,
        status: s.session.status,
        projectName: s.project?.name || "Unknown Project",
      }));
    }),

  // Create session request
  createSessionRequest: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        venue: z.string(),
        date: z.string(), // ISO date string
        startTime: z.string(), // HH:MM format
        endTime: z.string(), // HH:MM format
        paymentPerFacilitator: z.string().optional(),
        enableVideoCall: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Parse date and times
      const dateObj = new Date(input.date);
      const [startHour, startMin] = input.startTime.split(':').map(Number);
      const [endHour, endMin] = input.endTime.split(':').map(Number);
      
      const startDateTime = new Date(dateObj);
      startDateTime.setHours(startHour, startMin, 0, 0);
      
      const endDateTime = new Date(dateObj);
      endDateTime.setHours(endHour, endMin, 0, 0);

      // Create session with pending approval status
      const [result] = await db.insert(sessions).values({
        organizationId: 1,
        projectId: input.projectId,
        title: input.title,
        description: input.description || '',
        venue: input.venue,
        startTime: startDateTime,
        endTime: endDateTime,
        paymentPerFacilitator: input.paymentPerFacilitator || '0',
        isVirtualMeeting: input.enableVideoCall || false,
        status: 'scheduled',
        approvalStatus: 'pending',
        requestedBy: ctx.user.id,
      }).$returningId();

      return { success: true, id: result.id };
    }),

  // Get pending session requests
  getPendingRequests: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admins can view pending requests
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can view session requests");
      }

      const pendingRequests = await db
        .select({
          session: sessions,
          project: projects,
        })
        .from(sessions)
        .leftJoin(projects, eq(sessions.projectId, projects.id))
        .where(eq(sessions.approvalStatus, 'pending'));

      // Get user names for requestedBy
      const { users } = await import('../../drizzle/schema');
      const requestsWithUsers = await Promise.all(
        pendingRequests.map(async (req) => {
          let requestedByName = 'Unknown User';
          if (req.session.requestedBy) {
            const userResult = await db
              .select({ name: users.name })
              .from(users)
              .where(eq(users.id, req.session.requestedBy))
              .limit(1);
            if (userResult.length > 0) {
              requestedByName = userResult[0].name || 'Unknown User';
            }
          }

          return {
            id: req.session.id,
            title: req.session.title,
            description: req.session.description,
            venue: req.session.venue,
            startTime: req.session.startTime,
            endTime: req.session.endTime,
            paymentPerFacilitator: req.session.paymentPerFacilitator,
            projectName: req.project?.name || 'Unknown Project',
            requestedByName,
            createdAt: req.session.createdAt,
          };
        })
      );

      return requestsWithUsers;
    }),

  // Approve session request
  approveSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admins can approve sessions
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can approve sessions");
      }

      await db
        .update(sessions)
        .set({
          approvalStatus: 'approved',
          reviewedBy: ctx.user.id,
        })
        .where(eq(sessions.id, input.sessionId));

      return { success: true };
    }),

  // Reject session request
  rejectSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admins can reject sessions
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can reject sessions");
      }

      await db
        .update(sessions)
        .set({
          approvalStatus: 'rejected',
          reviewedBy: ctx.user.id,
        })
        .where(eq(sessions.id, input.sessionId));

      return { success: true };
    }),

  // Get user's own session requests
  getMyRequests: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const myRequests = await db
        .select({
          session: sessions,
          project: projects,
        })
        .from(sessions)
        .leftJoin(projects, eq(sessions.projectId, sessions.id))
        .where(eq(sessions.requestedBy, ctx.user.id));

      return myRequests.map((req) => ({
        id: req.session.id,
        title: req.session.title,
        venue: req.session.venue,
        startTime: req.session.startTime,
        endTime: req.session.endTime,
        status: req.session.status,
        approvalStatus: req.session.approvalStatus,
        projectName: req.project?.name || "Unknown Project",
        createdAt: req.session.createdAt,
      }));
    }),

  // Cancel/delete session request (only if pending)
  cancelRequest: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the session
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session) {
        throw new Error("Session not found");
      }

      // Only the creator can cancel their own request
      if (session.requestedBy !== ctx.user.id) {
        throw new Error("You can only cancel your own session requests");
      }

      // Only pending requests can be canceled
      if (session.approvalStatus !== "pending") {
        throw new Error("Only pending requests can be canceled");
      }

      // Delete the session
      await db.delete(sessions).where(eq(sessions.id, input.sessionId));

      return { success: true };
    }),

  // Assign facilitator to session
  assignFacilitator: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admins can assign facilitators
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can assign facilitators");
      }

      // Check if facilitator is already assigned
      const existing = await db
        .select()
        .from(sessionFacilitators)
        .where(
          and(
            eq(sessionFacilitators.sessionId, input.sessionId),
            eq(sessionFacilitators.userId, input.userId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Team member is already assigned to this session");
      }

      // Assign facilitator
      await db.insert(sessionFacilitators).values({
        sessionId: input.sessionId,
        userId: input.userId,
      });

      return { success: true };
    }),
});
