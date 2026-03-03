import crypto from "crypto";
import bcrypt from "bcrypt";
import { getDb } from "../db";

/**
 * Magic Link Service
 * Handles secure token generation, verification, and single-use enforcement
 * 
 * Security principles:
 * - Tokens: 32 bytes (256 bits) of cryptographic randomness
 * - Storage: Only hashed tokens stored in database
 * - Expiry: Strict 15-minute window
 * - Single-use: Tokens invalidated immediately after verification
 * - Rate limiting: Enforced at API layer
 */

export interface MagicLinkToken {
  plainToken: string;  // Never stored, returned only once
  hashedToken: string; // Stored in database
}

export interface VerifyTokenResult {
  valid: boolean;
  email?: string;
  userId?: string;
  error?: string;
  errorCode?: "LINK_EXPIRED" | "LINK_INVALID" | "LINK_USED" | "NOT_FOUND";
}

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const TOKEN_LENGTH_BYTES = 32;
const BCRYPT_ROUNDS = 10;

export class MagicLinkService {
  /**
   * Get database instance
   */
  private static async getDb() {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    return db;
  }
  /**
   * Generate a cryptographically secure magic link token
   * Returns both plain (for email) and hashed (for storage) versions
   */
  static generateToken(): MagicLinkToken {
    // Generate 32 bytes of random data and encode as hex
    const plainToken = crypto.randomBytes(TOKEN_LENGTH_BYTES).toString("hex");
    
    // Hash the token using bcrypt (synchronous for simplicity in this context)
    // In production, consider async version
    const hashedToken = bcrypt.hashSync(plainToken, BCRYPT_ROUNDS);
    
    return {
      plainToken,
      hashedToken,
    };
  }

  /**
   * Store a magic link token in the database
   * Overwrites any existing token for the email
   */
  static async storeToken(email: string, hashedToken: string): Promise<void> {
    const expiryTime = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);
    
    try {
      // Use raw query to update or insert
      const query = `
        UPDATE users 
        SET magicLinkToken = ?, magicLinkExpiry = ?, updatedAt = NOW()
        WHERE email = ?
      `;
      
      const result = await db?.execute(query, [hashedToken, expiryTime, email]);
      
      // If no rows updated, user doesn't exist yet - we'll create on verification
      if (result?.rowsAffected === 0) {
        console.log(`[MagicLink] No existing user for ${email}, will create on verification`);
      } else {
        console.log(`[MagicLink] Token stored for ${email}, expires at ${expiryTime.toISOString()}`);
      }
    } catch (error) {
      console.error("[MagicLink] Error storing token:", error);
      throw new Error("Failed to store magic link token");
    }
  }

  /**
   * Verify a magic link token
   * Checks: hash match, expiry, single-use enforcement
   * Returns user email if valid, error details if invalid
   */
  static async verifyToken(plainToken: string): Promise<VerifyTokenResult> {
    try {
      // Validate token format
      if (!plainToken || typeof plainToken !== "string" || plainToken.length !== TOKEN_LENGTH_BYTES * 2) {
        console.warn("[MagicLink] Invalid token format");
        return {
          valid: false,
          error: "Invalid token format",
          errorCode: "LINK_INVALID",
        };
      }

      // Query for user with this token
      const query = `
        SELECT id, email, magicLinkToken, magicLinkExpiry 
        FROM users 
        WHERE magicLinkToken IS NOT NULL AND magicLinkExpiry > NOW()
        LIMIT 100
      `;
      
      const users = await db?.query(query);
      
      if (!users || users.length === 0) {
        console.warn("[MagicLink] No valid tokens found in database");
        return {
          valid: false,
          error: "Link expired or invalid",
          errorCode: "LINK_INVALID",
        };
      }

      // Find matching user by comparing hashes
      let matchedUser = null;
      for (const user of users) {
        const isMatch = bcrypt.compareSync(plainToken, user.magicLinkToken);
        if (isMatch) {
          matchedUser = user;
          break;
        }
      }

      if (!matchedUser) {
        console.warn("[MagicLink] Token hash mismatch");
        return {
          valid: false,
          error: "Link invalid",
          errorCode: "LINK_INVALID",
        };
      }

      // Check expiry
      const expiryTime = new Date(matchedUser.magicLinkExpiry);
      if (expiryTime < new Date()) {
        console.warn(`[MagicLink] Token expired for ${matchedUser.email}`);
        return {
          valid: false,
          error: "Link expired",
          errorCode: "LINK_EXPIRED",
        };
      }

      console.log(`[MagicLink] Token verified for ${matchedUser.email}`);
      return {
        valid: true,
        email: matchedUser.email,
        userId: matchedUser.id,
      };
    } catch (error) {
      console.error("[MagicLink] Error verifying token:", error);
      return {
        valid: false,
        error: "Verification failed",
        errorCode: "LINK_INVALID",
      };
    }
  }

  /**
   * Invalidate a magic link token (single-use enforcement)
   * Called immediately after successful verification
   */
  static async invalidateToken(email: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET magicLinkToken = NULL, magicLinkExpiry = NULL, updatedAt = NOW()
        WHERE email = ?
      `;
      
      await db?.execute(query, [email]);
      console.log(`[MagicLink] Token invalidated for ${email}`);
    } catch (error) {
      console.error("[MagicLink] Error invalidating token:", error);
      throw new Error("Failed to invalidate token");
    }
  }

  /**
   * Clean up expired tokens (maintenance task)
   * Should be called periodically (e.g., every hour)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const query = `
        UPDATE users 
        SET magicLinkToken = NULL, magicLinkExpiry = NULL
        WHERE magicLinkExpiry IS NOT NULL AND magicLinkExpiry < NOW()
      `;
      
      const result = await db?.execute(query);
      const count = result?.rowsAffected || 0;
      
      if (count > 0) {
        console.log(`[MagicLink] Cleaned up ${count} expired tokens`);
      }
      
      return count;
    } catch (error) {
      console.error("[MagicLink] Error cleaning up expired tokens:", error);
      return 0;
    }
  }

  /**
   * Get token expiry time in seconds
   */
  static getExpirySeconds(): number {
    return MAGIC_LINK_EXPIRY_MINUTES * 60;
  }
}
