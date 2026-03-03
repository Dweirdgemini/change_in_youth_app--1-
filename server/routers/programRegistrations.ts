import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { programRegistrations, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const programRegistrationsRouter = router({
  // Submit a registration (public - for participants)
  submitRegistration: publicProcedure
    .input(
      z.object({
        programName: z.string(),
        participantName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        age: z.number().optional(),
        interests: z.string().optional(),
        additionalInfo: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [registration] = await db.insert(programRegistrations).values({
        programName: input.programName,
        participantName: input.participantName,
        email: input.email,
        phone: input.phone || null,
        age: input.age || null,
        interests: input.interests || null,
        additionalInfo: input.additionalInfo || null,
        status: "new",
      });

      return {
        success: true,
        registrationId: registration.insertId,
        message: "Thank you for registering! We'll be in touch soon.",
      };
    }),

  // Get all registrations (admin only)
  getAllRegistrations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins and finance can view registrations");
    }

    const registrations = await db
      .select({
        id: programRegistrations.id,
        programName: programRegistrations.programName,
        participantName: programRegistrations.participantName,
        email: programRegistrations.email,
        phone: programRegistrations.phone,
        age: programRegistrations.age,
        interests: programRegistrations.interests,
        additionalInfo: programRegistrations.additionalInfo,
        status: programRegistrations.status,
        contactedAt: programRegistrations.contactedAt,
        contactedBy: programRegistrations.contactedBy,
        contactedByName: users.name,
        notes: programRegistrations.notes,
        registeredAt: programRegistrations.registeredAt,
      })
      .from(programRegistrations)
      .leftJoin(users, eq(programRegistrations.contactedBy, users.id))
      .orderBy(desc(programRegistrations.registeredAt));

    return registrations;
  }),

  // Get registrations by program
  getByProgram: protectedProcedure
    .input(
      z.object({
        programName: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can view registrations");
      }

      const registrations = await db
        .select()
        .from(programRegistrations)
        .where(eq(programRegistrations.programName, input.programName))
        .orderBy(desc(programRegistrations.registeredAt));

      return registrations;
    }),

  // Mark as contacted
  markAsContacted: protectedProcedure
    .input(
      z.object({
        registrationId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can update registrations");
      }

      await db
        .update(programRegistrations)
        .set({
          status: "contacted",
          contactedAt: new Date(),
          contactedBy: ctx.user.id,
          notes: input.notes || null,
        })
        .where(eq(programRegistrations.id, input.registrationId));

      return { success: true };
    }),

  // Mark as enrolled
  markAsEnrolled: protectedProcedure
    .input(
      z.object({
        registrationId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
        throw new Error("Only admins and finance can update registrations");
      }

      await db
        .update(programRegistrations)
        .set({
          status: "enrolled",
          notes: input.notes || null,
        })
        .where(eq(programRegistrations.id, input.registrationId));

      return { success: true };
    }),

  // Get registration statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "finance") {
      throw new Error("Only admins and finance can view statistics");
    }

    const registrations = await db.select().from(programRegistrations);

    // Group by program
    const byProgram: Record<string, number> = {};
    registrations.forEach((reg) => {
      byProgram[reg.programName] = (byProgram[reg.programName] || 0) + 1;
    });

    const stats = {
      total: registrations.length,
      new: registrations.filter((r) => r.status === "new").length,
      contacted: registrations.filter((r) => r.status === "contacted").length,
      enrolled: registrations.filter((r) => r.status === "enrolled").length,
      byProgram,
    };

    return stats;
  }),

  // Export registrations (returns data for CSV)
  exportRegistrations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can export registrations");
    }

    const registrations = await db
      .select()
      .from(programRegistrations)
      .orderBy(desc(programRegistrations.registeredAt));

    return registrations;
  }),
});
