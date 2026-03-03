import { router, protectedProcedure } from "../_core/trpc";
import { storagePut } from "../storage";
import { z } from "zod";

export const fileUploadRouter = router({
  /**
   * Upload profile image
   * Accepts base64 encoded image data
   */
  uploadProfileImage: protectedProcedure
    .input(
      z.object({
        imageData: z.string(), // base64 encoded image
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      
      // Convert base64 to buffer
      const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      // Upload to S3 with user-specific path
      const key = `profile-images/${userId}/${Date.now()}-${input.fileName}`;
      const result = await storagePut(key, buffer, input.contentType);
      
      return {
        success: true,
        url: result.url,
        key: result.key,
      };
    }),

  /**
   * Upload document
   * Accepts base64 encoded file data
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        fileData: z.string(), // base64 encoded file
        fileName: z.string(),
        contentType: z.string(),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      
      // Convert base64 to buffer
      const base64Data = input.fileData.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      // Upload to S3 with project-specific path
      const projectPath = input.projectId ? `project-${input.projectId}` : "general";
      const key = `documents/${projectPath}/${Date.now()}-${input.fileName}`;
      const result = await storagePut(key, buffer, input.contentType);
      
      return {
        success: true,
        url: result.url,
        key: result.key,
      };
    }),
});
