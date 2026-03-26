import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { appRouter } from "../server/routers";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/_core/auth-service";
import type { TrpcContext } from "../server/_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.login", () => {
  let testUserId: number;
  let testOAuthUserId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable for test setup");
    }

    // Create a test user with email/password
    const hashedPassword = await hashPassword("testpassword123");
    const [testUser] = await db
      .insert(users)
      .values({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "student",
        loginMethod: "email",
        openId: `email-${Date.now()}-test`,
        lastSignedIn: new Date(),
      })
      .returning();
    
    testUserId = testUser.id;

    // Create a test user with OAuth only (no password)
    const [oauthUser] = await db
      .insert(users)
      .values({
        name: "OAuth User",
        email: "oauth@example.com",
        password: null,
        role: "student",
        loginMethod: "oauth",
        openId: `oauth-${Date.now()}-test`,
        lastSignedIn: new Date(),
      })
      .returning();
    
    testOAuthUserId = oauthUser.id;
  });

  afterEach(async () => {
    const db = await getDb();
    if (db) {
      // Clean up test users
      await db
        .delete(users)
        .where(eq(users.id, testUserId));
      
      await db
        .delete(users)
        .where(eq(users.id, testOAuthUserId));
    }
  });

  it("should login successfully with valid credentials", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: "test@example.com",
      password: "testpassword123",
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe("test@example.com");
    expect(result.user?.name).toBe("Test User");
    expect(result.user?.role).toBe("student");
    expect(result.user?.loginMethod).toBe("email");
    expect(result.sessionToken).toBeDefined();
    expect(typeof result.sessionToken).toBe("string");
  });

  it("should fail with invalid email", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "nonexistent@example.com",
        password: "testpassword123",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should fail with invalid password", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "test@example.com",
        password: "wrongpassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should fail with malformed email", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "invalid-email",
        password: "testpassword123",
      })
    ).rejects.toThrow("Invalid email address");
  });

  it("should fail with password too short", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "test@example.com",
        password: "123",
      })
    ).rejects.toThrow("Password must be at least 8 characters");
  });

  it("should fail for OAuth-only accounts", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "oauth@example.com",
        password: "anypassword",
      })
    ).rejects.toThrow("Account uses OAuth login. Please sign in with OAuth.");
  });

  it("handle case-insensitive email login", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: "TEST@EXAMPLE.COM",
      password: "testpassword123",
    });

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe("test@example.com");
  });

  it("should update lastSignedIn timestamp on successful login", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Get initial timestamp
    const db = await getDb();
    const [userBefore] = await db
      .select({ lastSignedIn: users.lastSignedIn })
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Login
    await caller.auth.login({
      email: "test@example.com",
      password: "testpassword123",
    });

    // Check updated timestamp
    const [userAfter] = await db
      .select({ lastSignedIn: users.lastSignedIn })
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(userAfter.lastSignedIn?.getTime()).toBeGreaterThan(
      userBefore.lastSignedIn?.getTime() || 0
    );
  });
});
