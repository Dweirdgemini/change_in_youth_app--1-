import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";

// Agora token generation using RtcTokenBuilder
// Note: For production, you should use a proper token server
// For now, we'll use a simple approach with App ID only (testing mode)

export const agoraTokensRouter = router({
  // Generate RTC token for video calling
  generateToken: protectedProcedure
    .input(z.object({
      channelName: z.string(),
      uid: z.number(),
    }))
    .query(async ({ input }) => {
      // In testing mode (without App Certificate), return empty token
      // The client will join with App ID only
      
      // For production with App Certificate enabled:
      // 1. Install: pnpm add agora-access-token
      // 2. Use RtcTokenBuilder to generate tokens
      // 3. Set token expiration time (e.g., 24 hours)
      
      const appId = ENV.AGORA_APP_ID;
      const appCertificate = ENV.AGORA_APP_CERTIFICATE;

      if (!appId) {
        throw new Error("AGORA_APP_ID not configured");
      }

      // For testing without certificate, return null token
      // Client will use App ID only mode
      if (!appCertificate) {
        return {
          token: null,
          appId,
        };
      }

      // TODO: Implement proper token generation with agora-access-token package
      // For now, return null to use App ID only mode
      return {
        token: null,
        appId,
      };
    }),
});
