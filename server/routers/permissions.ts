import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { userPermissions, users, projects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const permissionsRouter = router({
  // Get all users with their permissions (super admin only)
  getAllUsersWithPermissions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "super_admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only super admins can view all user permissions",
      });
    }

    const db = await getDb();
    const allUsers = await db.select().from(users);
    
    const usersWithPermissions = await Promise.all(
      allUsers.map(async (user) => {
        const permissions = await db
          .select({
            id: userPermissions.id,
            projectId: userPermissions.projectId,
            accessLevel: userPermissions.accessLevel,
            projectName: projects.name,
          })
          .from(userPermissions)
          .leftJoin(projects, eq(userPermissions.projectId, projects.id))
          .where(eq(userPermissions.userId, user.id));

        return {
          ...user,
          permissions,
        };
      })
    );

    return usersWithPermissions;
  }),

  // Assign permission to a user (super admin only)
  assignPermission: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        projectId: z.number().nullable(),
        accessLevel: z.enum(["read", "write", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can assign permissions",
        });
      }

      const db = await getDb();

      // Check if permission already exists
      const existing = await db
        .select()
        .from(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, input.userId),
            input.projectId
              ? eq(userPermissions.projectId, input.projectId)
              : eq(userPermissions.projectId, null)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing permission
        await db
          .update(userPermissions)
          .set({
            accessLevel: input.accessLevel,
            updatedAt: new Date(),
          })
          .where(eq(userPermissions.id, existing[0].id));
      } else {
        // Create new permission
        await db.insert(userPermissions).values({
          userId: input.userId,
          projectId: input.projectId,
          accessLevel: input.accessLevel,
          grantedBy: ctx.user.id,
        });
      }

      return { success: true };
    }),

  // Remove permission from a user (super admin only)
  removePermission: protectedProcedure
    .input(z.object({ permissionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can remove permissions",
        });
      }

      const db = await getDb();
      await db.delete(userPermissions).where(eq(userPermissions.id, input.permissionId));

      return { success: true };
    }),

  // Update user role (super admin only)
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["super_admin", "admin", "finance", "safeguarding", "team_member", "student"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can update user roles",
        });
      }

      const db = await getDb();
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

      return { success: true };
    }),
});
