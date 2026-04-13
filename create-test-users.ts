/**
 * Create Test Users for Authentication Testing
 * Run with: npx tsx create-test-users.ts
 */

import dotenv from 'dotenv';
import { getDb } from './server/db';
import { users } from './drizzle/schema';
import { hashPassword } from './server/_core/auth-service';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

interface TestUser {
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "admin" | "finance" | "safeguarding" | "team_member" | "student" | "social_media_manager";
  loginMethod: string;
}

const testUsers: TestUser[] = [
  {
    name: "Auth Test Student",
    email: "test-auth-student@example.com",
    password: "testpassword123",
    role: "student",
    loginMethod: "email"
  },
  {
    name: "Auth Test Admin",
    email: "test-auth-admin@example.com", 
    password: "testpassword123",
    role: "admin",
    loginMethod: "email"
  },
  {
    name: "Auth Test Finance",
    email: "test-auth-finance@example.com",
    password: "testpassword123", 
    role: "finance",
    loginMethod: "email"
  }
];

async function createTestUsers() {
  console.log("=== Creating Test Users for Auth Testing ===");
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database connection failed");
      process.exit(1);
    }

    console.log(`\nCreating ${testUsers.length} test users...`);

    for (const testUser of testUsers) {
      try {
        // Check if user already exists
        const existing = await db.select().from(users).where(eq(users.email, testUser.email)).limit(1);
        
        if (existing.length > 0) {
          console.log(`\n${testUser.email}: ALREADY EXISTS - skipping`);
          continue;
        }

        // Hash password
        const hashedPassword = await hashPassword(testUser.password);
        
        // Create user and get the insert result
        await db.insert(users).values({
          name: testUser.name,
          email: testUser.email,
          password: hashedPassword,
          role: testUser.role,
          loginMethod: testUser.loginMethod,
          openId: `email-${Date.now()}-${testUser.email}`,
          lastSignedIn: new Date(),
        });

        // Fetch the created user by email to get full details
        const [newUser] = await db.select().from(users).where(eq(users.email, testUser.email)).limit(1);

        console.log(`\n${testUser.email}: CREATED`);
        console.log(`  ID: ${newUser.id}`);
        console.log(`  Role: ${newUser.role}`);
        console.log(`  Password: ${testUser.password}`);

      } catch (error) {
        console.error(`\n${testUser.email}: FAILED - ${error}`);
      }
    }

    console.log("\n=== Test User Creation Complete ===");
    console.log("\nYou can now test with these credentials:");
    testUsers.forEach(user => {
      console.log(`\n${user.email} / ${user.password} (${user.role})`);
    });

  } catch (error) {
    console.error("Failed to create test users:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  createTestUsers();
}
