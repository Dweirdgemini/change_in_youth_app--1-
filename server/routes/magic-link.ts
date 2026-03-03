import type { Express, Request, Response } from "express";
import { MagicLinkService } from "../_core/magic-link-service";
import { RateLimiter } from "../_core/rate-limiter";
import { getUserByEmail, upsertUser } from "../db";
import { sdk } from "../_core/sdk";

/**
 * Email Magic Link Routes
 * 
 * POST /api/auth/magic-link - Request a magic link
 * POST /api/auth/verify-link - Verify token and issue session
 */

// Email validation regex (simplified RFC 5322)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

function getClientIp(req: Request): string {
  // Support proxies (X-Forwarded-For header)
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

export function registerMagicLinkRoutes(app: Express) {
  /**
   * POST /api/auth/magic-link
   * Request a magic link for email
   * 
   * Body: { email: string }
   * Response: { success: true, message: string, expiresIn: number }
   */
  app.post("/api/auth/magic-link", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const clientIp = getClientIp(req);

      console.log(`[MagicLink] Request from ${clientIp} for email: ${email}`);

      // Validate email
      if (!email || !validateEmail(email)) {
        console.warn(`[MagicLink] Invalid email format: ${email}`);
        return res.status(400).json({
          error: "Invalid email format",
          code: "INVALID_EMAIL",
        });
      }

      // Check rate limits
      const rateLimitCheck = RateLimiter.checkLimit(email, clientIp);
      if (!rateLimitCheck.allowed) {
        console.warn(`[MagicLink] Rate limit exceeded for ${email}: ${rateLimitCheck.reason}`);
        return res.status(429).json({
          error: rateLimitCheck.reason || "Too many requests",
          code: "RATE_LIMITED",
          retryAfter: rateLimitCheck.retryAfter,
        });
      }

      // Generate token
      const { plainToken, hashedToken } = MagicLinkService.generateToken();

      // Store token in database
      await MagicLinkService.storeToken(email, hashedToken);

      // Send email with magic link
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      const magicLinkUrl = `manus20240115103045://auth/magic-link?token=${plainToken}`;
      console.log(`[MagicLink] Magic link generated for ${email}: ${magicLinkUrl}`);

      // In production, send email here
      // await emailService.sendMagicLink(email, magicLinkUrl);

      const expirySeconds = MagicLinkService.getExpirySeconds();

      res.status(200).json({
        success: true,
        message: "Check your email for the login link",
        expiresIn: expirySeconds,
      });
    } catch (error) {
      console.error("[MagicLink] Error in /magic-link route:", error);
      res.status(500).json({
        error: "Failed to send magic link",
        code: "INTERNAL_ERROR",
      });
    }
  });

  /**
   * POST /api/auth/verify-link
   * Verify magic link token and issue session token
   * 
   * Body: { token: string }
   * Response: { success: true, sessionToken: string, user: { id, email, name, loginMethod } }
   */
  app.post("/api/auth/verify-link", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      console.log("[MagicLink] Verifying token...");

      // Verify token
      const verifyResult = await MagicLinkService.verifyToken(token);

      if (!verifyResult.valid) {
        console.warn(`[MagicLink] Token verification failed: ${verifyResult.errorCode}`);
        return res.status(401).json({
          error: verifyResult.error || "Invalid token",
          code: verifyResult.errorCode || "LINK_INVALID",
        });
      }

      const email = verifyResult.email;
      if (!email) {
        console.error("[MagicLink] Email missing from verification result");
        return res.status(500).json({
          error: "Verification failed",
          code: "INTERNAL_ERROR",
        });
      }

      // Get or create user
      let user = await getUserByEmail(email);

      if (!user) {
        // Create new user
        console.log(`[MagicLink] Creating new user for ${email}`);
        const newUser = await upsertUser({
          email,
          name: null,
          openId: null, // Magic link users don't have openId
          loginMethod: "magic_link",
        });
        user = newUser;
      } else {
        // Update existing user's login method
        if (user.loginMethod !== "magic_link") {
          console.log(`[MagicLink] Updating login method for ${email} to magic_link`);
          await upsertUser({
            ...user,
            loginMethod: "magic_link",
          });
        }
      }

      // Invalidate token (single-use enforcement)
      await MagicLinkService.invalidateToken(email);

      // Issue session token (same format as OAuth)
      const sessionToken = sdk.createSessionToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        loginMethod: "magic_link",
      });

      console.log(`[MagicLink] Session token issued for ${email}`);

      res.status(200).json({
        success: true,
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          loginMethod: "magic_link",
        },
      });
    } catch (error) {
      console.error("[MagicLink] Error in /verify-link route:", error);
      res.status(500).json({
        error: "Verification failed",
        code: "INTERNAL_ERROR",
      });
    }
  });

  console.log("[MagicLink] Routes registered: POST /api/auth/magic-link, POST /api/auth/verify-link");
}
