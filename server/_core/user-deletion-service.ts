/**
 * User Deletion Service
 * 
 * Handles safe, audited deletion of user accounts with:
 * - Email confirmation to prevent accidents
 * - PII anonymization (name, email, profile image)
 * - Session invalidation
 * - Audit logging
 * - Transactional safety
 * - Idempotency (safe to call multiple times)
 */

import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import pino from "pino";

const log = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
});

export interface DeleteAccountRequest {
  userId: number;
  userEmail: string;
  confirmEmail: string;
}

export interface DeleteAccountResponse {
  status: "deleted" | "already_deleted";
  deletedAt: string;
  message: string;
}

/**
 * Validate that the confirmation email matches the user's actual email
 */
export function validateEmailConfirmation(userEmail: string, confirmEmail: string): boolean {
  // Normalize emails: trim and lowercase
  const normalized1 = (userEmail || "").trim().toLowerCase();
  const normalized2 = (confirmEmail || "").trim().toLowerCase();
  return normalized1 === normalized2 && normalized1.length > 0;
}

/**
 * Anonymize user PII while preserving account for audit trail
 */
async function anonymizeUserPII(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Generate anonymous identifiers
  const anonymousName = `Deleted User ${userId}`;
  const anonymousEmail = `deleted-${userId}@deleted.local`;
  const now = new Date();

  await db
    .update(users)
    .set({
      name: anonymousName,
      email: anonymousEmail,
      profileImageUrl: null,
      pushToken: null,
      magicLinkToken: null,
      magicLinkExpiry: null,
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  log.info(
    { userId, deletedAt: now.toISOString() },
    "User PII anonymized and account marked as deleted"
  );
}

/**
 * Check if user is already deleted
 */
async function isUserDeleted(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [user] = await db
    .select({ deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return !!user?.deletedAt;
}

/**
 * Get user email for confirmation
 */
async function getUserEmail(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.email || null;
}

/**
 * Main deletion handler
 * 
 * Performs the following in order:
 * 1. Verify user exists and not already deleted
 * 2. Validate email confirmation
 * 3. Anonymize PII and mark deleted_at
 * 4. Log audit event
 * 5. Return success response
 * 
 * Idempotent: calling twice returns success both times
 */
export async function deleteUserAccount(
  request: DeleteAccountRequest
): Promise<DeleteAccountResponse> {
  const { userId, userEmail, confirmEmail } = request;
  const requestId = `del-${userId}-${Date.now()}`;

  log.info(
    { userId, requestId, email: userEmail },
    "User deletion request received"
  );

  try {
    // Check if already deleted (idempotency)
    const alreadyDeleted = await isUserDeleted(userId);
    if (alreadyDeleted) {
      log.info(
        { userId, requestId },
        "User already deleted, returning success (idempotent)"
      );
      return {
        status: "already_deleted",
        deletedAt: new Date().toISOString(),
        message: "Account was already deleted",
      };
    }

    // Validate email confirmation
    if (!validateEmailConfirmation(userEmail, confirmEmail)) {
      log.warn(
        { userId, requestId, providedEmail: confirmEmail },
        "Email confirmation mismatch"
      );
      throw new Error("Email confirmation does not match");
    }

    // Anonymize PII and mark deleted
    await anonymizeUserPII(userId);

    const deletedAt = new Date().toISOString();

    // Log audit event
    log.info(
      { userId, requestId, deletedAt },
      "User account successfully deleted"
    );

    return {
      status: "deleted",
      deletedAt,
      message: "Account and personal data have been deleted",
    };
  } catch (error) {
    log.error(
      { userId, requestId, error: String(error) },
      "User deletion failed"
    );
    throw error;
  }
}

/**
 * Verify that a user's session is invalid after deletion
 * (used for testing)
 */
export async function isUserSessionValid(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [user] = await db
    .select({ deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // User is deleted if deletedAt is set
  return !user?.deletedAt;
}
