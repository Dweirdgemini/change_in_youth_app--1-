import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function debugDatabase() {
  console.log("🔍 Debugging Railway MySQL database...");
  
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
    
    // List all tables
    console.log("\n📋 Listing all tables...");
    const [tables] = await pool.query('SHOW TABLES');
    console.log("Tables in database:");
    tables.forEach((row, index) => {
      console.log(`  ${index + 1}. ${Object.values(row)[0]}`);
    });
    
    // Check if users table exists
    console.log("\n🔍 Checking users table...");
    const [usersTable] = await pool.query("SHOW TABLES LIKE 'users'");
    if (usersTable.length > 0) {
      console.log("✅ users table exists");
      
      // Show users table structure
      console.log("\n📄 users table structure:");
      const [structure] = await pool.query('DESCRIBE users');
      structure.forEach(column => {
        console.log(`  - ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      // Check if any users exist
      console.log("\n👥 Checking existing users...");
      const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`Users count: ${users[0].count}`);
      
      // Show first few users if any exist
      if (users[0].count > 0) {
        const [sampleUsers] = await pool.query('SELECT id, name, email, role FROM users LIMIT 5');
        console.log("Sample users:");
        sampleUsers.forEach(user => {
          console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });
      }
    } else {
      console.log("❌ users table does NOT exist");
      
      // Create users table manually
      console.log("\n🔧 Creating users table manually...");
      const createUsersSQL = `
        CREATE TABLE users (
          id int AUTO_INCREMENT PRIMARY KEY,
          openId varchar(255) NOT NULL,
          name varchar(255),
          email varchar(320) UNIQUE,
          role enum('super_admin','admin','finance','safeguarding','team_member','student','social_media_manager') DEFAULT 'student',
          loginMethod varchar(50) DEFAULT 'email',
          password varchar(255),
          lastSignedIn timestamp,
          createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
          updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deletedAt timestamp NULL
        );
      `;
      
      await pool.query(createUsersSQL);
      console.log("✅ users table created successfully");
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error("Error code:", error.code);
  } finally {
    await pool.end();
    console.log("\n🔌 Connection closed");
  }
}

debugDatabase().catch(console.error);
