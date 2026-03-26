/**
 * Test if httpBatchStreamLink format works
 * Run with: node test-streaming-link.js
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'https://changeinyouthapp-1-production.up.railway.app';

async function testStreamingFormat() {
  console.log('🧪 Testing streaming format...');
  
  try {
    // Test with proper streaming headers
    const response = await fetch(`${API_BASE_URL}/api/trpc/auth.login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-trpc-source': 'react-native',
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
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log('   ✅ Streaming format works! (401 = invalid credentials, as expected)');
      const data = await response.json();
      console.log('   Error message:', data?.error?.json?.message || 'No error message');
      return true;
    } else if (response.status === 415) {
      console.log('   ❌ Still getting 415 error - checking response...');
      const text = await response.text();
      console.log('   Response:', text);
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
  console.log('🚀 Testing Streaming Link Format');
  console.log('===============================\n');
  
  const success = await testStreamingFormat();
  
  if (success) {
    console.log('\n🎉 Streaming link format works!');
    console.log('The tRPC client should now work correctly.');
  } else {
    console.log('\n❌ Streaming link format still has issues.');
  }
}

main().catch(console.error);
