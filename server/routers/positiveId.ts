import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { positiveIdResponses } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const positiveIdRouter = router({
  // Submit Positive ID evaluation (public - can be anonymous)
  submitEvaluation: publicProcedure
    .input(
      z.object({
        participantId: z.number().optional(),
        school: z.string(),
        gender: z.string(),
        age: z.number(),
        feltSafe: z.enum(["agree", "disagree"]),
        helpedFeelBetter: z.enum(["agree", "disagree"]),
        comfortableAskingHelp: z.enum(["agree", "disagree"]),
        awareOfSupport: z.enum(["yes", "no", "maybe"]),
        facilitatorsGoodJob: z.enum(["agree", "disagree"]),
        heritageImportant: z.enum(["agree", "disagree"]),
        heritageReason: z.string(),
        wouldRecommend: z.enum(["agree", "disagree"]),
        enjoymentRating: z.number().min(1).max(5),
        likedMost: z.string(),
        improvements: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(positiveIdResponses).values({
        participantId: input.participantId,
        school: input.school,
        gender: input.gender,
        age: input.age,
        feltSafe: input.feltSafe,
        helpedFeelBetter: input.helpedFeelBetter,
        comfortableAskingHelp: input.comfortableAskingHelp,
        awareOfSupport: input.awareOfSupport,
        facilitatorsGoodJob: input.facilitatorsGoodJob,
        heritageImportant: input.heritageImportant,
        heritageReason: input.heritageReason,
        wouldRecommend: input.wouldRecommend,
        enjoymentRating: input.enjoymentRating,
        likedMost: input.likedMost,
        improvements: input.improvements,
      });

      return { success: true, responseId: result[0].insertId };
    }),

  // Get all responses (admin only)
  getAllResponses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin") {
      throw new Error("Access denied");
    }

    const responses = await db
      .select()
      .from(positiveIdResponses)
      .orderBy(desc(positiveIdResponses.submittedAt));

    return responses;
  }),

  // Get evaluation analytics (admin only)
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin") {
      throw new Error("Access denied");
    }

    const responses = await db.select().from(positiveIdResponses);

    // Calculate statistics
    const total = responses.length;
    const feltSafeAgree = responses.filter((r) => r.feltSafe === "agree").length;
    const helpedFeelBetterAgree = responses.filter(
      (r) => r.helpedFeelBetter === "agree"
    ).length;
    const comfortableAskingHelpAgree = responses.filter(
      (r) => r.comfortableAskingHelp === "agree"
    ).length;
    const awareOfSupportYes = responses.filter(
      (r) => r.awareOfSupport === "yes"
    ).length;
    const facilitatorsGoodJobAgree = responses.filter(
      (r) => r.facilitatorsGoodJob === "agree"
    ).length;
    const heritageImportantAgree = responses.filter(
      (r) => r.heritageImportant === "agree"
    ).length;
    const wouldRecommendAgree = responses.filter(
      (r) => r.wouldRecommend === "agree"
    ).length;

    const avgEnjoyment =
      responses.reduce((sum, r) => sum + (r.enjoymentRating || 0), 0) / total || 0;

    // Gender breakdown
    const genderBreakdown = responses.reduce((acc: any, r) => {
      acc[r.gender || "Unknown"] = (acc[r.gender || "Unknown"] || 0) + 1;
      return acc;
    }, {});

    // School breakdown
    const schoolBreakdown = responses.reduce((acc: any, r) => {
      acc[r.school || "Unknown"] = (acc[r.school || "Unknown"] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      percentages: {
        feltSafe: ((feltSafeAgree / total) * 100).toFixed(1),
        helpedFeelBetter: ((helpedFeelBetterAgree / total) * 100).toFixed(1),
        comfortableAskingHelp: ((comfortableAskingHelpAgree / total) * 100).toFixed(1),
        awareOfSupport: ((awareOfSupportYes / total) * 100).toFixed(1),
        facilitatorsGoodJob: ((facilitatorsGoodJobAgree / total) * 100).toFixed(1),
        heritageImportant: ((heritageImportantAgree / total) * 100).toFixed(1),
        wouldRecommend: ((wouldRecommendAgree / total) * 100).toFixed(1),
      },
      avgEnjoyment: avgEnjoyment.toFixed(1),
      genderBreakdown,
      schoolBreakdown,
    };
  }),
});
