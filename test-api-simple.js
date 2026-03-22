// Simple API Test - Try different endpoints
const http = require('http');

function testEndpoint(path, port = 3002) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing API endpoints...\n');

  // Test health endpoint
  try {
    console.log('1. Testing /api/health...');
    const health = await testEndpoint('/api/health');
    console.log(`✅ Health check: ${health.status}`);
    console.log(`Response: ${health.data}\n`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}\n`);
  }

  // Test tRPC endpoint
  try {
    console.log('2. Testing /api/trpc...');
    const trpc = await testEndpoint('/api/trpc');
    console.log(`✅ tRPC endpoint: ${trpc.status}\n`);
  } catch (error) {
    console.log(`❌ tRPC endpoint failed: ${error.message}\n`);
  }

  // Test different ports
  const ports = [3000, 3001, 3002, 3003];
  for (const port of ports) {
    try {
      console.log(`3. Testing port ${port}...`);
      await testEndpoint('/api/health', port);
      console.log(`✅ Port ${port} is accessible\n`);
      break;
    } catch (error) {
      console.log(`❌ Port ${port} not accessible: ${error.message}\n`);
    }
  }
}

runTests().catch(console.error);
