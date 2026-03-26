/**
 * REST API endpoints for email/password authentication
 * Complements the existing OAuth and magic link authentication
 */

import { Request, Response } from "express";
import { authenticateUser, registerUser } from "../_core/auth-service";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import pino from "pino";

const log = pino();

export function registerAuthRestRoutes(app: any) {
  /**
   * Email/password login
   * POST /api/auth/login
   * Body: { email: string, password: string }
   * Response: { success: boolean, user?: User, sessionToken?: string, error?: string }
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      log.info({ email: email?.toLowerCase() }, "REST login attempt");

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required"
        });
      }

      const result = await authenticateUser({ email, password });

      if (!result.success) {
        log.warn({ email: email.toLowerCase(), error: result.error }, "REST login failed");
        return res.status(401).json({
          success: false,
          error: result.error || "Login failed"
        });
      }

      log.info({ userId: result.user?.id, email: result.user?.email }, "REST login successful");

      // Set session cookie for web
      if (result.sessionToken) {
        res.cookie(COOKIE_NAME, result.sessionToken, {
          ...getSessionCookieOptions(req),
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        });
      }

      return res.json({
        success: true,
        user: result.user,
        sessionToken: result.sessionToken
      });

    } catch (error) {
      log.error({ error }, "REST login error");
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });

  /**
   * User registration
   * POST /api/auth/register
   * Body: { name: string, email: string, password: string, role: string }
   * Response: { success: boolean, user?: User, sessionToken?: string, error?: string }
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;

      log.info({ name, email: email?.toLowerCase(), role }, "REST registration attempt");

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          error: "All fields are required"
        });
      }

      const result = await registerUser({ name, email, password, role });

      if (!result.success) {
        log.warn({ email: email.toLowerCase(), error: result.error }, "REST registration failed");
        return res.status(400).json({
          success: false,
          error: result.error || "Registration failed"
        });
      }

      log.info({ userId: result.user?.id, email: result.user?.email }, "REST registration successful");

      // Set session cookie for web
      if (result.sessionToken) {
        res.cookie(COOKIE_NAME, result.sessionToken, {
          ...getSessionCookieOptions(req),
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        });
      }

      return res.json({
        success: true,
        user: result.user,
        sessionToken: result.sessionToken
      });

    } catch (error) {
      log.error({ error }, "REST registration error");
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });
}
