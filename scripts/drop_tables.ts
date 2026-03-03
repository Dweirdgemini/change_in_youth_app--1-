import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL!);

async function dropTables() {
  try {
    console.log("Dropping tables...");
    await db.execute("DROP TABLE IF EXISTS training_progress");
    await db.execute("DROP TABLE IF EXISTS job_postings");
    await db.execute("DROP TABLE IF EXISTS job_applications");
    await db.execute("DROP TABLE IF EXISTS app_analytics");
    await db.execute("DROP TABLE IF EXISTS user_sessions");
    console.log("Tables dropped successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error dropping tables:", error);
    process.exit(1);
  }
}

dropTables();
