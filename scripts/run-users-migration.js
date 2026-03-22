import mysql from "mysql2/promise";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function runUsersMigration() {
  console.log("🚀 Running users table migration...");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not found");
    return;
  }

  console.log("📡 Connecting to database...");
  
  const pool = mysql.createPool({
    uri: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log("✅ Connected successfully");
    
    // Read users migration file
    const migrationSQL = fs.readFileSync('./drizzle/0000_elite_eternals.sql', 'utf8');
    console.log("📄 Users migration file loaded");
    
    try {
      await pool.query(migrationSQL);
      console.log("✅ Users table created successfully");
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log("⚠️  Users table already exists");
      } else {
        console.log("❌ Error creating users table:", error.message);
      }
    }
    
    // Check if users table exists now
    console.log("\n🔍 Verifying users table...");
    const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
    if (tables.length > 0) {
      console.log("✅ users table exists");
      
      // Show table structure
      const [structure] = await pool.query('DESCRIBE users');
      console.log("\n📄 users table structure:");
      structure.forEach(column => {
        console.log(`  - ${column.Field}: ${column.Type}`);
      });
    } else {
      console.log("❌ users table still does not exist");
    }
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await pool.end();
    console.log("\n🔌 Connection closed");
  }
}

runUsersMigration().catch(console.error);
