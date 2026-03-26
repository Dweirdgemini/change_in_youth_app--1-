import { describe, expect, it, vi, beforeEach } from "vitest";
import { authenticateUser, hashPassword, verifyPassword, generateSessionToken } from "../server/_core/auth-service";

// Mock the database module
vi.mock("../server/db", () => ({
  getDb: vi.fn(),
}));

// Mock the users schema
vi.mock("../drizzle/schema", () => ({
  users: {
    id: 1,
    email: "test@example.com",
    password: "$2b$12$hashedpassword",
    name: "Test User",
    role: "student",
    loginMethod: "email",
    openId: "test-open-id",
    lastSignedIn: new Date(),
    deletedAt: null,
  },
}));

describe("Authentication Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password correctly", async () => {
      const password = "testpassword123";
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword.startsWith("$2b$12$")).toBe(true);
    });

    it("should generate different hashes for the same password", async () => {
      const password = "testpassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "testpassword123";
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testpassword123";
      const wrongPassword = "wrongpassword";
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe("generateSessionToken", () => {
    it("should generate a valid JWT token", async () => {
      const userId = 123;
      const email = "test@example.com";
      
      const token = await generateSessionToken(userId, email);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should generate different tokens for different users", async () => {
      const token1 = await generateSessionToken(1, "user1@example.com");
      const token2 = await generateSessionToken(2, "user2@example.com");
      
      expect(token1).not.toBe(token2);
    });
  });

  describe("authenticateUser", () => {
    it("should reject missing email and password", async () => {
      const result = await authenticateUser({ email: "", password: "" });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
    });

    it("should reject missing email", async () => {
      const result = await authenticateUser({ email: "", password: "password123" });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
    });

    it("should reject missing password", async () => {
      const result = await authenticateUser({ email: "test@example.com", password: "" });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
    });
  });
});
