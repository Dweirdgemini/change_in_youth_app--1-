/**
 * Authentication Router - Email/Password Login & Registration
 * 
 * Provides tRPC endpoints for:
 * - POST /auth/login - Email/password authentication
 * - POST /auth/register - User registration
 * - POST /auth/logout - Session termination
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authenticateUser, registerUser, getUserBySessionToken } from "../_core/auth-service";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router, t } from "../_core/trpc";

// Zod schemas for input validation
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["super_admin", "admin", "finance", "safeguarding", "team_member", "student", "social_media_manager"]),
});

export const authRouter = router({
  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;
      
      console.log("[Auth Router] Login attempt:", { email: email.toLowerCase() });
      
      const result = await authenticateUser({ email, password });
      
      if (!result.success) {
        console.log("[Auth Router] Login failed:", result.error);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: result.error || "Login failed",
        });
      }
      
      console.log("[Auth Router] Login successful:", { 
        userId: result.user?.id, 
        email: result.user?.email 
      });
      
      return {
        success: true,
        user: result.user,
        sessionToken: result.sessionToken,
      };
    }),

  /**
   * Register new user
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const { name, email, password, role } = input;
      
      console.log("[Auth Router] Registration attempt:", { 
        name, 
        email: email.toLowerCase(), 
        role 
      });
      
      const result = await registerUser({ name, email, password, role });
      
      if (!result.success) {
        console.log("[Auth Router] Registration failed:", result.error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error instanceof Error ? 
            result.error.message : "Registration failed: " + 
            JSON.stringify(result.error)
        });
      }
      
      console.log("[Auth Router] Registration successful:", { 
        userId: result.user?.id, 
        email: result.user?.email 
      });
      
      // Set session cookie for web
      if (result.sessionToken && ctx.res) {
        ctx.res.cookie(COOKIE_NAME, result.sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        });
      }
      
      return {
        success: true,
        user: result.user,
        sessionToken: result.sessionToken,
      };
    }),

  /**
   * Logout user
   */
  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      console.log("[Auth Router] Logout attempt");
      
      // Clear session cookie
      if (ctx.res) {
        ctx.res.clearCookie(COOKIE_NAME, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: -1,
        });
      }
      
      console.log("[Auth Router] Logout successful");
      
      return { success: true };
    }),

  /**
   * Get current authenticated user
   */
  me: publicProcedure
    .query(async ({ ctx }) => {
      try {
        // For web: use cookie, for mobile: use Authorization header
        let token: string | null = null;
        
        if (ctx.req) {
          // Web: try cookie first
          const cookieHeader = ctx.req.headers.cookie;
          if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie) => {
              const [key, value] = cookie.trim().split('=');
              acc[key] = value;
              return acc;
            }, {});
            token = cookies[COOKIE_NAME] || null;
          }
          
          // Mobile: try Authorization header
          if (!token && ctx.req.headers.authorization) {
            const authHeader = ctx.req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
              token = authHeader.slice(7).trim();
            }
          }
        }
        
        if (!token) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "No session token found",
          });
        }
        
        const user = await getUserBySessionToken(token);
        
        console.log("[Auth Router] Current user:", { 
          userId: user.id, 
          email: user.email 
        });
        
        return {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          role: user.role,
          loginMethod: user.loginMethod,
          lastSignedIn: user.lastSignedIn?.toISOString() || new Date().toISOString(),
        };
      } catch (error) {
        console.log("[Auth Router] Get current user failed:", error);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }
    }),
});
