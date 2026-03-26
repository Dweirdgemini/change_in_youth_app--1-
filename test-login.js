/**
 * Quick test script to verify API client works
 * Run with: node test-login.js
 */

const fetch = require('node-fetch');

// Production Railway URL
const API_BASE_URL = 'https://changeinyouthapp-1-production.up.railway.app';

async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    const response = await fetch(`${API_BASE_URL}/api/health`);
    console.log('Health status:', response.status);
    const data = await response.json();
    console.log('Health response:', data);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

async function testLogin() {
  try {
    console.log('Testing tRPC login endpoint...');
    
    const response = await fetch(`${API_BASE_URL}/api/trpc/auth.login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          email: 'test@example.com',
          password: 'testpassword123'
        },
        meta: {}
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ tRPC Login API is working!');
      console.log('Response data:', data);
    } else {
      console.log('❌ tRPC Login API returned error:', response.status);
      try {
        const errorData = JSON.parse(text);
        console.log('Error details:', errorData);
      } catch {
        console.log('Raw error:', text);
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function main() {
  const isHealthy = await testHealth();
  if (isHealthy) {
    await testLogin();
  } else {
    console.log('❌ Server is not responding. Check the Railway deployment status.');
    console.log('The tRPC endpoints should be available on the production server.');
  }
}

main();
