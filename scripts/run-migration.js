import mysql from "mysql2/promise";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function runMigrations() {
  console.log("🚀 Running Railway MySQL migrations...");
  
  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not found in .env file");
    console.error("Please set DATABASE_URL in your .env file");
    console.error("Example: mysql://user:password@host:port/database");
    process.exit(1);
  }

  console.log("📡 DATABASE_URL found:", databaseUrl.replace(/\/\/.*@/, '//***:***@'));
  console.log("🔌 Connecting to Railway MySQL...");
  
  // Create connection pool with better SSL settings
  const pool = mysql.createPool({
    uri: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionLimit: 5,
    acquireTimeout: 60000,
    timeout: 60000
  });

  try {
    // Test connection with timeout
    console.log("🔍 Testing database connection...");
    const testResult = await pool.query('SELECT 1 as test');
    console.log("✅ Connected to Railway MySQL database");
    
    // Read migration file
    const migrationSQL = fs.readFileSync('./drizzle/0002_tearful_jigsaw.sql', 'utf8');
    console.log("📄 Migration file loaded");
    
    // Split by statement-breakpoint (not semicolon)
    const statements = migrationSQL.split('--> statement-breakpoint');
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      // Skip empty statements
      if (!statement) {
        console.log(`⚠️  Statement ${i + 1}: Empty - skipped`);
        skipCount++;
        continue;
      }
      
      try {
        await pool.query(statement);
        console.log(`✅ Statement ${i + 1}: Success`);
        successCount++;
      } catch (error) {
        // Check if table already exists
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_FIELDNAME' ||
            error.code === 'ER_CANT_CREATE_TABLE') {
          console.log(`⚠️  Statement ${i + 1}: Already exists - skipped`);
          skipCount++;
        } else {
          console.log(`❌ Statement ${i + 1}: Error - ${error.message}`);
          console.log(`   SQL: ${statement.substring(0, 100)}...`);
          errorCount++;
        }
      }
    }
    
    console.log("\n📊 Migration Summary:");
    console.log(`✅ Success: ${successCount} statements`);
    console.log(`⚠️  Skipped: ${skipCount} statements`);
    console.log(`❌ Errors: ${errorCount} statements`);
    console.log(`📈 Total: ${statements.length} statements`);
    
    if (errorCount === 0) {
      console.log("\n🎉 Migration completed successfully!");
    } else {
      console.log(`\n⚠️  Migration completed with ${errorCount} errors`);
    }
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("Error code:", error.code);
    
    if (error.code === 'ETIMEDOUT') {
      console.error("Connection timeout. Please check:");
      console.error("1. DATABASE_URL is correct");
      console.error("2. Railway database is running");
      console.error("3. Network connectivity");
    }
    
    throw error;
  } finally {
    await pool.end();
    console.log("🔌 Database connection closed");
  }
}

runMigrations().catch(console.error);
