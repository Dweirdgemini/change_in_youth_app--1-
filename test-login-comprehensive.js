/**
 * Comprehensive login test script
 * Tests various scenarios against the live API
 * Run with: node test-login-comprehensive.js
 */

const fetch = require('node-fetch');

// Production Railway URL
const API_BASE_URL = 'https://changeinyouthapp-1-production.up.railway.app';

async function makeLoginRequest(email, password) {
  try {
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

    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 'network_error',
      ok: false,
      data: { error: error.message }
    };
  }
}

async function testScenario(name, email, password, expectedStatus = 401) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  
  const result = await makeLoginRequest(email, password);
  
  if (result.status === expectedStatus) {
    console.log(`   ✅ PASS - Status: ${result.status}`);
  } else {
    console.log(`   ❌ FAIL - Expected: ${expectedStatus}, Got: ${result.status}`);
  }
  
  if (result.data.error?.json?.message) {
    console.log(`   Message: ${result.data.error.json.message}`);
  }
  
  return result.status === expectedStatus;
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Login Tests');
  console.log('=====================================');
  
  const tests = [
    // Valid format but non-existent credentials
    ['Valid format, non-existent user', 'nonexistent@example.com', 'password123'],
    ['Valid format, wrong password', 'test@example.com', 'wrongpassword'],
    
    // Invalid email formats
    ['Invalid email - no @', 'invalid-email', 'password123'],
    ['Invalid email - no domain', 'test@', 'password123'],
    ['Invalid email - no local', '@example.com', 'password123'],
    ['Invalid email - double @', 'test@@example.com', 'password123'],
    
    // Password validation
    ['Password too short', 'test@example.com', '123'],
    ['Password exactly 8 chars', 'test@example.com', '12345678'],
    ['Empty password', 'test@example.com', ''],
    
    // Edge cases
    ['Empty email', '', 'password123'],
    ['Both empty', '', ''],
    ['Null values', null, null],
    ['Undefined values', undefined, undefined],
    
    // SQL injection attempts (should be handled safely)
    ['SQL injection attempt', "'; DROP TABLE users; --", 'password'],
    ['Email with quotes', "' OR '1'='1", 'password'],
    
    // Very long inputs
    ['Very long email', 'a'.repeat(300) + '@example.com', 'password123'],
    ['Very long password', 'test@example.com', 'a'.repeat(1000)],
  ];

  let passed = 0;
  let failed = 0;

  for (const [name, email, password] of tests) {
    // Handle null/undefined cases
    const emailToTest = email === null ? '' : email === undefined ? '' : email;
    const passwordToTest = password === null ? '' : password === undefined ? '' : password;
    
    const success = await testScenario(name, emailToTest, passwordToTest);
    if (success) passed++;
    else failed++;
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Login function is working as expected.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the results above.');
  }
}

// Test health first
async function testHealth() {
  try {
    console.log('🏥 Testing health endpoint...');
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
  
  await runAllTests();
}

main().catch(console.error);
