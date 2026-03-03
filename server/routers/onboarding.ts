import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { organizations, organizationFeatures, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const onboardingRouter = router({
  /**
   * Create new organization (public - for self-service signup)
   * Creates organization + initial admin user
   */
  createOrganization: publicProcedure
    .input(
      z.object({
        // Organization details
        organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
        
        // Initial admin user
        adminName: z.string().min(2),
        adminEmail: z.string().email(),
        
        // Contact info
        contactPhone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if slug already exists
      const existingOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, input.slug))
        .limit(1);

      if (existingOrg.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An organization with this slug already exists. Please choose a different one.",
        });
      }

      // Check if admin email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.adminEmail))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists.",
        });
      }

      // Create organization
      const [newOrg] = await db.insert(organizations).values({
        name: input.organizationName,
        slug: input.slug,
        billingEmail: input.adminEmail,
        contactName: input.adminName,
        contactPhone: input.contactPhone,
        address: input.address,
        subscriptionTier: "trial",
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxUsers: 10,
        onboardingCompleted: false,
        onboardingStep: 1,
      });

      const organizationId = Number(newOrg.insertId);

      // Enable default features for new organization
      const defaultFeatures = [
        "budgets",
        "sessions",
        "documents",
        "consent_forms",
        "team_management",
      ];

      for (const feature of defaultFeatures) {
        await db.insert(organizationFeatures).values({
          organizationId,
          featureSlug: feature,
          enabled: true,
        });
      }

      // Create initial admin user
      // Note: This creates a temporary user that will be linked to OAuth on first login
      const tempOpenId = `temp-${input.slug}-${Date.now()}`;
      
      const [newUser] = await db.insert(users).values({
        organizationId,
        openId: tempOpenId,
        name: input.adminName,
        email: input.adminEmail,
        role: "admin",
        loginMethod: "pending", // Will be updated on first OAuth login
      });

      return {
        success: true,
        organizationId,
        userId: Number(newUser.insertId),
        message: `Welcome to ${input.organizationName}! Your organization has been created with a 30-day trial. Please sign in to complete setup.`,
        nextSteps: [
          "Sign in with your email",
          "Complete the onboarding wizard",
          "Add team members",
          "Create your first project",
        ],
      };
    }),

  /**
   * Get onboarding status for current user's organization
   */
  getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const orgId = ctx.user.organizationId || 1;

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    return {
      organizationId: org.id,
      organizationName: org.name,
      onboardingCompleted: org.onboardingCompleted,
      currentStep: org.onboardingStep,
      subscriptionTier: org.subscriptionTier,
      subscriptionStatus: org.subscriptionStatus,
      trialEndsAt: org.trialEndsAt,
      maxUsers: org.maxUsers,
    };
  }),

  /**
   * Update onboarding progress
   */
  updateOnboardingStep: protectedProcedure
    .input(
      z.object({
        step: z.number().min(0).max(10),
        completed: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orgId = ctx.user.organizationId || 1;

      // Only admins can update onboarding
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update onboarding progress",
        });
      }

      await db
        .update(organizations)
        .set({
          onboardingStep: input.step,
          onboardingCompleted: input.completed ?? false,
        })
        .where(eq(organizations.id, orgId));

      return { success: true };
    }),

  /**
   * Complete onboarding
   */
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const orgId = ctx.user.organizationId || 1;

    // Only admins can complete onboarding
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can complete onboarding",
      });
    }

    await db
      .update(organizations)
      .set({
        onboardingCompleted: true,
        onboardingStep: 999, // Mark as fully complete
      })
      .where(eq(organizations.id, orgId));

    return {
      success: true,
      message: "Onboarding completed! Welcome aboard! 🎉",
    };
  }),

  /**
   * Get organization profile
   */
  getOrganizationProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const orgId = ctx.user.organizationId || 1;

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    // Get user count
    const userCount = await db
      .select()
      .from(users)
      .where(eq(users.organizationId, orgId));

    return {
      ...org,
      userCount: userCount.length,
    };
  }),

  /**
   * Update organization profile
   */
  updateOrganizationProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        logoUrl: z.string().url().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orgId = ctx.user.organizationId || 1;

      // Only admins can update organization profile
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update organization profile",
        });
      }

      await db
        .update(organizations)
        .set(input)
        .where(eq(organizations.id, orgId));

      return { success: true };
    }),
});
