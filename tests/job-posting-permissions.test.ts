import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Job Posting Permissions", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const result = await db.insert(users).values({
      openId: "test_job_poster_" + Date.now(),
      name: "Test Job Poster",
      email: "test@example.com",
      role: "team_member",
      loginMethod: "email",
      canPostJobs: true,
    });
    testUserId = Number(result[0].insertId);
  });

  afterAll(async () => {
    if (!db) return;
    // Clean up test user
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should have canPostJobs field in users table", async () => {
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(users).where(eq(users.id, testUserId));

    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("canPostJobs");
    expect(result[0].canPostJobs).toBe(true);
  });

  it("should allow updating canPostJobs permission", async () => {
    if (!db) throw new Error("Database not available");

    // Update to false
    await db.update(users).set({ canPostJobs: false }).where(eq(users.id, testUserId));

    const result = await db.select().from(users).where(eq(users.id, testUserId));

    expect(result[0].canPostJobs).toBe(false);

    // Update back to true
    await db.update(users).set({ canPostJobs: true }).where(eq(users.id, testUserId));
  });

  it("should default canPostJobs to false for new users", async () => {
    if (!db) throw new Error("Database not available");

    const result = await db.insert(users).values({
      openId: "test_default_user_" + Date.now(),
      name: "Default User",
      email: "default@example.com",
      role: "team_member",
      loginMethod: "email",
    });

    const userId = Number(result[0].insertId);

    const user = await db.select().from(users).where(eq(users.id, userId));

    expect(user[0].canPostJobs).toBe(false);

    // Clean up
    await db.delete(users).where(eq(users.id, userId));
  });
});
