/**
 * Test Auth Context Functionality
 * Tests centralized authentication without database modifications
 * Run with: node test-auth-context.js
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001';

// Test credentials (these will work if they exist, or we'll test the flow)
const testCredentials = [
  { email: 'test-auth-student@example.com', password: 'testpassword123', role: 'student' },
  { email: 'test-auth-admin@example.com', password: 'testpassword123', role: 'admin' },
  { email: 'test-auth-finance@example.com', password: 'testpassword123', role: 'finance' }
];

async function testLogin(email, password) {
  try {
    console.log(`\n=== Testing Login: ${email} ===`);
    
    const response = await fetch(`${API_BASE_URL}/api/trpc/auth.login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: { email, password },
        meta: {}
      })
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.ok && data.result?.data?.json?.sessionToken) {
      console.log(`\nSUCCESS: Login successful for ${email}`);
      return {
        success: true,
        user: data.result.data.json.user,
        sessionToken: data.result.data.json.sessionToken
      };
    } else {
      console.log(`\nFAILED: Login failed for ${email}`);
      return { success: false, error: data };
    }

  } catch (error) {
    console.log(`\nERROR: Network error for ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testAuthMe(sessionToken) {
  try {
    console.log(`\n=== Testing Auth Me Endpoint ===`);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    return response.ok ? { success: true, user: data } : { success: false, error: data };

  } catch (error) {
    console.log(`ERROR: Auth Me failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testLogout(sessionToken) {
  try {
    console.log(`\n=== Testing Logout ===`);
    
    const response = await fetch(`${API_BASE_URL}/api/trpc/auth.logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        json: {},
        meta: {}
      })
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    return response.ok ? { success: true } : { success: false, error: data };

  } catch (error) {
    console.log(`ERROR: Logout failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('=== Auth Context Testing Suite ===');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  // Test server connectivity first
  try {
    console.log('\n=== Testing Server Connectivity ===');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`, { 
      timeout: 5000 
    });
    console.log(`Server Health: ${healthResponse.ok ? 'OK' : 'FAILED'}`);
  } catch (error) {
    console.log(`Server Health: FAILED - ${error.message}`);
    console.log('\nPlease start the backend server first: pnpm dev:server');
    return;
  }

  let successfulLogin = null;

  // Test each credential
  for (const creds of testCredentials) {
    const result = await testLogin(creds.email, creds.password);
    
    if (result.success) {
      successfulLogin = result;
      break; // Use first successful login for further tests
    }
  }

  if (!successfulLogin) {
    console.log('\n=== Summary ===');
    console.log('No successful login attempts. This could mean:');
    console.log('1. Test users do not exist in database');
    console.log('2. Backend server is not running');
    console.log('3. Database connection issues');
    console.log('\nTo proceed with testing, you can:');
    console.log('1. Start the app and test with dev mode (no login required)');
    console.log('2. Create test users manually in the database');
    console.log('3. Use existing credentials');
    return;
  }

  // Test auth context flow
  console.log('\n=== Testing Auth Context Flow ===');
  
  // Test /api/auth/me
  const meResult = await testAuthMe(successfulLogin.sessionToken);
  
  // Test logout
  const logoutResult = await testLogout(successfulLogin.sessionToken);

  // Test that token is invalidated
  console.log('\n=== Testing Token Invalidation ===');
  const meAfterLogout = await testAuthMe(successfulLogin.sessionToken);

  console.log('\n=== Test Summary ===');
  console.log(`Login: ${successfulLogin.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Auth Me: ${meResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Logout: ${logoutResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Token Invalidation: ${!meAfterLogout.success ? 'SUCCESS' : 'FAILED'}`);

  console.log('\n=== Recommendations ===');
  console.log('1. Start the frontend: pnpm dev:metro');
  console.log('2. Open http://localhost:8081 in browser');
  console.log('3. Test auth context behavior across tabs');
  console.log('4. Check network tab for duplicate API calls');
}

if (require.main === module) {
  main().catch(console.error);
}
