import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { surveys, surveyQuestions, surveyResponses } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const surveysRouter = router({
  // Create a survey
  createSurvey: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        projectId: z.number().optional(),
        sessionId: z.number().optional(),
        isAnonymous: z.boolean().default(false),
        questions: z.array(
          z.object({
            question: z.string(),
            type: z.enum(["text", "multiple_choice", "rating", "yes_no"]),
            options: z.array(z.string()).optional(),
            required: z.boolean().default(false),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admins and facilitators can create surveys
      if (ctx.user.role !== "admin" && ctx.user.role !== "team_member") {
        throw new Error("Only admins and facilitators can create surveys");
      }

      // Create survey
      const surveyResult = await db.insert(surveys).values({
        title: input.title,
        description: input.description || null,
        projectId: input.projectId || null,
        sessionId: input.sessionId || null,
        createdBy: ctx.user.id,
        isAnonymous: input.isAnonymous,
        status: "draft",
      });

      const surveyId = Number(surveyResult[0].insertId);

      // Create questions
      for (let i = 0; i < input.questions.length; i++) {
        const q = input.questions[i];
        await db.insert(surveyQuestions).values({
          surveyId,
          question: q.question,
          type: q.type,
          options: q.options ? JSON.stringify(q.options) : null,
          required: q.required,
          orderIndex: i,
        });
      }

      return { success: true, surveyId };
    }),

  // Get all surveys
  getSurveys: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        sessionId: z.number().optional(),
        status: z.enum(["draft", "active", "closed"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(surveys);

      const conditions = [];
      if (input.projectId) conditions.push(eq(surveys.projectId, input.projectId));
      if (input.sessionId) conditions.push(eq(surveys.sessionId, input.sessionId));
      if (input.status) conditions.push(eq(surveys.status, input.status));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query.orderBy(desc(surveys.createdAt));
      return results;
    }),

  // Get survey details with questions
  getSurvey: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const survey = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, input.surveyId))
        .limit(1);

      if (!survey[0]) throw new Error("Survey not found");

      const questions = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.surveyId, input.surveyId))
        .orderBy(surveyQuestions.orderIndex);

      // Parse options JSON
      const questionsWithOptions = questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
      }));

      return {
        ...survey[0],
        questions: questionsWithOptions,
      };
    }),

  // Publish survey
  publishSurvey: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const survey = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, input.surveyId))
        .limit(1);

      if (!survey[0]) throw new Error("Survey not found");

      if (survey[0].createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("You don't have permission to publish this survey");
      }

      await db
        .update(surveys)
        .set({ status: "active" })
        .where(eq(surveys.id, input.surveyId));

      return { success: true };
    }),

  // Submit survey response
  submitResponse: protectedProcedure
    .input(
      z.object({
        surveyId: z.number(),
        responses: z.array(
          z.object({
            questionId: z.number(),
            answer: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const survey = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, input.surveyId))
        .limit(1);

      if (!survey[0]) throw new Error("Survey not found");

      if (survey[0].status !== "active") {
        throw new Error("Survey is not active");
      }

      // Check if user already responded (unless anonymous)
      if (!survey[0].isAnonymous) {
        const existingResponse = await db
          .select()
          .from(surveyResponses)
          .where(
            and(
              eq(surveyResponses.surveyId, input.surveyId),
              eq(surveyResponses.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (existingResponse[0]) {
          throw new Error("You have already responded to this survey");
        }
      }

      // Insert responses
      for (const response of input.responses) {
        await db.insert(surveyResponses).values({
          surveyId: input.surveyId,
          questionId: response.questionId,
          userId: survey[0].isAnonymous ? null : ctx.user.id,
          answer: response.answer,
        });
      }

      return { success: true };
    }),

  // Get survey responses (admin/creator only)
  getSurveyResponses: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const survey = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, input.surveyId))
        .limit(1);

      if (!survey[0]) throw new Error("Survey not found");

      if (survey[0].createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("You don't have permission to view responses");
      }

      const responses = await db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, input.surveyId))
        .orderBy(desc(surveyResponses.createdAt));

      return responses;
    }),

  // Export survey data
  exportSurveyData: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const survey = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, input.surveyId))
        .limit(1);

      if (!survey[0]) throw new Error("Survey not found");

      if (survey[0].createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("You don't have permission to export this data");
      }

      const questions = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.surveyId, input.surveyId))
        .orderBy(surveyQuestions.orderIndex);

      const responses = await db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, input.surveyId))
        .orderBy(surveyResponses.createdAt);

      // Format data for CSV export
      const headers = ["User ID", "Submitted At", ...questions.map((q) => q.question)];
      
      // Group responses by user
      const responsesByUser: Record<string, any> = {};
      responses.forEach((response) => {
        const key = response.userId?.toString() || `anonymous_${response.id}`;
        if (!responsesByUser[key]) {
          responsesByUser[key] = {
            userId: response.userId || "Anonymous",
            createdAt: response.createdAt,
            answers: {},
          };
        }
        const question = questions.find((q) => q.id === response.questionId);
        if (question) {
          responsesByUser[key].answers[question.question] = response.answer;
        }
      });

      const rows = Object.values(responsesByUser).map((r: any) => {
        return [
          r.userId,
          new Date(r.createdAt).toISOString(),
          ...questions.map((q) => r.answers[q.question] || ""),
        ];
      });

      return {
        surveyTitle: survey[0].title,
        headers,
        rows,
      };
    }),
});
