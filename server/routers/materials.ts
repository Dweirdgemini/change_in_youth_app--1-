import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { documents, projects, sessions, sessionFacilitators, invoices, expectedPayments, trainingModules } from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

export const materialsRouter = router({
  // Get project materials for a facilitator
  getProjectMaterials: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get project details
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (!project[0]) {
        throw new Error("Project not found");
      }

      // Get project documents (register templates, evaluation forms, etc.)
      const projectDocs = await db
        .select()
        .from(documents)
        .where(eq(documents.projectId, input.projectId));

      // Get sessions for this project where user is a facilitator
      const userSessions = await db
        .select({
          session: sessions,
        })
        .from(sessionFacilitators)
        .innerJoin(sessions, eq(sessions.id, sessionFacilitators.sessionId))
        .where(
          and(
            eq(sessionFacilitators.userId, ctx.user.id),
            eq(sessions.projectId, input.projectId)
          )
        );

      return {
        project: project[0],
        documents: projectDocs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          type: doc.type,
          fileUrl: doc.fileUrl,
          createdAt: doc.createdAt,
        })),
        sessions: userSessions.map((s) => ({
          id: s.session.id,
          title: s.session.title,
          venue: s.session.venue,
          startTime: s.session.startTime,
          endTime: s.session.endTime,
          sessionNumber: s.session.sessionNumber,
          totalSessions: s.session.totalSessions,
        })),
      };
    }),

  // Get session-specific materials (booking info, register, etc.)
  getSessionMaterials: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user is assigned to this session
      const facilitatorAssignment = await db
        .select()
        .from(sessionFacilitators)
        .where(
          and(
            eq(sessionFacilitators.sessionId, input.sessionId),
            eq(sessionFacilitators.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!facilitatorAssignment[0]) {
        throw new Error("You are not assigned to this session");
      }

      // Get session details
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session[0]) {
        throw new Error("Session not found");
      }

      // Get session documents
      const sessionDocs = await db
        .select()
        .from(documents)
        .where(eq(documents.sessionId, input.sessionId));

      // Get project documents
      const projectDocs = await db
        .select()
        .from(documents)
        .where(eq(documents.projectId, session[0].projectId));

      // Get invoice information for this session
      // Note: With new invoice system, invoices are project-based with line items
      // This is a simplified check for backward compatibility
      const sessionInvoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, ctx.user.id))
        .limit(1);

      // Get expected payment for this session
      const expectedPayment = await db
        .select()
        .from(expectedPayments)
        .where(
          and(
            eq(expectedPayments.sessionId, input.sessionId),
            eq(expectedPayments.userId, ctx.user.id)
          )
        )
        .limit(1);

      return {
        session: {
          id: session[0].id,
          title: session[0].title,
          description: session[0].description,
          venue: session[0].venue,
          startTime: session[0].startTime,
          endTime: session[0].endTime,
          paymentPerFacilitator: session[0].paymentPerFacilitator,
          sessionNumber: session[0].sessionNumber,
          totalSessions: session[0].totalSessions,
        },
        facilitatorStatus: {
          clockedIn: !!facilitatorAssignment[0].clockInTime,
          registerCompleted: facilitatorAssignment[0].registerCompleted,
          evaluationsCompleted: facilitatorAssignment[0].evaluationsCompleted,
          arrivedOnTime: facilitatorAssignment[0].arrivedOnTime,
          paymentEligible: facilitatorAssignment[0].paymentEligible,
        },
        documents: {
          sessionDocs: sessionDocs.map((doc) => ({
            id: doc.id,
            title: doc.title,
            type: doc.type,
            fileUrl: doc.fileUrl,
          })),
          projectDocs: projectDocs.map((doc) => ({
            id: doc.id,
            title: doc.title,
            type: doc.type,
            fileUrl: doc.fileUrl,
          })),
        },
        invoiceInfo: {
          submitted: !!sessionInvoice[0],
          status: sessionInvoice[0]?.status,
          amount: sessionInvoice[0]?.totalAmount,
          submittedAt: sessionInvoice[0]?.submittedAt,
          expectedAmount: expectedPayment[0]?.amount || session[0].paymentPerFacilitator,
          deadline: expectedPayment[0]?.dueDate,
        },
      };
    }),

  // Upload photo register
  uploadPhotoRegister: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        photoUrl: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user is assigned to this session
      const facilitatorAssignment = await db
        .select()
        .from(sessionFacilitators)
        .where(
          and(
            eq(sessionFacilitators.sessionId, input.sessionId),
            eq(sessionFacilitators.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!facilitatorAssignment[0]) {
        throw new Error("You are not assigned to this session");
      }

      // Create document for photo register
      await db.insert(documents).values({
        sessionId: input.sessionId,
        title: `Register Photo - Session ${input.sessionId}`,
        description: input.notes || "Participant register photo",
        type: "register",
        fileUrl: input.photoUrl,
        uploadedBy: ctx.user.id,
      });

      // Mark register as completed
      await db
        .update(sessionFacilitators)
        .set({
          registerCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(sessionFacilitators.id, facilitatorAssignment[0].id));

      // Check if payment eligible (all requirements met)
      const updated = await db
        .select()
        .from(sessionFacilitators)
        .where(eq(sessionFacilitators.id, facilitatorAssignment[0].id))
        .limit(1);

      const eligible =
        updated[0].registerCompleted &&
        updated[0].evaluationsCompleted &&
        updated[0].arrivedOnTime;

      if (eligible) {
        await db
          .update(sessionFacilitators)
          .set({
            paymentEligible: true,
            updatedAt: new Date(),
          })
          .where(eq(sessionFacilitators.id, facilitatorAssignment[0].id));
      }

      return {
        success: true,
        paymentEligible: eligible,
      };
    }),

  // Mark evaluation as completed
  markEvaluationCompleted: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const facilitatorAssignment = await db
        .select()
        .from(sessionFacilitators)
        .where(
          and(
            eq(sessionFacilitators.sessionId, input.sessionId),
            eq(sessionFacilitators.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!facilitatorAssignment[0]) {
        throw new Error("You are not assigned to this session");
      }

      await db
        .update(sessionFacilitators)
        .set({
          evaluationsCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(sessionFacilitators.id, facilitatorAssignment[0].id));

      // Check if payment eligible
      const updated = await db
        .select()
        .from(sessionFacilitators)
        .where(eq(sessionFacilitators.id, facilitatorAssignment[0].id))
        .limit(1);

      const eligible =
        updated[0].registerCompleted &&
        updated[0].evaluationsCompleted &&
        updated[0].arrivedOnTime;

      if (eligible) {
        await db
          .update(sessionFacilitators)
          .set({
            paymentEligible: true,
            updatedAt: new Date(),
          })
          .where(eq(sessionFacilitators.id, facilitatorAssignment[0].id));
      }

      return {
        success: true,
        paymentEligible: eligible,
      };
    }),

  // Get invoice instructions
  getInvoiceInstructions: protectedProcedure.query(async () => {
    return {
      instructions: `
**How to Invoice for Your Session**

1. **Ensure Eligibility**: Complete all requirements:
   - Clock in at the venue on time
   - Complete the participant register
   - Complete evaluation forms with students

2. **Prepare Your Invoice**:
   - Include your name and contact details
   - Reference the project name and session number
   - State the agreed amount (shown in session details)
   - Include the session date

3. **Submit Through App**:
   - Go to Finance tab
   - Click "Submit Invoice"
   - Upload your invoice document
   - Select the correct project and session

4. **Deadline**: Submit within 2 weeks of session completion

5. **Payment**: Once approved by finance, payment will be processed within 5-7 business days

**Need Help?** Contact finance@changeinyouth.org
      `,
      templateUrl: "/templates/invoice-template.pdf", // This would be a real URL in production
    };
  }),

  // List all training modules
  listTrainingModules: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const modules = await db
      .select()
      .from(trainingModules)
      .orderBy(trainingModules.createdAt);

    return modules;
  }),

  // Create training module (admin only)
  createTrainingModule: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        content: z.string().optional(),
        category: z.string().default("general"),
        duration: z.number().default(30),
        isRequired: z.boolean().default(false),
        fileUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user is admin
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new Error("Only admins can create training modules");
      }

      const result = await db.insert(trainingModules).values({
        title: input.title,
        description: input.description,
        content: input.content,
        category: input.category,
        duration: input.duration,
        isRequired: input.isRequired,
        fileUrl: input.fileUrl,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        moduleId: result[0].insertId,
      };
    }),
});
