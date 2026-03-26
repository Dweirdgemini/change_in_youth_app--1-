import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sessions, sessionFacilitators, projects, users } from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql, or, inArray } from "drizzle-orm";

export const schedulingRouter = router({
  // Get all sessions with filters
  getSessions: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        facilitatorId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(sessions);
      
      const conditions = [];
      if (input.projectId) conditions.push(eq(sessions.projectId, input.projectId));
      if (input.startDate) conditions.push(gte(sessions.startTime, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(sessions.endTime, new Date(input.endDate)));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      let results = await query.orderBy(desc(sessions.startTime));

      // Filter by facilitator if specified
      if (input.facilitatorId) {
        const facilitatorSessions = await db
          .select({ sessionId: sessionFacilitators.sessionId })
          .from(sessionFacilitators)
          .where(eq(sessionFacilitators.userId, input.facilitatorId));
        
        const sessionIds = facilitatorSessions.map((s) => s.sessionId);
        results = results.filter((s) => sessionIds.includes(s.id));
      }

      // Add facilitators to each session
      const sessionIds = results.map(s => s.id).filter(Boolean) as number[];
      
      const facilitatorRows = sessionIds.length
        ? await db
            .select({
              sessionId: sessionFacilitators.sessionId,
              id: users.id,
              name: users.name,
              email: users.email,
            })
            .from(sessionFacilitators)
            .innerJoin(users, eq(sessionFacilitators.userId, users.id))
            .where(inArray(sessionFacilitators.sessionId, sessionIds))
        : [];

      const facilitatorsBySession = new Map<number, Array<{id:number;name:string;email:string}>>();
      for (const row of facilitatorRows) {
        const arr = facilitatorsBySession.get(row.sessionId) ?? [];
        arr.push({ 
          id: row.id, 
          name: row.name || "Unknown", 
          email: row.email || "" 
        });
        facilitatorsBySession.set(row.sessionId, arr);
      }

      // Add facilitators and acceptanceStatus to results
      return results.map(s => ({
        ...s,
        facilitators: facilitatorsBySession.get(s.id!) ?? [],
        approvalStatus: "pending" as const, // Default status, can be customized per user
      }));
    }),

  // Create a new session with facilitators
  createSession: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        facilitatorIds: z.array(z.number()),
        title: z.string(),
        description: z.string().optional(),
        venue: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        sessionNumber: z.number().optional(),
        totalSessions: z.number().optional(),
        paymentPerFacilitator: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can create sessions");
      }

      // Check for scheduling conflicts for all facilitators
      for (const facilitatorId of input.facilitatorIds) {
        const facilitatorSessionIds = await db
          .select({ sessionId: sessionFacilitators.sessionId })
          .from(sessionFacilitators)
          .where(eq(sessionFacilitators.userId, facilitatorId));

        if (facilitatorSessionIds.length > 0) {
          const conflicts = await db
            .select()
            .from(sessions)
            .where(
              and(
                inArray(sessions.id, facilitatorSessionIds.map((s) => s.sessionId)),
                or(
                  and(
                    gte(sessions.startTime, new Date(input.startTime)),
                    lte(sessions.startTime, new Date(input.endTime))
                  ),
                  and(
                    gte(sessions.endTime, new Date(input.startTime)),
                    lte(sessions.endTime, new Date(input.endTime))
                  )
                )
              )
            );

          if (conflicts.length > 0) {
            throw new Error(`Facilitator ${facilitatorId} has a scheduling conflict`);
          }
        }
      }

      // Create session
      const result = await db.insert(sessions).values({
        projectId: input.projectId,
        title: input.title,
        description: input.description || null,
        venue: input.venue,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        sessionNumber: input.sessionNumber || null,
        totalSessions: input.totalSessions || null,
        paymentPerFacilitator: input.paymentPerFacilitator?.toString() || null,
        status: "scheduled",
      });

      const sessionId = Number(result[0].insertId);

      // Assign facilitators
      for (const facilitatorId of input.facilitatorIds) {
        await db.insert(sessionFacilitators).values({
          sessionId,
          userId: facilitatorId,
        });
      }

      return { success: true, sessionId };
    }),

  // Clock in to a session (geolocation-based)
  clockIn: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get session details
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session[0]) throw new Error("Session not found");

      // Check if user is assigned to this session
      const assignment = await db
        .select()
        .from(sessionFacilitators)
        .where(
          and(
            eq(sessionFacilitators.sessionId, input.sessionId),
            eq(sessionFacilitators.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!assignment[0] && ctx.user.role !== "admin") {
        throw new Error("You are not assigned to this session");
      }

      // Check if already clocked in
      if (assignment[0]?.clockInTime) {
        throw new Error("Already clocked in to this session");
      }

      // Calculate if arrived on time (within 15 minutes of start time)
      const startTime = new Date(session[0].startTime);
      const clockInTime = new Date();
      const timeDiff = (clockInTime.getTime() - startTime.getTime()) / 1000 / 60; // minutes
      const arrivedOnTime = timeDiff <= 15;

      // Record clock-in
      await db
        .update(sessionFacilitators)
        .set({
          clockInTime: new Date(),
          clockInLatitude: input.latitude.toString(),
          clockInLongitude: input.longitude.toString(),
          arrivedOnTime,
        })
        .where(eq(sessionFacilitators.id, assignment[0].id));

      // Update session status if first facilitator to clock in
      if (session[0].status === "scheduled") {
        await db
          .update(sessions)
          .set({ status: "in_progress" })
          .where(eq(sessions.id, input.sessionId));
      }

      return { success: true, arrivedOnTime };
    }),

  // Mark register as completed
  markRegisterCompleted: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const assignment = await db
        .select()
        .from(sessionFacilitators)
        .where(
          and(
            eq(sessionFacilitators.sessionId, input.sessionId),
            eq(sessionFacilitators.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!assignment[0]) throw new Error("Not assigned to this session");

      await db
        .update(sessionFacilitators)
        .set({ registerCompleted: true })
        .where(eq(sessionFacilitators.id, assignment[0].id));

      await checkPaymentEligibility(db, assignment[0].id);

      return { success: true };
    }),

  // Mark evaluations as completed
  markEvaluationsCompleted: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const assignment = await db
        .select()
        .from(sessionFacilitators)
        .where(
          and(
            eq(sessionFacilitators.sessionId, input.sessionId),
            eq(sessionFacilitators.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!assignment[0]) throw new Error("Not assigned to this session");

      await db
        .update(sessionFacilitators)
        .set({ evaluationsCompleted: true })
        .where(eq(sessionFacilitators.id, assignment[0].id));

      await checkPaymentEligibility(db, assignment[0].id);

      return { success: true };
    }),

  // Get session facilitators with their completion status
  getSessionFacilitators: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const facilitators = await db
        .select()
        .from(sessionFacilitators)
        .where(eq(sessionFacilitators.sessionId, input.sessionId));

      return facilitators;
    }),

  // Get my sessions
  getMySessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const myAssignments = await db
      .select({ sessionId: sessionFacilitators.sessionId })
      .from(sessionFacilitators)
      .where(eq(sessionFacilitators.userId, ctx.user.id));

    if (myAssignments.length === 0) return [];

    const sessionIds = myAssignments.map((a) => a.sessionId);
    const mySessions = await db
      .select()
      .from(sessions)
      .where(inArray(sessions.id, sessionIds))
      .orderBy(desc(sessions.startTime));

    // Add facilitators to each session
    const facilitatorRows = sessionIds.length
      ? await db
          .select({
            sessionId: sessionFacilitators.sessionId,
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(sessionFacilitators)
          .innerJoin(users, eq(sessionFacilitators.userId, users.id))
          .where(inArray(sessionFacilitators.sessionId, sessionIds))
      : [];

    const facilitatorsBySession = new Map<number, Array<{id:number;name:string;email:string}>>();
    for (const row of facilitatorRows) {
      const arr = facilitatorsBySession.get(row.sessionId) ?? [];
      arr.push({ 
          id: row.id, 
          name: row.name || "Unknown", 
          email: row.email || "" 
        });
      facilitatorsBySession.set(row.sessionId, arr);
    }

    // Add facilitators to results
    return mySessions.map(s => ({
      ...s,
      facilitators: facilitatorsBySession.get(s.id) ?? [],
    }));
  }),

  // Get facilitator availability
  getFacilitatorAvailability: protectedProcedure
    .input(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all facilitators
      const allFacilitators = await db
        .select()
        .from(users)
        .where(eq(users.role, "team_member"));

      // Get sessions in the time range
      const overlappingSessions = await db
        .select()
        .from(sessions)
        .where(
          or(
            and(
              gte(sessions.startTime, new Date(input.startTime)),
              lte(sessions.startTime, new Date(input.endTime))
            ),
            and(
              gte(sessions.endTime, new Date(input.startTime)),
              lte(sessions.endTime, new Date(input.endTime))
            )
          )
        );

      // Get facilitators assigned to those sessions
      const sessionIds = overlappingSessions.map((s) => s.id);
      let bookedFacilitatorIds: number[] = [];
      
      if (sessionIds.length > 0) {
        const assignments = await db
          .select()
          .from(sessionFacilitators)
          .where(inArray(sessionFacilitators.sessionId, sessionIds));
        
        bookedFacilitatorIds = assignments.map((a) => a.userId);
      }

      const availableFacilitators = allFacilitators.filter(
        (f) => !bookedFacilitatorIds.includes(f.id)
      );

      return {
        available: availableFacilitators,
        booked: allFacilitators.filter((f) => bookedFacilitatorIds.includes(f.id)),
      };
    }),

  // Get team pairing analytics
  getTeamPairingAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins can view analytics");
    }

    // Get all completed sessions
    const completedSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.status, "completed"));

    // Get facilitator assignments for completed sessions
    const sessionIds = completedSessions.map((s) => s.id);
    let assignments: any[] = [];
    
    if (sessionIds.length > 0) {
      assignments = await db
        .select()
        .from(sessionFacilitators)
        .where(inArray(sessionFacilitators.sessionId, sessionIds));
    }

    // Calculate pairing statistics
    const facilitatorStats: Record<number, { sessions: number; projects: Set<number>; partners: Set<number> }> = {};

    for (const assignment of assignments) {
      if (!facilitatorStats[assignment.userId]) {
        facilitatorStats[assignment.userId] = { sessions: 0, projects: new Set(), partners: new Set() };
      }
      facilitatorStats[assignment.userId].sessions++;
      
      const session = completedSessions.find((s) => s.id === assignment.sessionId);
      if (session) {
        facilitatorStats[assignment.userId].projects.add(session.projectId);
      }

      // Find partners in the same session
      const partners = assignments.filter(
        (a) => a.sessionId === assignment.sessionId && a.userId !== assignment.userId
      );
      partners.forEach((p) => facilitatorStats[assignment.userId].partners.add(p.userId));
    }

    return {
      totalSessions: completedSessions.length,
      facilitatorStats: Object.entries(facilitatorStats).map(([userId, stats]) => ({
        userId: Number(userId),
        sessionsCompleted: stats.sessions,
        projectsWorked: stats.projects.size,
        uniquePartners: stats.partners.size,
      })),
    };
  }),

  // Accept a session (facilitator confirms availability)
  acceptSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update session acceptance status
      await db
        .update(sessions)
        .set({ approvalStatus: "approved" })
        .where(eq(sessions.id, input.sessionId));

      return { success: true };
    }),

  // Reject a session with optional reason
  rejectSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get session details for notification
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      // Update session acceptance status and rejection reason
      await db
        .update(sessions)
        .set({
          approvalStatus: "rejected",
          // TODO: Add rejectionReason field to sessions schema if needed
        })
        .where(eq(sessions.id, input.sessionId));

      // Notify all admins about the rejection
      if (session[0]) {
        const admins = await db
          .select()
          .from(users)
          .where(or(eq(users.role, "admin"), eq(users.role, "finance")));

        // Create notification for each admin
        const notificationTitle = `Session Rejected: ${session[0].title}`;
        const notificationBody = `${ctx.user.name} rejected the session${input.reason ? `: ${input.reason}` : "."}`;

        // TODO: Send push notifications to admins
        // For now, we'll log it (push notifications can be added later)
        console.log(`[NOTIFICATION] ${notificationTitle} - ${notificationBody}`);
      }

      return { success: true };
    }),

  // Get all projects
  getAllProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allProjects = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.createdAt));

      return allProjects;
    }),

  // TEMP ALIAS: getAllSessions → getSessions (for backward compatibility)
  // TODO: Remove after migrating all client calls to use getSessions
  getAllSessions: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        facilitatorId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Call the canonical getSessions procedure by recreating the logic
      // This avoids the circular reference issue
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(sessions);
      
      const conditions = [];
      if (input.projectId) conditions.push(eq(sessions.projectId, input.projectId));
      if (input.startDate) conditions.push(gte(sessions.startTime, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(sessions.endTime, new Date(input.endDate)));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      let results = await query.orderBy(desc(sessions.startTime));

      // Filter by facilitator if specified
      if (input.facilitatorId) {
        const facilitatorSessions = await db
          .select({ sessionId: sessionFacilitators.sessionId })
          .from(sessionFacilitators)
          .where(eq(sessionFacilitators.userId, input.facilitatorId));
        
        const sessionIds = facilitatorSessions.map((s) => s.sessionId);
        results = results.filter((s) => sessionIds.includes(s.id));
      }

      // Add facilitators to each session
      const sessionIds = results.map(s => s.id).filter(Boolean) as number[];
      
      const facilitatorRows = sessionIds.length
        ? await db
            .select({
              sessionId: sessionFacilitators.sessionId,
              id: users.id,
              name: users.name,
              email: users.email,
            })
            .from(sessionFacilitators)
            .innerJoin(users, eq(sessionFacilitators.userId, users.id))
            .where(inArray(sessionFacilitators.sessionId, sessionIds))
        : [];

      const facilitatorsBySession = new Map<number, Array<{id:number;name:string;email:string}>>();
      for (const row of facilitatorRows) {
        const arr = facilitatorsBySession.get(row.sessionId) ?? [];
        arr.push({ 
          id: row.id, 
          name: row.name || "Unknown", 
          email: row.email || "" 
        });
        facilitatorsBySession.set(row.sessionId, arr);
      }

      // Add facilitators and acceptanceStatus to results
      return results.map(s => ({
        ...s,
        facilitators: facilitatorsBySession.get(s.id!) ?? [],
        approvalStatus: "pending" as const,
      }));
    }),
});

// Helper function to check payment eligibility
async function checkPaymentEligibility(db: any, assignmentId: number) {
  const assignment = await db
    .select()
    .from(sessionFacilitators)
    .where(eq(sessionFacilitators.id, assignmentId))
    .limit(1);

  if (!assignment[0]) return;

  const eligible =
    assignment[0].registerCompleted &&
    assignment[0].evaluationsCompleted &&
    assignment[0].arrivedOnTime;

  if (eligible && !assignment[0].paymentEligible) {
    await db
      .update(sessionFacilitators)
      .set({ paymentEligible: true })
      .where(eq(sessionFacilitators.id, assignmentId));
  }
}
