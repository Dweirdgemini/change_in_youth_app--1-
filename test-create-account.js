// Test Create Account API
const fetch = require('node-fetch');

async function testCreateAccount() {
  try {
    console.log('Testing Create Account API...');
    
    const response = await fetch('http://localhost:3002/api/trpc/auth.register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.ok) {
      console.log('✅ Account creation successful!');
    } else {
      console.log('❌ Account creation failed!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCreateAccount();
