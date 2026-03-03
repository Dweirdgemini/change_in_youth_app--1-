import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

async function createAvailabilityTable() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  try {
    console.log('Creating staff_availability table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS staff_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        date TIMESTAMP NOT NULL,
        isAvailable BOOLEAN DEFAULT TRUE NOT NULL,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        UNIQUE KEY unique_user_date (userId, date),
        INDEX idx_user_id (userId),
        INDEX idx_date (date)
      )
    `);
    console.log('✓ staff_availability table created successfully');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✓ staff_availability table already exists');
    } else {
      console.error('Error:', error.message);
      throw error;
    }
  }
}

createAvailabilityTable().catch(console.error);
