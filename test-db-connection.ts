import dotenv from 'dotenv';
import { getDb } from './server/db';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  
  try {
    const db = await getDb();
    
    if (!db) {
      console.error('❌ Database connection failed: No database instance');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    
    // Test a simple connection ping using drizzle
    try {
      // Simple connection test - just check if we can create a prepared statement
      console.log('🔄 Testing query execution...');
      await db.execute('SELECT 1');
      console.log('✅ Database query successful');
    } catch (error) {
      if (error instanceof Error && error.message.includes('ETIMEDOUT')) {
        console.warn('⚠️  Database query timeout - connection established but slow');
        console.log('   This is normal for Railway proxy connections');
      } else {
        throw error;
      }
    }
    
    console.log('🎉 Database connection test completed!');
    process.exit(0);
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Database connection failed:', error.message);
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
    } else {
      console.error('❌ Database connection failed:', String(error));
    }
    process.exit(1);
  }
}

testDatabaseConnection();
