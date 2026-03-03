import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const adminUsersRouter = router({
  // Get all users in organization
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    console.log('[getAllUsers] Called by user:', ctx.user.email, 'role:', ctx.user.role, 'orgId:', ctx.user.organizationId);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      console.log('[getAllUsers] FORBIDDEN - user role:', ctx.user.role);
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view all users" });
    }

    const orgId = ctx.user.organizationId || 1;
    console.log('[getAllUsers] Querying for orgId:', orgId);

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        loginMethod: users.loginMethod,
        canPostJobs: users.canPostJobs,
        lastSignedIn: users.lastSignedIn,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        profileImageUrl: users.profileImageUrl,
      })
      .from(users)
      .where(eq(users.organizationId, orgId))
      .orderBy(desc(users.createdAt));

    console.log('[getAllUsers] Found', result.length, 'users');
    return result;
  }),

  // Create new user
  createUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["admin", "finance", "safeguarding", "team_member", "student"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create users" });
      }

      const orgId = ctx.user.organizationId || 1;

      // Check if email already exists
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "User with this email already exists" });
      }

      // Generate a temporary openId for the user
      const tempOpenId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create user
      const now = new Date();
      const result = await db.insert(users).values({
        openId: tempOpenId,
        name: input.name,
        email: input.email,
        role: input.role as any,
        organizationId: orgId,
        loginMethod: 'email',
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      });

      return { success: true, userId: Number((result as any).insertId) };
    }),

  // Update user
  updateUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().min(1).optional(),
        role: z.enum(["admin", "finance", "safeguarding", "team_member", "student"]).optional(),
        canPostJobs: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update users" });
      }

      const updateData: any = {};

      if (input.name) {
        updateData.name = input.name;
      }
      if (input.role) {
        updateData.role = input.role;
      }
      if (input.canPostJobs !== undefined) {
        updateData.canPostJobs = input.canPostJobs;
      }

      if (Object.keys(updateData).length === 0) {
        return { success: true };
      }

      updateData.updatedAt = new Date();

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Delete user
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete users" });
      }

      // Prevent deleting yourself
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete your own account" });
      }

      await db.delete(users).where(eq(users.id, input.userId));

      return { success: true };
    }),
});
