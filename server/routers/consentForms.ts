import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { consentForms } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Consent Forms Router
 * 
 * NOTE: This router was originally designed for a template-based consent system,
 * but the schema is for direct participant consent submissions with 44 specific fields.
 * 
 * The procedures below are minimal stubs to prevent TypeScript errors.
 * Full implementation requires either:
 * 1. Creating a separate form_templates table for the template system
 * 2. Or implementing direct consent submission endpoints matching the schema
 */

export const consentFormsRouter = router({
  // Get all consent forms (admin only)
  getAllForms: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "safeguarding") {
      throw new Error("Only admins can view consent forms");
    }

    const forms = await db
      .select()
      .from(consentForms)
      .orderBy(desc(consentForms.createdAt));

    return forms;
  }),

  // Get a specific consent form by ID
  getForm: protectedProcedure
    .input(
      z.object({
        formId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "safeguarding") {
        throw new Error("Insufficient permissions");
      }

      const [form] = await db
        .select()
        .from(consentForms)
        .where(eq(consentForms.id, input.formId))
        .limit(1);

      if (!form) {
        throw new Error("Consent form not found");
      }

      return form;
    }),

  // Get consent forms for a specific project
  getProjectForms: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const forms = await db
        .select()
        .from(consentForms)
        .where(eq(consentForms.projectId, input.projectId))
        .orderBy(desc(consentForms.createdAt));

      return forms;
    }),

  // Get active consent forms
  getActiveForms: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "safeguarding") {
      throw new Error("Only admins can view consent forms");
    }

    const forms = await db
      .select()
      .from(consentForms)
      .where(eq(consentForms.status, "active"))
      .orderBy(desc(consentForms.submittedAt));

    return forms;
  }),

  // Search consent forms by child name
  searchForms: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "safeguarding") {
        throw new Error("Only admins can search consent forms");
      }

      // Simple implementation - in production, use full-text search
      const forms = await db
        .select()
        .from(consentForms)
        .where(eq(consentForms.status, "active"));

      const filtered = forms.filter(
        (form) =>
          form.childFullName?.toLowerCase().includes(input.query.toLowerCase()) ||
          form.parentGuardianFullName?.toLowerCase().includes(input.query.toLowerCase())
      );

      return filtered;
    }),

  // Revoke a consent form
  revokeForm: protectedProcedure
    .input(
      z.object({
        formId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin" && ctx.user.role !== "safeguarding") {
        throw new Error("Only admins can revoke consent forms");
      }

      await db
        .update(consentForms)
        .set({
          status: "revoked",
        })
        .where(eq(consentForms.id, input.formId));

      return { success: true };
    }),

  // Get consent form statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "admin" && ctx.user.role !== "safeguarding") {
      throw new Error("Only admins can view consent form statistics");
    }

    const forms = await db.select().from(consentForms);

    const stats = {
      total: forms.length,
      active: forms.filter((f) => f.status === "active").length,
      expired: forms.filter((f) => f.status === "expired").length,
      revoked: forms.filter((f) => f.status === "revoked").length,
    };

    return stats;
  }),
});
