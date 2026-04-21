/**
 * Email/Password Authentication Service
 * 
 * Handles user registration, login, and password management
 * using bcrypt for hashing and JWT for tokens
 */

import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { ONE_YEAR_MS } from "../../shared/const";

// JWT secret from environment
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "admin" | "finance" | "safeguarding" | "team_member" | "student" | "social_media_manager";
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: number;
    openId: string;
    name: string | null;
    email: string | null;
    role: string;
    loginMethod: string;
    lastSignedIn: string;
  };
  sessionToken?: string;
  error?: string;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for user session
 */
export async function generateSessionToken(userId: number, email: string, openId: string, name: string): Promise<string> {
  const payload = {
    userId,
    email,
    openId, // Include actual database openId
    name, // Include user name
    loginMethod: "email",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (ONE_YEAR_MS / 1000),
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + ONE_YEAR_MS))
    .sign(JWT_SECRET);
}

/**
 * Verify JWT token and return payload
 */
export async function verifySessionToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error("[Auth Service] Token verification failed:", error);
    throw new Error("Invalid or expired session token");
  }
}
console.log("about to verify password")
/**
 * Authenticate user with email and password
 */
export async function authenticateUser(credentials: LoginRequest): Promise<AuthResponse> {
  const { email, password } = credentials;

  if (!email || !password) {
    return {
      success: false,
      error: "Email and password are required"
    };
  }

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    // Find user by email (case-insensitive)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: "Invalid email or password"
      };
    }

    // Check if user has password set
    if (!user.password) {
      return {
        success: false,
        error: "Account uses OAuth login. Please sign in with OAuth."
      };
    }
      console.log("about to verify password")
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Invalid email or password"
      };
    }
    console.log("about to verify password")
    // Generate session token
    const sessionToken = await generateSessionToken(user.id, user.email || "", user.openId, user.name || "");

    // Update last sign in
    await db
      .update(users)
      .set({ 
        lastSignedIn: new Date(),
        loginMethod: "email"
      })
      .where(eq(users.id, user.id));

    const userResponse = {
      id: user.id,
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
      loginMethod: "email",
      lastSignedIn: new Date().toISOString()
    };
    console.log("userResponse:"+userResponse)
    return {
      success: true,
      user: userResponse,
      sessionToken
    };

  } catch (error) {
    console.error("[Auth Service] Authentication error:", error);
    return {
      success: false,
      error: "Authentication failed. Please try again."
    };
  }
}

/**
 * Register new user with email and password
 */
export async function registerUser(userData: RegisterRequest): Promise<AuthResponse> {
  const { name, email, password, role } = userData;

  if (!name || !email || !password || !role) {
    return {
      success: false,
      error: "All fields are required"
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Invalid email address"
    };
  }

  // Basic password validation
  if (password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long"
    };
  }

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    // Check if email already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return {
        success: false,
        error: "Email already registered"
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        loginMethod: "email",
        openId: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique openId
        lastSignedIn: new Date()
      });

    // Get the newly created user
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Generate session token
    const sessionToken = await generateSessionToken(newUser.id, email, newUser.openId, newUser.name || "");

    const userResponse = {
      id: newUser.id,
      openId: newUser.openId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      loginMethod: "email",
      lastSignedIn: new Date().toISOString()
    };

    return {
      success: true,
      user: userResponse,
      sessionToken
    };

  } catch (error) {
    console.error("[RegisterUser] Actual error:", error);
    throw error;
  }
}

/**
 * Get user by session token (for middleware)
 */
export async function getUserBySessionToken(token: string): Promise<any> {
  try {
    const payload = await verifySessionToken(token);
    
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || user.deletedAt) {
      throw new Error("User not found or deleted");
    }

    return user;
  } catch (error) {
    console.error("[Auth Service] Get user by token error:", error);
    throw new Error("Invalid session token");
  }
}
