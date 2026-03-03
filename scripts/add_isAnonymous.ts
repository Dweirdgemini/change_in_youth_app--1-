import mysql from "mysql2/promise";

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await connection.query(`
      ALTER TABLE surveys 
      ADD COLUMN IF NOT EXISTS isAnonymous BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log("✓ Added isAnonymous column to surveys table");
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("✓ isAnonymous column already exists");
    } else {
      throw error;
    }
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
