import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { meetingRequests, meetingRequestParticipants, users, sessions } from "../../drizzle/schema";
import { eq, and, desc, or, inArray } from "drizzle-orm";
import { sendEmail } from "../_core/email";

export const meetingRequestsRouter = router({
  // Create a meeting request
  createMeetingRequest: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      requestedDate: z.date(),
      durationMinutes: z.number(),
      participantIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('[createMeetingRequest] Starting mutation');
      console.log('[createMeetingRequest] Input:', JSON.stringify({ ...input, requestedDate: input.requestedDate?.toISOString() }, null, 2));
      console.log('[createMeetingRequest] User:', ctx.user.id, ctx.user.email);
      
      const db = await getDb();
      console.log('[createMeetingRequest] Database connection obtained');
      
      console.log('[createMeetingRequest] Inserting meeting request...');
      const result = await db.insert(meetingRequests).values({
        requestedBy: ctx.user.id,
        title: input.title,
        description: input.description,
        requestedDate: input.requestedDate,
        durationMinutes: input.durationMinutes,
        status: "pending",
      });
      
      console.log('[createMeetingRequest] Insert result:', result);
      // Drizzle returns array for some operations, single result for others
      const insertId = Array.isArray(result) ? (result[0] as any)?.insertId : (result as any).insertId;
      console.log('[createMeetingRequest] insertId type:', typeof insertId, 'value:', insertId);
      const requestId = Number(insertId);
      console.log('[createMeetingRequest] requestId after Number():', requestId);
      
      // Add participants
      const participantValues = input.participantIds.map(userId => ({
        meetingRequestId: requestId,
        userId,
      }));
      
      console.log('[createMeetingRequest] Inserting participants:', JSON.stringify(participantValues, null, 2));
      
      try {
        // Insert participants one at a time to avoid MySQL "default" syntax issues
        for (const participant of participantValues) {
          await db.insert(meetingRequestParticipants).values(participant);
        }
        console.log('[createMeetingRequest] Participants inserted successfully');
      } catch (error) {
        console.error('[createMeetingRequest] Failed to insert participants:', error);
        throw error;
      }
      
      // Send email notifications to participants and admins
      const participants = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(inArray(users.id, input.participantIds));
      
      const requester = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      
      const requesterName = requester[0]?.name || "A team member";
      const dateStr = input.requestedDate.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Email to participants
      for (const participant of participants) {
        if (participant.email) {
          await sendEmail({
            to: participant.email,
            subject: `Meeting Request: ${input.title}`,
            html: `
              <h2>New Meeting Request</h2>
              <p>Hi ${participant.name},</p>
              <p>${requesterName} has requested a meeting with you.</p>
              <h3>Meeting Details:</h3>
              <ul>
                <li><strong>Title:</strong> ${input.title}</li>
                <li><strong>Date:</strong> ${dateStr}</li>
                <li><strong>Duration:</strong> ${input.durationMinutes} minutes</li>
                ${input.description ? `<li><strong>Description:</strong> ${input.description}</li>` : ''}
              </ul>
              <p>This request is pending admin approval. You'll receive another email once it's approved or rejected.</p>
              <p>Best regards,<br/>Change In Youth Team</p>
            `,
          });
        }
      }
      
      // Email to admins
      const admins = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(or(eq(users.role, "admin"), eq(users.role, "finance")));
      
      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: `New Meeting Request: ${input.title}`,
            html: `
              <h2>New Meeting Request Requires Approval</h2>
              <p>Hi ${admin.name},</p>
              <p>${requesterName} has submitted a meeting request that requires your approval.</p>
              <h3>Meeting Details:</h3>
              <ul>
                <li><strong>Title:</strong> ${input.title}</li>
                <li><strong>Date:</strong> ${dateStr}</li>
                <li><strong>Duration:</strong> ${input.durationMinutes} minutes</li>
                <li><strong>Participants:</strong> ${participants.map(p => p.name).join(', ')}</li>
                ${input.description ? `<li><strong>Description:</strong> ${input.description}</li>` : ''}
              </ul>
              <p>Please log in to the app to approve or reject this request.</p>
              <p>Best regards,<br/>Change In Youth Team</p>
            `,
          });
        }
      }
      
      return { requestId };
    }),

  // Get my meeting requests (created by me)
  getMyRequests: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      
      const requests = await db
        .select({
          id: meetingRequests.id,
          title: meetingRequests.title,
          description: meetingRequests.description,
          requestedDate: meetingRequests.requestedDate,
          durationMinutes: meetingRequests.durationMinutes,
          status: meetingRequests.status,
          createdAt: meetingRequests.createdAt,
          reviewedBy: meetingRequests.reviewedBy,
          reviewedAt: meetingRequests.reviewedAt,
          adminNotes: meetingRequests.adminNotes,
          sessionId: meetingRequests.sessionId,
        })
        .from(meetingRequests)
        .where(eq(meetingRequests.requestedBy, ctx.user.id))
        .orderBy(desc(meetingRequests.createdAt));
      
      return requests;
    }),

  // Get requests involving me (as participant)
  getRequestsInvolvingMe: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      
      // Get request IDs where I'm a participant
      const myParticipations = await db
        .select({ requestId: meetingRequestParticipants.meetingRequestId })
        .from(meetingRequestParticipants)
        .where(eq(meetingRequestParticipants.userId, ctx.user.id));
      
      if (myParticipations.length === 0) {
        return [];
      }
      
      const requestIds = myParticipations.map(p => p.requestId);
      
      const requests = await db
        .select({
          id: meetingRequests.id,
          title: meetingRequests.title,
          description: meetingRequests.description,
          requestedDate: meetingRequests.requestedDate,
          durationMinutes: meetingRequests.durationMinutes,
          status: meetingRequests.status,
          createdAt: meetingRequests.createdAt,
          requestedByName: users.name,
        })
        .from(meetingRequests)
        .innerJoin(users, eq(users.id, meetingRequests.requestedBy))
        .where(inArray(meetingRequests.id, requestIds))
        .orderBy(desc(meetingRequests.createdAt));
      
      return requests;
    }),

  // Get pending requests (admin only)
  getPendingRequests: adminProcedure
    .query(async () => {
      const db = await getDb();
      
      const requests = await db
        .select({
          id: meetingRequests.id,
          title: meetingRequests.title,
          description: meetingRequests.description,
          requestedDate: meetingRequests.requestedDate,
          durationMinutes: meetingRequests.durationMinutes,
          status: meetingRequests.status,
          createdAt: meetingRequests.createdAt,
          requestedByName: users.name,
          requestedById: meetingRequests.requestedBy,
        })
        .from(meetingRequests)
        .innerJoin(users, eq(users.id, meetingRequests.requestedBy))
        .where(eq(meetingRequests.status, "pending"))
        .orderBy(meetingRequests.requestedDate);
      
      // Get participants for each request
      const requestsWithParticipants = await Promise.all(
        requests.map(async (request) => {
          const participants = await db
            .select({
              userId: meetingRequestParticipants.userId,
              userName: users.name,
            })
            .from(meetingRequestParticipants)
            .innerJoin(users, eq(users.id, meetingRequestParticipants.userId))
            .where(eq(meetingRequestParticipants.meetingRequestId, request.id));
          
          return {
            ...request,
            participants,
          };
        })
      );
      
      return requestsWithParticipants;
    }),

  // Approve a meeting request (admin only)
  approveMeetingRequest: adminProcedure
    .input(z.object({
      requestId: z.number(),
      projectId: z.number(),
      sessionTypeId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Get the request details
      const [request] = await db
        .select()
        .from(meetingRequests)
        .where(eq(meetingRequests.id, input.requestId))
        .limit(1);
      
      if (!request) {
        throw new Error("Request not found");
      }
      
      // Create a session for this meeting
      const sessionResult = await db.insert(sessions).values({
        projectId: input.projectId,
        title: request.title,
        description: request.description,
        venue: "Virtual Meeting",
        startTime: request.requestedDate,
        endTime: new Date(request.requestedDate.getTime() + request.durationMinutes * 60000),
        isVirtualMeeting: true,
        status: "scheduled",
        approvalStatus: "approved",
        requestedBy: request.requestedBy,
        createdAt: new Date(),
      });
      
      const sessionId = Number((sessionResult as any).insertId);
      
      // Update the request status
      await db
        .update(meetingRequests)
        .set({
          status: "approved",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          sessionId: sessionId,
        })
        .where(eq(meetingRequests.id, input.requestId));
      
      return { sessionId };
    }),

  // Reject a meeting request (admin only)
  rejectMeetingRequest: adminProcedure
    .input(z.object({
      requestId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      await db
        .update(meetingRequests)
        .set({
          status: "rejected",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          adminNotes: input.reason,
        })
        .where(eq(meetingRequests.id, input.requestId));
      
      return { success: true };
    }),

  // Get request details
  getRequestDetails: protectedProcedure
    .input(z.object({
      requestId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      
      const [request] = await db
        .select({
          id: meetingRequests.id,
          title: meetingRequests.title,
          description: meetingRequests.description,
          requestedDate: meetingRequests.requestedDate,
          durationMinutes: meetingRequests.durationMinutes,
          status: meetingRequests.status,
          createdAt: meetingRequests.createdAt,
          requestedBy: meetingRequests.requestedBy,
          requestedByName: users.name,
          reviewedBy: meetingRequests.reviewedBy,
          reviewedAt: meetingRequests.reviewedAt,
          adminNotes: meetingRequests.adminNotes,
          sessionId: meetingRequests.sessionId,
        })
        .from(meetingRequests)
        .innerJoin(users, eq(users.id, meetingRequests.requestedBy))
        .where(eq(meetingRequests.id, input.requestId))
        .limit(1);
      
      if (!request) {
        throw new Error("Request not found");
      }
      
      // Check authorization
      const isRequestor = request.requestedBy === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      
      // Get participants
      const participants = await db
        .select({
          userId: meetingRequestParticipants.userId,
          name: users.name,
          email: users.email,
        })
        .from(meetingRequestParticipants)
        .innerJoin(users, eq(users.id, meetingRequestParticipants.userId))
        .where(eq(meetingRequestParticipants.meetingRequestId, input.requestId));
      
      const isParticipant = participants.some(p => p.userId === ctx.user.id);
      
      if (!isRequestor && !isAdmin && !isParticipant) {
        throw new Error("Not authorized to view this request");
      }
      
      return {
        ...request,
        participants,
      };
    }),
});
