import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { organizations, users } from "../../drizzle/schema";
import { eq, sql, getTableColumns } from "drizzle-orm";

export const organizationsRouter = router({
  // Get current user's organization
  getMyOrganization: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const orgId = ctx.user.organizationId || 1;
    
    const result = await db
      .select({
        ...getTableColumns(organizations),
        userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE organization_id = ${orgId})`
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    return result[0] || null;
  }),

  // Get all organizations (super admin only)
  getAllOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (ctx.user.role !== "super_admin") {
      throw new Error("Only super admins can view all organizations");
    }

    const result = await db.$client.query(
      `SELECT o.*, 
        (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as user_count,
        (SELECT COUNT(*) FROM projects WHERE organization_id = o.id) as project_count
       FROM organizations o
       ORDER BY o.created_at DESC`
    );

    return result;
  }),

  // Create new organization (super admin only)
  createOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
        subscriptionTier: z.enum(["starter", "professional", "enterprise", "custom"]),
        billingEmail: z.string().email(),
        maxUsers: z.number().int().positive(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "super_admin") {
        throw new Error("Only super admins can create organizations");
      }

      // Check if slug already exists
      const existing = await db.$client.query(
        "SELECT id FROM organizations WHERE slug = ?",
        [input.slug]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        throw new Error("Organization slug already exists");
      }

      // Create organization
      const result = await db.$client.query(
        `INSERT INTO organizations 
         (name, slug, logo_url, primary_color, subscription_tier, subscription_status, max_users, billing_email, trial_ends_at)
         VALUES (?, ?, ?, ?, ?, 'trial', ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
        [
          input.name,
          input.slug,
          input.logoUrl || "",
          input.primaryColor || "#0a7ea4",
          input.subscriptionTier,
          input.maxUsers,
          input.billingEmail,
        ]
      );

      const orgId = (result as any).insertId;

      // Assign default features based on subscription tier
      const tierFeatures: Record<string, string[]> = {
        starter: ["core", "team_management"],
        professional: ["core", "team_management", "finance"],
        enterprise: ["core", "team_management", "finance", "analytics", "video_meetings", "team_rankings"],
        custom: ["core", "team_management", "finance", "analytics", "video_meetings", "team_rankings"],
      };

      const features = tierFeatures[input.subscriptionTier] || ["core"];
      
      for (const feature of features) {
        await db.$client.query(
          "INSERT INTO organization_features (organization_id, feature_slug, enabled) VALUES (?, ?, TRUE)",
          [orgId, feature]
        );
      }

      return { success: true, organizationId: orgId };
    }),

  // Update organization settings
  updateOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().optional(),
        name: z.string().min(1).optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        billingEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orgId = input.organizationId || ctx.user.organizationId || 1;

      // Only super admins or org admins can update
      if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin") {
        throw new Error("Only admins can update organization settings");
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (input.name) {
        updates.push("name = ?");
        values.push(input.name);
      }
      if (input.logoUrl !== undefined) {
        updates.push("logo_url = ?");
        values.push(input.logoUrl);
      }
      if (input.primaryColor) {
        updates.push("primary_color = ?");
        values.push(input.primaryColor);
      }
      if (input.billingEmail) {
        updates.push("billing_email = ?");
        values.push(input.billingEmail);
      }

      if (updates.length === 0) {
        return { success: true };
      }

      values.push(orgId);

      await db.$client.query(
        `UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      return { success: true };
    }),

  // Get organization features
  getOrganizationFeatures: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const orgId = ctx.user.organizationId || 1;

    const result = await db.$client.query(
      `SELECT of.*, fp.name, fp.description, fp.is_addon, fp.addon_price
       FROM organization_features of
       JOIN feature_packages fp ON of.feature_slug = fp.slug
       WHERE of.organization_id = ? AND of.enabled = TRUE
       ORDER BY fp.is_addon ASC, fp.name ASC`,
      [orgId]
    );

    return result;
  }),

  // Get available feature packages
  getAvailablePackages: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.$client.query(
      `SELECT * FROM feature_packages ORDER BY is_addon ASC, name ASC`
    );

    return result;
  }),

  // Enable feature for organization (super admin only)
  enableFeature: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
        featureSlug: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "super_admin") {
        throw new Error("Only super admins can enable features");
      }

      // Check if already enabled
      const existing = await db.$client.query(
        "SELECT id FROM organization_features WHERE organization_id = ? AND feature_slug = ?",
        [input.organizationId, input.featureSlug]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        // Update to enabled
        await db.$client.query(
          "UPDATE organization_features SET enabled = TRUE WHERE organization_id = ? AND feature_slug = ?",
          [input.organizationId, input.featureSlug]
        );
      } else {
        // Insert new
        await db.$client.query(
          "INSERT INTO organization_features (organization_id, feature_slug, enabled) VALUES (?, ?, TRUE)",
          [input.organizationId, input.featureSlug]
        );
      }

      return { success: true };
    }),

  // Disable feature for organization (super admin only)
  disableFeature: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
        featureSlug: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "super_admin") {
        throw new Error("Only super admins can disable features");
      }

      await db.$client.query(
        "UPDATE organization_features SET enabled = FALSE WHERE organization_id = ? AND feature_slug = ?",
        [input.organizationId, input.featureSlug]
      );

      return { success: true };
    }),

  // Get system announcements for organization
  getAnnouncements: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const orgId = ctx.user.organizationId || 1;

    const result = await db.$client.query(
      `SELECT sa.*, oa.status, oa.viewed_at, oa.responded_at
       FROM system_announcements sa
       LEFT JOIN organization_announcements oa ON sa.id = oa.announcement_id AND oa.organization_id = ?
       WHERE sa.published_at IS NOT NULL
       ORDER BY sa.published_at DESC
       LIMIT 50`,
      [orgId]
    );

    return result;
  }),

  // Mark announcement as read
  markAnnouncementRead: protectedProcedure
    .input(z.object({ announcementId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orgId = ctx.user.organizationId || 1;

      // Check if record exists
      const existing = await db.$client.query(
        "SELECT id FROM organization_announcements WHERE organization_id = ? AND announcement_id = ?",
        [orgId, input.announcementId]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        await db.$client.query(
          "UPDATE organization_announcements SET status = 'read', viewed_at = NOW() WHERE organization_id = ? AND announcement_id = ?",
          [orgId, input.announcementId]
        );
      } else {
        await db.$client.query(
          "INSERT INTO organization_announcements (organization_id, announcement_id, status, viewed_at) VALUES (?, ?, 'read', NOW())",
          [orgId, input.announcementId]
        );
      }

      return { success: true };
    }),
});
