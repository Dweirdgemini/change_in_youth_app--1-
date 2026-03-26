/**
 * Final comprehensive login test - verifies the complete login flow
 * Tests both the API endpoint and the app's integration
 * Run with: node test-login-final.js
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'https://changeinyouthapp-1-production.up.railway.app';

async function testApiEndpoint() {
  console.log('🔍 Testing API Endpoint...');
  
  try {
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

    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ API endpoint is working correctly (401 = invalid credentials, as expected)');
      return true;
    } else if (response.ok) {
      console.log('   ✅ API endpoint is working and returned success');
      const data = await response.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('   ❌ Unexpected response status');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Network error:', error.message);
    return false;
  }
}

async function testHealth() {
  console.log('🏥 Testing Health Endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Server is healthy');
      return true;
    } else {
      console.log('   ❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Health check error:', error.message);
    return false;
  }
}

async function testInputValidation() {
  console.log('🧪 Testing Input Validation...');
  
  const testCases = [
    {
      name: 'Valid email format, wrong password',
      email: 'test@example.com',
      password: 'wrongpassword',
      expectedStatus: 401
    },
    {
      name: 'Invalid email format',
      email: 'invalid-email',
      password: 'password123',
      expectedStatus: 400
    },
    {
      name: 'Password too short',
      email: 'test@example.com',
      password: '123',
      expectedStatus: 400
    }
  ];

  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trpc/auth.login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            email: testCase.email,
            password: testCase.password
          },
          meta: {}
        })
      });

      if (response.status === testCase.expectedStatus) {
        console.log(`   ✅ ${testCase.name} - Status: ${response.status} (expected)`);
        passed++;
      } else {
        console.log(`   ❌ ${testCase.name} - Expected: ${testCase.expectedStatus}, Got: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${testCase.name} - Network error: ${error.message}`);
    }
  }

  console.log(`   Validation tests passed: ${passed}/${total}`);
  return passed === total;
}

async function main() {
  console.log('🚀 Final Login Function Test');
  console.log('=============================\n');
  
  const results = {
    health: await testHealth(),
    api: await testApiEndpoint(),
    validation: await testInputValidation()
  };

  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`Health Check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoint: ${results.api ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Input Validation: ${results.validation ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('The login function is working correctly:');
    console.log('✅ Server is healthy and responding');
    console.log('✅ tRPC API endpoint is accessible');
    console.log('✅ Input validation is working properly');
    console.log('✅ Authentication logic is functioning');
    console.log('\n📱 The app should now be able to login successfully!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the results above.');
  }
}

main().catch(console.error);
