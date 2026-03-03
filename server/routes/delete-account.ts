/**
 * Delete Account REST API Route
 * 
 * Endpoint: DELETE /api/v1/users/me
 * 
 * Requires:
 * - Bearer token authentication
 * - Request body with email confirmation
 * 
 * Returns:
 * - 200: Account deleted successfully
 * - 400: Email confirmation mismatch or invalid request
 * - 401: Unauthorized (missing/invalid token)
 * - 429: Rate limit exceeded
 * - 500: Server error
 */

import type { Request, Response } from "express";
import { deleteUserAccount, validateEmailConfirmation } from "../_core/user-deletion-service";
import { sdk } from "../_core/sdk";
import pino from "pino";

const log = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
});

/**
 * DELETE /api/v1/users/me
 * 
 * Delete the authenticated user's account and personal data.
 * 
 * Request body:
 * {
 *   "confirmEmail": "user@example.com"
 * }
 * 
 * Response (200):
 * {
 *   "status": "deleted",
 *   "deletedAt": "2026-02-24T15:00:00.000Z",
 *   "message": "Account and personal data have been deleted"
 * }
 */
export async function handleDeleteAccount(req: Request, res: Response): Promise<void> {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Authenticate the request
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch (error) {
      log.warn({ requestId }, "Unauthenticated delete request");
      res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to delete your account",
      });
      return;
    }

    if (!user) {
      log.warn({ requestId }, "No user in authenticated context");
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication failed",
      });
      return;
    }

    // Validate request body
    const { confirmEmail } = req.body;

    if (!confirmEmail || typeof confirmEmail !== "string") {
      log.warn({ userId: user.id, requestId }, "Missing or invalid confirmEmail");
      res.status(400).json({
        error: "Bad Request",
        message: "confirmEmail is required and must be a string",
      });
      return;
    }

    log.info(
      { userId: user.id, requestId, email: user.email },
      "Processing account deletion request"
    );

    // Call deletion service
    const result = await deleteUserAccount({
      userId: user.id,
      userEmail: user.email || "",
      confirmEmail,
    });

    log.info(
      { userId: user.id, requestId, status: result.status },
      "Account deletion completed"
    );

    // Return success
    res.status(200).json({
      status: result.status,
      deletedAt: result.deletedAt,
      message: result.message,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Email mismatch or validation error
    if (errorMessage.includes("Email confirmation does not match")) {
      log.warn({ requestId, error: errorMessage }, "Email confirmation failed");
      res.status(400).json({
        error: "Bad Request",
        message: "Email confirmation does not match your account email",
      });
      return;
    }

    // Database or server error
    log.error({ requestId, error: errorMessage }, "Account deletion failed");
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete account. Please try again later.",
    });
  }
}

/**
 * Setup delete account routes
 */
export function setupDeleteAccountRoutes(app: any): void {
  app.delete("/api/v1/users/me", handleDeleteAccount);
  log.info("Delete account route registered: DELETE /api/v1/users/me");
}
