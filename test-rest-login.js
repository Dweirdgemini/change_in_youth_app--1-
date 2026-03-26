/**
 * Test the REST login endpoint directly
 * Run with: node test-rest-login.js
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'https://changeinyouthapp-1-production.up.railway.app';

async function testRestLogin() {
  try {
    console.log('🧪 Testing REST login endpoint...');
    console.log(`   URL: ${API_BASE_URL}/api/auth/login`);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log(`   Response body:`, text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('   ✅ REST Login API is working!');
      console.log('   Response data:', data);
    } else {
      console.log('   ❌ REST Login API returned error:', response.status);
      try {
        const errorData = JSON.parse(text);
        console.log('   Error details:', errorData);
      } catch {
        console.log('   Raw error:', text);
      }
    }
  } catch (error) {
    console.error('   ❌ Network error:', error.message);
  }
}

async function testHealth() {
  try {
    console.log('\n🏥 Testing health endpoint...');
    const response = await fetch(`${API_BASE_URL}/api/health`);
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('   Health check failed:', error.message);
    return false;
  }
}

async function main() {
  const isHealthy = await testHealth();
  if (!isHealthy) {
    console.log('\n❌ Server is not healthy. Aborting tests.');
    return;
  }
  
  await testRestLogin();
}

main().catch(console.error);
