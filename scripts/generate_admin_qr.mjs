import QRCode from 'qrcode';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

// Create admin user session
const adminUser = {
  id: 999,
  openId: 'admin-test-user',
  email: 'admin@changein.delivery',
  name: 'Admin Test User',
  role: 'admin',
  loginMethod: 'test'
};

// Generate JWT token
const token = await new SignJWT(adminUser)
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('7d')
  .sign(secret);

// Create deep link with session data
const sessionData = {
  sessionToken: token,
  userId: adminUser.id,
  email: adminUser.email,
  name: adminUser.name,
  role: adminUser.role
};

const deepLink = `manus20260109113652://oauth/callback?${new URLSearchParams(sessionData).toString()}`;

console.log('\n🔐 Admin Login QR Code Generated!\n');
console.log('User Details:');
console.log(`  Name: ${adminUser.name}`);
console.log(`  Email: ${adminUser.email}`);
console.log(`  Role: ${adminUser.role}`);
console.log('\nDeep Link:');
console.log(deepLink);
console.log('\n');

// Generate QR code
const qrPath = '/home/ubuntu/admin_login_qr.png';
await QRCode.toFile(qrPath, deepLink, {
  width: 500,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});

console.log(`✅ QR Code saved to: ${qrPath}`);
console.log('\nScan this QR code with your mobile device to log in as admin!\n');
