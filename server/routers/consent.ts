import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { consentForms } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const consentRouter = router({
  // Public endpoint - no auth required for parents to submit
  submitConsentForm: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        // Section 1: Participant Details
        childFullName: z.string(),
        childDateOfBirth: z.string(),
        schoolName: z.string(),
        yearGroup: z.string().optional(),
        parentGuardianFullName: z.string(),
        parentGuardianContactNumber: z.string(),
        parentGuardianEmail: z.string().email(),
        // Section 2: Photography and Video Consent
        photographsPermission: z.boolean(),
        videoPermission: z.boolean(),
        bothPermission: z.boolean(),
        noPermission: z.boolean(),
        // Section 3: Use of Images
        internalUseEvaluation: z.boolean(),
        internalUseSafeguarding: z.boolean(),
        internalUseTraining: z.boolean(),
        externalUseSocialMedia: z.boolean(),
        externalUseWebsite: z.boolean(),
        externalUsePrintedMaterials: z.boolean(),
        externalUseFundingReports: z.boolean(),
        externalUseLocalMedia: z.boolean(),
        externalUseEducationalPresentations: z.boolean(),
        usePermissionType: z.enum(["internal_only", "internal_and_external", "internal_and_specific"]),
        specificExternalUses: z.string().optional(),
        // Section 4: Identification
        identificationType: z.enum(["full_identification", "first_name_only", "anonymous", "no_identification"]),
        // Section 5: Third-Party Sharing
        thirdPartySharing: z.boolean(),
        // Section 6: Data Protection
        dataProtectionConfirmed: z.boolean(),
        // Section 8: Safeguarding
        safeguardingConfirmed: z.boolean(),
        // Section 9: Additional Information
        additionalInformation: z.string().optional(),
        // Section 10: Consent Declaration
        parentGuardianPrintedName: z.string(),
        consentDate: z.string(),
        // Section 11: Second Parent/Guardian
        secondParentGuardianPrintedName: z.string().optional(),
        secondParentConsentDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [consent] = await db.insert(consentForms).values({
        projectId: input.projectId,
        childFullName: input.childFullName,
        childDateOfBirth: new Date(input.childDateOfBirth),
        schoolName: input.schoolName,
        yearGroup: input.yearGroup,
        parentGuardianFullName: input.parentGuardianFullName,
        parentGuardianContactNumber: input.parentGuardianContactNumber,
        parentGuardianEmail: input.parentGuardianEmail,
        photographsPermission: input.photographsPermission,
        videoPermission: input.videoPermission,
        bothPermission: input.bothPermission,
        noPermission: input.noPermission,
        internalUseEvaluation: input.internalUseEvaluation,
        internalUseSafeguarding: input.internalUseSafeguarding,
        internalUseTraining: input.internalUseTraining,
        externalUseSocialMedia: input.externalUseSocialMedia,
        externalUseWebsite: input.externalUseWebsite,
        externalUsePrintedMaterials: input.externalUsePrintedMaterials,
        externalUseFundingReports: input.externalUseFundingReports,
        externalUseLocalMedia: input.externalUseLocalMedia,
        externalUseEducationalPresentations: input.externalUseEducationalPresentations,
        usePermissionType: input.usePermissionType,
        specificExternalUses: input.specificExternalUses,
        identificationType: input.identificationType,
        thirdPartySharing: input.thirdPartySharing,
        dataProtectionConfirmed: input.dataProtectionConfirmed,
        safeguardingConfirmed: input.safeguardingConfirmed,
        additionalInformation: input.additionalInformation,
        parentGuardianPrintedName: input.parentGuardianPrintedName,
        consentDate: new Date(input.consentDate),
        secondParentGuardianPrintedName: input.secondParentGuardianPrintedName,
        secondParentConsentDate: input.secondParentConsentDate ? new Date(input.secondParentConsentDate) : undefined,
        // Metadata
        submittedAt: new Date(),
        ipAddress: ctx.req?.ip || ctx.req?.headers?.["x-forwarded-for"] as string || "unknown",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
      });

      return { success: true, id: consent.insertId };
    }),

  // Admin endpoint - get all consent forms for a project
  getConsentFormsByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const forms = await db
        .select()
        .from(consentForms)
        .where(eq(consentForms.projectId, input.projectId))
        .orderBy(desc(consentForms.submittedAt));

      return forms;
    }),

  // Admin endpoint - get all consent forms
  getAllConsentForms: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const forms = await db
      .select()
      .from(consentForms)
      .orderBy(desc(consentForms.submittedAt));

    return forms;
  }),

  // Admin endpoint - get single consent form
  getConsentFormById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [form] = await db
        .select()
        .from(consentForms)
        .where(eq(consentForms.id, input.id))
        .limit(1);

      return form;
    }),

  // Admin endpoint - mark consent form as received
  markAsReceived: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        receivedBy: z.string(),
        storedIn: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(consentForms)
        .set({
          receivedBy: input.receivedBy,
          dateReceived: new Date(),
          storedIn: input.storedIn,
        })
        .where(eq(consentForms.id, input.id));

      return { success: true };
    }),
});
