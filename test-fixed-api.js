/**
 * Test the fixed API client format
 * Run with: node test-fixed-api.js
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'https://changeinyouthapp-1-production.up.railway.app';

async function testFixedFormat() {
  console.log('🔧 Testing Fixed API Format...');
  
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

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('   ✅ Fixed format works! (401 = invalid credentials, as expected)');
      const data = await response.json();
      console.log('   Error message:', data?.error?.json?.message || 'No error message');
      return true;
    } else if (response.status === 415) {
      console.log('   ❌ Still getting 415 error - format still wrong');
      const text = await response.text();
      console.log('   Response:', text);
      return false;
    } else if (response.status === 400) {
      console.log('   ❌ Getting 400 error - checking response...');
      const data = await response.json();
      console.log('   Error details:', JSON.stringify(data, null, 2));
      return false;
    } else if (response.ok) {
      console.log('   ✅ Success! Login worked');
      const data = await response.json();
      console.log('   Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('   ❌ Unexpected response status');
      const text = await response.text();
      console.log('   Response:', text);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Network error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Fixed API Format');
  console.log('============================\n');
  
  const success = await testFixedFormat();
  
  if (success) {
    console.log('\n🎉 API format is now correct!');
    console.log('The login function should work in the app now.');
  } else {
    console.log('\n❌ API format still needs fixing.');
  }
}

main().catch(console.error);
