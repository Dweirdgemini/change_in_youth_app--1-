import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { tasks } from "../../drizzle/schema";
import { eq, and, or, desc } from "drizzle-orm";

export const tasksRouter = router({
  // Create a new task
  createTask: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        projectId: z.number().optional().nullable(),
        sessionId: z.number().optional().nullable(),
        assignedTo: z.number().optional().nullable(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
        dueDate: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // MySQL insert returns a ResultSetHeader — access insertId directly
      const [result] = await db.insert(tasks).values({
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        sessionId: input.sessionId,
        assignedTo: input.assignedTo || ctx.user.id,
        createdBy: ctx.user.id,
        priority: input.priority,
        status: input.status,
        dueDate: input.dueDate,
      } as any) as any;
      return { success: true, taskId: result?.insertId ?? null };
    }),

  // Get all tasks (admin/finance can see all, others see only assigned to them)
  getTasks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin" || ctx.user.role === "finance";

    if (isAdmin) {
      return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    } else {
      return await db
        .select()
        .from(tasks)
        .where(or(eq(tasks.assignedTo, ctx.user.id), eq(tasks.createdBy, ctx.user.id)))
        .orderBy(desc(tasks.createdAt));
    }
  }),

  // Get tasks assigned to the current user
  getMyTasks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, ctx.user.id))
      .orderBy(desc(tasks.createdAt));
  }),

  // Get task by ID
  getTaskById: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [task] = await db.select().from(tasks).where(eq(tasks.id, input.taskId)).limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user has access to this task
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin" || ctx.user.role === "finance";
      const isAssignedOrCreator = task.assignedTo === ctx.user.id || task.createdBy === ctx.user.id;

      if (!isAdmin && !isAssignedOrCreator) {
        throw new Error("Access denied");
      }

      return task;
    }),

  // Update task status
  updateTaskStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [task] = await db.select().from(tasks).where(eq(tasks.id, input.taskId)).limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user has access to this task
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin" || ctx.user.role === "finance";
      const isAssignedOrCreator = task.assignedTo === ctx.user.id || task.createdBy === ctx.user.id;

      if (!isAdmin && !isAssignedOrCreator) {
        throw new Error("Access denied");
      }

      await db
        .update(tasks)
        .set({
          status: input.status,
          completedAt: input.status === "completed" ? new Date() : null,
        } as any)
        .where(eq(tasks.id, input.taskId));

      return { success: true };
    }),

  // Update task
  updateTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        projectId: z.number().optional().nullable(),
        sessionId: z.number().optional().nullable(),
        assignedTo: z.number().optional().nullable(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
        dueDate: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [task] = await db.select().from(tasks).where(eq(tasks.id, input.taskId)).limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user has access to this task
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin" || ctx.user.role === "finance";
      const isCreator = task.createdBy === ctx.user.id;

      if (!isAdmin && !isCreator) {
        throw new Error("Access denied");
      }

      const { taskId, ...updateData } = input;

      await db
        .update(tasks)
        .set({
          ...updateData,
          completedAt: input.status === "completed" ? new Date() : task.completedAt,
        } as any)
        .where(eq(tasks.id, input.taskId));

      return { success: true };
    }),

  // Delete task
  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [task] = await db.select().from(tasks).where(eq(tasks.id, input.taskId)).limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      // Only admin or creator can delete
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin";
      const isCreator = task.createdBy === ctx.user.id;

      if (!isAdmin && !isCreator) {
        throw new Error("Access denied");
      }

      await db.delete(tasks).where(eq(tasks.id, input.taskId));

      return { success: true };
    }),

  // Get task statistics
  getTaskStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin" || ctx.user.role === "finance";

    let userTasks;
    if (isAdmin) {
      userTasks = await db.select().from(tasks);
    } else {
      userTasks = await db
        .select()
        .from(tasks)
        .where(or(eq(tasks.assignedTo, ctx.user.id), eq(tasks.createdBy, ctx.user.id)));
    }

    const stats = {
      total: userTasks.length,
      pending: userTasks.filter((t) => t.status === "pending").length,
      inProgress: userTasks.filter((t) => t.status === "in_progress").length,
      completed: userTasks.filter((t) => t.status === "completed").length,
      cancelled: userTasks.filter((t) => t.status === "cancelled").length,
    };

    return stats;
  }),
});
