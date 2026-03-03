import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { projectAssignments, projects, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const projectAssignmentsRouter = router({
  // Assign user to project
  assignUser: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can assign users to projects");
      }

      await db.insert(projectAssignments).values({
        projectId: input.projectId,
        userId: input.userId,
        role: input.role || "team_member",
        assignedBy: ctx.user.id,
      });

      return { success: true };
    }),

  // Remove user from project
  removeUser: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can remove users from projects");
      }

      await db
        .delete(projectAssignments)
        .where(
          and(
            eq(projectAssignments.projectId, input.projectId),
            eq(projectAssignments.userId, input.userId)
          )
        );

      return { success: true };
    }),

  // Get all projects with assigned users
  getAllProjectsWithUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allProjects = await db.select().from(projects);

    const projectsWithUsers = await Promise.all(
      allProjects.map(async (project) => {
        const assignments = await db
          .select({
            userId: projectAssignments.userId,
            userName: users.name,
            userEmail: users.email,
            role: projectAssignments.role,
            assignedAt: projectAssignments.assignedAt,
          })
          .from(projectAssignments)
          .leftJoin(users, eq(projectAssignments.userId, users.id))
          .where(eq(projectAssignments.projectId, project.id));

        return {
          ...project,
          assignedUsers: assignments,
        };
      })
    );

    return projectsWithUsers;
  }),

  // Get user's assigned projects
  getMyProjects: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const assignments = await db
      .select({
        projectId: projectAssignments.projectId,
        projectName: projects.name,
        projectDescription: projects.description,
        projectStatus: projects.status,
        role: projectAssignments.role,
        assignedAt: projectAssignments.assignedAt,
      })
      .from(projectAssignments)
      .leftJoin(projects, eq(projectAssignments.projectId, projects.id))
      .where(eq(projectAssignments.userId, ctx.user.id));

    return assignments;
  }),

  // Get all unassigned users
  getUnassignedUsers: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all users
      const allUsers = await db.select().from(users);

      // Get assigned users for this project
      const assignedUserIds = await db
        .select({ userId: projectAssignments.userId })
        .from(projectAssignments)
        .where(eq(projectAssignments.projectId, input.projectId));

      const assignedIds = new Set(assignedUserIds.map((a) => a.userId));

      // Filter out assigned users
      const unassignedUsers = allUsers.filter((user) => !assignedIds.has(user.id));

      return unassignedUsers;
    }),
});
