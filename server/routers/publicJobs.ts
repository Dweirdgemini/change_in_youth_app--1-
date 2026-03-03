import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { jobPostings, jobViews, jobClicks } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";
import { z } from "zod";

export const publicJobsRouter = router({
  // Get all active job postings (public access, no auth required)
  getActiveJobs: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const jobs = await db
      .select()
      .from(jobPostings)
      .where(
        and(
          eq(jobPostings.status, "active"),
          gte(jobPostings.expiresAt, new Date())
        )
      )
      .orderBy(jobPostings.createdAt);

    return jobs;
  }),

  // Track page view (QR code scan)
  trackPageView: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { success: false };
      }

      try {
        await db.insert(jobViews).values({
          jobId: input.jobId,
          userType: "public",
          viewedAt: new Date(),
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to track page view:", error);
        return { success: false };
      }
    }),

  // Track job click
  trackJobClick: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { success: false };
      }

      try {
        await db.insert(jobClicks).values({
          jobId: input.jobId,
          userType: "public",
          clickType: "apply_button",
          clickedAt: new Date(),
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to track job click:", error);
        return { success: false };
      }
    }),
});
