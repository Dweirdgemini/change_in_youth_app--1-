/**
 * Rate Limiter Service
 * Prevents abuse of magic link requests
 * 
 * Limits:
 * - 3 requests per email per hour
 * - 10 requests per IP per hour
 * 
 * Uses in-memory store (can be upgraded to Redis for distributed systems)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number; // Unix timestamp in milliseconds
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

const HOUR_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_EMAIL = 3;
const MAX_REQUESTS_PER_IP = 10;

// In-memory stores
const emailLimitStore: RateLimitStore = {};
const ipLimitStore: RateLimitStore = {};

export class RateLimiter {
  /**
   * Check if email has exceeded rate limit
   * Returns: { allowed: boolean, retryAfter?: number }
   */
  static checkEmailLimit(email: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = emailLimitStore[email];

    // First request or limit window expired
    if (!entry || now > entry.resetTime) {
      emailLimitStore[email] = {
        count: 1,
        resetTime: now + HOUR_MS,
      };
      return { allowed: true };
    }

    // Within limit
    if (entry.count < MAX_REQUESTS_PER_EMAIL) {
      entry.count++;
      return { allowed: true };
    }

    // Exceeded limit
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      retryAfter,
    };
  }

  /**
   * Check if IP has exceeded rate limit
   * Returns: { allowed: boolean, retryAfter?: number }
   */
  static checkIpLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = ipLimitStore[ip];

    // First request or limit window expired
    if (!entry || now > entry.resetTime) {
      ipLimitStore[ip] = {
        count: 1,
        resetTime: now + HOUR_MS,
      };
      return { allowed: true };
    }

    // Within limit
    if (entry.count < MAX_REQUESTS_PER_IP) {
      entry.count++;
      return { allowed: true };
    }

    // Exceeded limit
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      retryAfter,
    };
  }

  /**
   * Check both email and IP limits
   * Returns: { allowed: boolean, reason?: string, retryAfter?: number }
   */
  static checkLimit(email: string, ip: string): { allowed: boolean; reason?: string; retryAfter?: number } {
    const emailCheck = RateLimiter.checkEmailLimit(email);
    if (!emailCheck.allowed) {
      return {
        allowed: false,
        reason: "Too many requests from this email",
        retryAfter: emailCheck.retryAfter,
      };
    }

    const ipCheck = RateLimiter.checkIpLimit(ip);
    if (!ipCheck.allowed) {
      return {
        allowed: false,
        reason: "Too many requests from this IP",
        retryAfter: ipCheck.retryAfter,
      };
    }

    return { allowed: true };
  }

  /**
   * Reset limit for an email (admin use)
   */
  static resetEmailLimit(email: string): void {
    delete emailLimitStore[email];
    console.log(`[RateLimit] Reset limit for email: ${email}`);
  }

  /**
   * Reset limit for an IP (admin use)
   */
  static resetIpLimit(ip: string): void {
    delete ipLimitStore[ip];
    console.log(`[RateLimit] Reset limit for IP: ${ip}`);
  }

  /**
   * Clean up expired entries (maintenance task)
   * Should be called periodically (e.g., every hour)
   */
  static cleanup(): { emailsCleanedUp: number; ipsCleanedUp: number } {
    const now = Date.now();
    let emailsCleanedUp = 0;
    let ipsCleanedUp = 0;

    // Clean up email limits
    for (const [email, entry] of Object.entries(emailLimitStore)) {
      if (now > entry.resetTime) {
        delete emailLimitStore[email];
        emailsCleanedUp++;
      }
    }

    // Clean up IP limits
    for (const [ip, entry] of Object.entries(ipLimitStore)) {
      if (now > entry.resetTime) {
        delete ipLimitStore[ip];
        ipsCleanedUp++;
      }
    }

    if (emailsCleanedUp > 0 || ipsCleanedUp > 0) {
      console.log(`[RateLimit] Cleanup: ${emailsCleanedUp} emails, ${ipsCleanedUp} IPs`);
    }

    return { emailsCleanedUp, ipsCleanedUp };
  }

  /**
   * Get current stats (for monitoring)
   */
  static getStats(): {
    activeEmailLimits: number;
    activeIpLimits: number;
  } {
    return {
      activeEmailLimits: Object.keys(emailLimitStore).length,
      activeIpLimits: Object.keys(ipLimitStore).length,
    };
  }
}
