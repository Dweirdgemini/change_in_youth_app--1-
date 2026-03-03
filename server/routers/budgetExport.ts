import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { budgetLines, projects } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const budgetExportRouter = router({
  // Export budget report as JSON (will be converted to PDF/Excel on client)
  exportBudgetReport: protectedProcedure
    .input(
      z.object({
        projectId: z.number().nullable(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
        format: z.enum(["pdf", "excel"]),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin" && ctx.user.role !== "finance") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and finance users can export budget reports",
        });
      }

      const db = await getDb();

      // Build query conditions
      const conditions: any[] = [];
      if (input.projectId) {
        conditions.push(eq(budgetLines.projectId, input.projectId));
      }

      // Get budget lines
      const lines = await db
        .select({
          id: budgetLines.id,
          projectId: budgetLines.projectId,
          projectName: projects.name,
          projectCode: projects.code,
          category: budgetLines.category,
          description: budgetLines.description,
          allocatedAmount: budgetLines.allocatedAmount,
          spentAmount: budgetLines.spentAmount,
          createdAt: budgetLines.createdAt,
        })
        .from(budgetLines)
        .leftJoin(projects, eq(budgetLines.projectId, projects.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Group by project and category
      const projectGroups: Record<string, any> = {};
      
      lines.forEach((line) => {
        const projectKey = line.projectId?.toString() || "unknown";
        if (!projectGroups[projectKey]) {
          projectGroups[projectKey] = {
            projectId: line.projectId,
            projectName: line.projectName || "Unknown Project",
            projectCode: line.projectCode || "N/A",
            categories: {},
            totalAllocated: 0,
            totalSpent: 0,
          };
        }

        const category = line.category || "Uncategorized";
        if (!projectGroups[projectKey].categories[category]) {
          projectGroups[projectKey].categories[category] = {
            category,
            lines: [],
            totalAllocated: 0,
            totalSpent: 0,
          };
        }

        const allocated = parseFloat(line.allocatedAmount || "0");
        const spent = parseFloat(line.spentAmount || "0");

        projectGroups[projectKey].categories[category].lines.push({
          description: line.description,
          allocated,
          spent,
          variance: allocated - spent,
          percentageUsed: allocated > 0 ? (spent / allocated) * 100 : 0,
        });

        projectGroups[projectKey].categories[category].totalAllocated += allocated;
        projectGroups[projectKey].categories[category].totalSpent += spent;
        projectGroups[projectKey].totalAllocated += allocated;
        projectGroups[projectKey].totalSpent += spent;
      });

      return {
        reportDate: new Date().toISOString(),
        organizationName: "Change In Youth CIC",
        projects: Object.values(projectGroups),
        format: input.format,
      };
    }),
});
