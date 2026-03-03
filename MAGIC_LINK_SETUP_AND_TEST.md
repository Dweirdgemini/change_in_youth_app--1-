# Email Magic Link - Setup & Testing Guide

**Status:** Backend code complete, ready for installation and testing

---

## Phase 1: Installation & Database Setup

### Step 1: Install Dependencies

```bash
cd /home/ubuntu/change_in_youth_app
pnpm install
```

**What this does:**
- Installs bcrypt (^5.1.1) for secure token hashing
- Updates node_modules with all dependencies

**Expected output:**
```
✓ All dependencies installed successfully
```

---

### Step 2: Apply Database Migration

```bash
pnpm db:push
```

**What this does:**
- Generates migration files from Drizzle schema
- Applies migrations to your MySQL database
- Adds `magicLinkToken` and `magicLinkExpiry` columns to `users` table

**Expected output:**
```
✓ Migration completed successfully
✓ Database schema updated
```

---

## Phase 2: Backend API Testing

### Test Setup

Create a test file: `test-magic-link.sh`

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
TEST_EMAIL="test@example.com"

echo "🧪 Testing Email Magic Link API..."
echo ""

# Test 1: Request Magic Link
echo "📧 Test 1: Request Magic Link"
echo "Endpoint: POST /api/auth/magic-link"
echo "Payload: { \"email\": \"$TEST_EMAIL\" }"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/auth/magic-link" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract token from response (if available in logs)
echo "⏳ Magic link token generated (check server logs for token)"
echo ""

# Test 2: Rate Limiting
echo "🔒 Test 2: Rate Limiting (should fail on 4th request)"
for i in {1..4}; do
  echo "Request $i:"
  curl -s -X POST "$API_URL/api/auth/magic-link" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\"}" | jq '.error' 2>/dev/null || echo "Success"
  sleep 1
done
echo ""

# Test 3: Invalid Email
echo "❌ Test 3: Invalid Email (should fail)"
RESPONSE=$(curl -s -X POST "$API_URL/api/auth/magic-link" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid-email\"}")

echo "Response:"
echo "$RESPONSE" | jq '.error' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "✅ Testing complete!"
```

### Run Tests

```bash
chmod +x test-magic-link.sh
./test-magic-link.sh
```

### Expected Results

**Test 1 - Request Magic Link:**
```json
{
  "success": true,
  "message": "Check your email for the login link",
  "expiresIn": 900
}
```

**Test 2 - Rate Limiting:**
- Requests 1-3: Success
- Request 4: `429 Too Many Requests`

**Test 3 - Invalid Email:**
```json
{
  "error": "Invalid email format",
  "code": "INVALID_EMAIL"
}
```

---

## Phase 3: Manual Token Verification Test

### Step 1: Generate a Token

In your server logs, you'll see:
```
[MagicLink] Magic link generated for test@example.com: manus20240115103045://auth/magic-link?token=<plainToken>
```

Copy the `<plainToken>` value.

### Step 2: Verify the Token

```bash
curl -X POST "http://localhost:3000/api/auth/verify-link" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"<plainToken>\"}"
```

### Expected Response

```json
{
  "success": true,
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": null,
    "loginMethod": "magic_link"
  }
}
```

### Step 3: Verify Single-Use Enforcement

Try to verify the same token again:

```bash
curl -X POST "http://localhost:3000/api/auth/verify-link" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"<plainToken>\"}"
```

### Expected Response (Should Fail)

```json
{
  "error": "Invalid token",
  "code": "LINK_INVALID"
}
```

---

## Phase 4: Integration Checklist

- [ ] `pnpm install` completed successfully
- [ ] `pnpm db:push` applied database migration
- [ ] Magic link API endpoint responds correctly
- [ ] Rate limiting works (3 requests per email per hour)
- [ ] Invalid emails are rejected
- [ ] Token verification works
- [ ] Single-use enforcement works (token can't be reused)
- [ ] Session token format matches OAuth tokens

---

## Troubleshooting

### Error: "Cannot find module 'bcrypt'"

**Solution:**
```bash
pnpm install
pnpm build:check
```

### Error: "Database not available"

**Solution:**
- Ensure `DATABASE_URL` environment variable is set
- Check MySQL connection
- Verify `pnpm db:push` completed successfully

### Error: "Rate limit exceeded"

**Solution:**
- Wait 1 hour for rate limit to reset, OR
- Restart the server (in-memory rate limiter resets)

### Token not working

**Solution:**
- Ensure token hasn't expired (15-minute window)
- Verify token was copied correctly (no extra spaces)
- Check server logs for token generation

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Rate limiter upgraded to Redis (for distributed systems)
- [ ] Email service integrated (currently logs URL)
- [ ] Deep linking implemented (frontend)
- [ ] Frontend UI components built
- [ ] End-to-end testing completed
- [ ] Security audit passed
- [ ] Google Play compliance verified

---

## Files Modified/Created

**Backend:**
- `server/_core/magic-link-service.ts` - Token generation & verification
- `server/_core/rate-limiter.ts` - Rate limiting logic
- `server/routes/magic-link.ts` - API endpoints
- `server/_core/index.ts` - Route registration
- `server/db.ts` - Added getUserByEmail()
- `drizzle/schema.ts` - Added token fields to users table
- `package.json` - Added bcrypt dependency

**Documentation:**
- `MAGIC_LINK_SETUP_AND_TEST.md` - This file
- `MAGIC_LINK_IMPLEMENTATION_STATUS.md` - Implementation progress

---

## Next Steps

1. **Run setup commands** (pnpm install, pnpm db:push)
2. **Run test script** (test-magic-link.sh)
3. **Build frontend UI** (Phase 3)
4. **Implement deep linking** (Phase 3)
5. **End-to-end testing** (Phase 4)

