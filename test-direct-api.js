/**
 * Test direct API call to bypass tRPC client issues
 * Run with: node test-direct-api.js
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'https://changeinyouthapp-1-production.up.railway.app';

async function testDirectAPICall() {
  console.log('🧪 Testing direct API call to bypass tRPC client...');
  
  try {
    // Test the exact format the server expects
    const response = await fetch(`${API_BASE_URL}/api/trpc/auth.login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-trpc-source': 'test-direct',
      },
      body: JSON.stringify({
        json: {
          email: 'Nwachukujoshua@miva.edu.ng',
          password: 'testpassword123'
        },
        meta: {}
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('   Raw response:', responseText);
    
    if (response.status === 401) {
      console.log('   ✅ API call works! (401 = invalid credentials, as expected)');
      try {
        const data = JSON.parse(responseText);
        console.log('   Parsed error:', data);
        if (data.error && data.error.json && data.error.json.message) {
          console.log('   Error message:', data.error.json.message);
        }
      } catch (parseError) {
        console.log('   Failed to parse response as JSON');
      }
      return true;
    } else if (response.status === 415) {
      console.log('   ❌ Still getting 415 error - checking response...');
      console.log('   Response:', responseText);
      return false;
    } else if (response.ok) {
      console.log('   ✅ Success! Login worked');
      const data = JSON.parse(responseText);
      console.log('   Response data:', data);
      return true;
    } else {
      console.log('   ❌ Unexpected response status');
      console.log('   Response:', responseText);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Network error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Direct API Call');
  console.log('=============================\n');
  
  const success = await testDirectAPICall();
  
  if (success) {
    console.log('\n🎉 Direct API call works!');
    console.log('The issue is specifically with the tRPC client library.');
    console.log('This might be a version compatibility issue.');
  } else {
    console.log('\n❌ Direct API call also failed.');
    console.log('The issue might be with the server configuration.');
  }
}

main().catch(console.error);
