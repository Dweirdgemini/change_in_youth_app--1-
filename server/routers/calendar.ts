import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { staffAvailability, sessions, sessionFacilitators, users } from "../../drizzle/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

export const calendarRouter = router({
  // Mark availability for specific dates
  setAvailability: protectedProcedure
    .input(
      z.object({
        date: z.string(), // ISO date string
        isAvailable: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const dateObj = new Date(input.date);

      // Check if availability already exists for this date
      const existing = await db
        .select()
        .from(staffAvailability)
        .where(
          and(
            eq(staffAvailability.userId, ctx.user.id),
            eq(staffAvailability.date, dateObj)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(staffAvailability)
          .set({
            isAvailable: input.isAvailable,
            notes: input.notes || null,
            updatedAt: new Date(),
          })
          .where(eq(staffAvailability.id, existing[0].id));
      } else {
        // Insert new
        await db.insert(staffAvailability).values({
          userId: ctx.user.id,
          date: dateObj,
          isAvailable: input.isAvailable,
          notes: input.notes || null,
        });
      }

      return { success: true };
    }),

  // Get availability for a date range
  getAvailability: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        userId: z.number().optional(), // If provided, get specific user's availability
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const targetUserId = input.userId || ctx.user.id;
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const availability = await db
        .select()
        .from(staffAvailability)
        .where(
          and(
            eq(staffAvailability.userId, targetUserId),
            gte(staffAvailability.date, startDate),
            lte(staffAvailability.date, endDate)
          )
        );

      return availability;
    }),

  // Get calendar view with sessions and availability
  getCalendarView: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Get user's sessions
      const userSessions = await db
        .select({
          session: sessions,
          facilitator: sessionFacilitators,
        })
        .from(sessionFacilitators)
        .innerJoin(sessions, eq(sessions.id, sessionFacilitators.sessionId))
        .where(
          and(
            eq(sessionFacilitators.userId, ctx.user.id),
            gte(sessions.startTime, startDate),
            lte(sessions.startTime, endDate)
          )
        );

      // Get user's availability
      const availability = await db
        .select()
        .from(staffAvailability)
        .where(
          and(
            eq(staffAvailability.userId, ctx.user.id),
            gte(staffAvailability.date, startDate),
            lte(staffAvailability.date, endDate)
          )
        );

      return {
        sessions: userSessions.map((s) => ({
          id: s.session.id,
          title: s.session.title,
          venue: s.session.venue,
          startTime: s.session.startTime,
          endTime: s.session.endTime,
          status: s.session.status,
          clockedIn: !!s.facilitator.clockInTime,
        })),
        availability: availability.map((a) => ({
          date: a.date,
          isAvailable: a.isAvailable,
          notes: a.notes,
        })),
      };
    }),

  // Get team availability (for admins assigning facilitators)
  getTeamAvailability: protectedProcedure
    .input(
      z.object({
        date: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admins can view team availability
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins can view team availability");
      }

      const dateObj = new Date(input.date);

      // Get all facilitators
      const facilitators = await db
        .select()
        .from(users)
        .where(eq(users.role, "team_member"));

      // Get availability for this date
      const availability = await db
        .select()
        .from(staffAvailability)
        .where(
          and(
            inArray(
              staffAvailability.userId,
              facilitators.map((f) => f.id)
            ),
            eq(staffAvailability.date, dateObj)
          )
        );

      // Combine data
      const teamAvailability = facilitators.map((facilitator) => {
        const avail = availability.find((a) => a.userId === facilitator.id);
        return {
          userId: facilitator.id,
          name: facilitator.name,
          email: facilitator.email,
          isAvailable: avail?.isAvailable ?? true, // Default to available if not set
          notes: avail?.notes,
        };
      });

      return teamAvailability;
    }),

  // Bulk set availability for multiple dates
  bulkSetAvailability: protectedProcedure
    .input(
      z.object({
        dates: z.array(z.string()),
        isAvailable: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      for (const dateStr of input.dates) {
        const dateObj = new Date(dateStr);

        const existing = await db
          .select()
          .from(staffAvailability)
          .where(
            and(
              eq(staffAvailability.userId, ctx.user.id),
              eq(staffAvailability.date, dateObj)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(staffAvailability)
            .set({
              isAvailable: input.isAvailable,
              notes: input.notes || null,
              updatedAt: new Date(),
            })
            .where(eq(staffAvailability.id, existing[0].id));
        } else {
          await db.insert(staffAvailability).values({
            userId: ctx.user.id,
            date: dateObj,
            isAvailable: input.isAvailable,
            notes: input.notes || null,
          });
        }
      }

      return { success: true, count: input.dates.length };
    }),
});
