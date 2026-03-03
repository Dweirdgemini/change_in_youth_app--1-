import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";

/**
 * Team Ranking Router - STUB
 * 
 * This router is currently disabled because the 'ranking' field doesn't exist in the users schema.
 * To enable this feature, add the ranking field to the users table in drizzle/schema.ts:
 * 
 * ranking: varchar("ranking", { length: 50 }).default("standard"),
 * 
 * Then uncomment the procedures below.
 */

export const teamRankingRouter = router({
  // Get user's current rank
  getMyRank: protectedProcedure
    .query(async () => {
      // Stub: Always return "standard" rank until schema is updated
      return {
        ranking: "standard",
      };
    }),

  // Get rank for a specific user
  getUserRank: protectedProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async () => {
      // Stub: Always return "standard" rank until schema is updated
      return {
        ranking: "standard",
      };
    }),

  // Update user rank (admin only)
  updateRank: adminProcedure
    .input(z.object({
      userId: z.number(),
      ranking: z.enum(["probationary", "standard", "high_performer", "trusted"]),
    }))
    .mutation(async () => {
      // Stub: Do nothing until schema is updated
      return { success: true };
    }),

  // Get team leaderboard
  getLeaderboard: protectedProcedure
    .query(async () => {
      // Stub: Return empty leaderboard until schema is updated
      return [];
    }),

  // Get rank history for a user
  getRankHistory: protectedProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async () => {
      // Stub: Return empty history until schema is updated
      return [];
    }),
});
