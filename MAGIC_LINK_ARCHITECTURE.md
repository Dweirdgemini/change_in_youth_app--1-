# Email Magic Link Authentication - Architecture Plan

## Executive Summary

Implement a **non-destructive, parallel authentication system** that allows users to sign in via email magic links while preserving the existing OAuth flow completely. Both methods will issue identical session tokens, ensuring seamless integration.

**Key Principles:**
- ✅ Zero disruption to OAuth
- ✅ Maximum security (hashed tokens, 15-min expiry, single-use)
- ✅ Google Play compliant (data minimization)
- ✅ Modular, testable code

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    EXPO MOBILE APP                      │
├─────────────────────────────────────────────────────────┤
│  Login Screen (OAuth + Magic Link)                      │
│  ├─ OAuth Button → WebBrowser.openAuthSessionAsync()   │
│  └─ Magic Link Button → Email Input Screen             │
│      ├─ POST /api/auth/magic-link (email)              │
│      └─ Deep Link Handler → Verify Token               │
│          └─ POST /api/auth/verify-link (token)         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  BACKEND API (Node.js)                  │
├─────────────────────────────────────────────────────────┤
│  Authentication Service                                 │
│  ├─ OAuth Service (existing)                           │
│  └─ Magic Link Service (new, parallel)                 │
│      ├─ Token Generation (crypto.randomBytes)          │
│      ├─ Token Hashing (bcrypt)                         │
│      ├─ Email Service Integration                      │
│      └─ Rate Limiting (Redis/in-memory)                │
│                                                         │
│  Session Management (shared)                           │
│  └─ Issues identical session tokens for both methods   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (MySQL)                       │
├─────────────────────────────────────────────────────────┤
│  users table (existing)                                 │
│  ├─ id, email, name, openId, loginMethod               │
│  ├─ magicLinkToken (NEW - hashed)                      │
│  ├─ magicLinkExpiry (NEW - timestamp)                  │
│  └─ createdAt, updatedAt                               │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Changes

### Migration Strategy
**File:** `server/migrations/add_magic_link_fields.ts`

```sql
-- Add columns to users table
ALTER TABLE users ADD COLUMN magicLinkToken VARCHAR(255) NULL DEFAULT NULL;
ALTER TABLE users ADD COLUMN magicLinkExpiry DATETIME NULL DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX idx_magic_link_token ON users(magicLinkToken);

-- Add column to track login method
ALTER TABLE users MODIFY COLUMN loginMethod VARCHAR(50) DEFAULT 'oauth';
-- Possible values: 'oauth', 'magic_link', 'pending'
```

### User Model Update
**File:** `server/db.ts`

```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  openId: string | null;  // OAuth identifier
  loginMethod: 'oauth' | 'magic_link' | 'pending';
  magicLinkToken: string | null;  // Hashed token
  magicLinkExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Backend Implementation

### 3.1 Magic Link Service
**File:** `server/_core/magic-link-service.ts`

**Responsibilities:**
- Generate cryptographically secure tokens
- Hash tokens before storage
- Verify tokens and check expiry
- Single-use enforcement
- Rate limiting

**Key Functions:**
```typescript
class MagicLinkService {
  // Generate 32-byte random token, return plain token + hash
  generateToken(): { plainToken: string; hashedToken: string }
  
  // Verify token: check hash, expiry, existence
  verifyToken(plainToken: string): Promise<{ valid: boolean; email?: string; error?: string }>
  
  // Invalidate token after use
  invalidateToken(email: string): Promise<void>
  
  // Rate limiting: max 3 requests per email per hour
  checkRateLimit(email: string): Promise<{ allowed: boolean; retryAfter?: number }>
}
```

### 3.2 API Endpoints

#### Endpoint 1: Request Magic Link
**POST /api/auth/magic-link**

```typescript
// Request body
{
  email: string  // Required, validated
}

// Response (200)
{
  success: true,
  message: "Check your email for the login link",
  expiresIn: 900  // seconds (15 minutes)
}

// Response (429 - Rate Limited)
{
  error: "Too many requests",
  retryAfter: 3600  // seconds until next request allowed
}

// Response (400 - Invalid Email)
{
  error: "Invalid email format"
}
```

**Logic:**
1. Validate email format
2. Check rate limit (max 3/hour per email)
3. Generate magic link token
4. Hash token, store in DB with 15-min expiry
5. Send email with deep link: `manus20240115103045://auth/magic-link?token=<plainToken>`
6. Return success message

#### Endpoint 2: Verify Magic Link
**POST /api/auth/verify-link**

```typescript
// Request body
{
  token: string  // Plain token from deep link
}

// Response (200)
{
  success: true,
  sessionToken: "eyJhbGc...",  // Same format as OAuth
  user: {
    id: "user123",
    email: "user@example.com",
    name: "User Name",
    loginMethod: "magic_link"
  }
}

// Response (401 - Invalid/Expired)
{
  error: "Link expired or invalid",
  code: "LINK_EXPIRED"  // or "LINK_INVALID" or "LINK_USED"
}
```

**Logic:**
1. Validate token format
2. Hash the provided token
3. Look up user by hashed token
4. Check expiry (must be within 15 minutes)
5. Check single-use (token must exist in DB)
6. Create/update user if new
7. Issue session token (identical to OAuth format)
8. Immediately invalidate token (set to NULL)
9. Return session token + user info

### 3.3 Email Service Integration
**File:** `server/_core/email-service.ts`

**Email Template:**
```
Subject: Your Change In Youth Login Link

Hi [Name/User],

Click the link below to sign in to Change In Youth:

[Deep Link Button: manus20240115103045://auth/magic-link?token=...]

This link expires in 15 minutes.

If you didn't request this link, you can safely ignore this email.

---
Change In Youth Team
```

**Implementation:**
- Use existing email service (SendGrid, AWS SES, etc.)
- Include app deep link in email
- Add fallback copy-paste token option
- Track email delivery status

### 3.4 Rate Limiting
**File:** `server/_core/rate-limiter.ts`

**Strategy:**
- In-memory store (can upgrade to Redis later)
- Per-email rate limit: 3 requests per hour
- Per-IP rate limit: 10 requests per hour (prevent spam)
- Clean up expired entries every hour

---

## 4. Frontend Implementation (Expo)

### 4.1 Deep Linking Configuration
**File:** `app.config.ts` (update)

```typescript
// Add magic link deep link scheme
const scheme = schemeFromBundleId;  // e.g., "manus20240115103045"

// Deep link patterns
app.linking = {
  prefixes: [scheme + "://"],
  config: {
    screens: {
      "auth/magic-link": "auth/magic-link",
      // ... existing routes
    }
  }
}
```

### 4.2 Login Screen UI
**File:** `app/(tabs)/index.tsx` (update)

**Changes:**
- Add "Sign in with Email" button
- Show email input screen when clicked
- Handle OAuth button (existing)
- Show loading states
- Display error messages

**Flow:**
```
Login Screen
├─ OAuth Button → WebBrowser.openAuthSessionAsync()
├─ OR
└─ Magic Link Button
   ├─ Email Input Screen
   │  ├─ Email field (validated)
   │  ├─ "Send Link" button
   │  └─ "Back" button
   ├─ Confirmation Screen
   │  ├─ "Check your email"
   │  ├─ "Didn't receive? Resend" (rate-limited)
   │  └─ "Back to login"
   └─ Deep Link Handler (automatic)
      └─ Verify token → Home screen
```

### 4.3 Magic Link Verification Screen
**File:** `app/auth/magic-link.tsx` (new)

**Responsibilities:**
- Extract token from deep link URL
- Call `/api/auth/verify-link`
- Handle loading state
- Handle errors (expired, invalid, network)
- Store session token
- Redirect to home screen

**Error Handling:**
```typescript
if (error === "LINK_EXPIRED") {
  showAlert("Link expired", "Request a new login link");
  redirectToLogin();
} else if (error === "LINK_INVALID") {
  showAlert("Invalid link", "Request a new login link");
  redirectToLogin();
} else if (error === "LINK_USED") {
  showAlert("Link already used", "Request a new login link");
  redirectToLogin();
} else if (error === "NETWORK_ERROR") {
  showAlert("Network error", "Check your connection and try again");
}
```

### 4.4 Email Input Component
**File:** `components/magic-link-email-input.tsx` (new)

**Features:**
- Email validation (RFC 5322)
- Loading state during request
- Success message ("Check your email")
- Rate limit feedback ("Try again in X seconds")
- Error messages
- Accessible (WCAG 2.1)

---

## 5. File Structure

```
change_in_youth_app/
├── server/
│   ├── _core/
│   │   ├── magic-link-service.ts          (NEW)
│   │   ├── rate-limiter.ts                (NEW)
│   │   ├── email-service.ts               (EXISTING - extend)
│   │   └── oauth.ts                       (EXISTING - no changes)
│   ├── migrations/
│   │   └── add_magic_link_fields.ts       (NEW)
│   ├── routes/
│   │   └── magic-link.ts                  (NEW - API routes)
│   └── db.ts                              (UPDATE - add fields)
│
├── app/
│   ├── auth/
│   │   └── magic-link.tsx                 (NEW - verification screen)
│   ├── (tabs)/
│   │   └── index.tsx                      (UPDATE - add magic link button)
│   └── _layout.tsx                        (UPDATE - add deep link config)
│
├── components/
│   ├── magic-link-email-input.tsx         (NEW)
│   └── magic-link-confirmation.tsx        (NEW)
│
├── hooks/
│   └── use-magic-link.ts                  (NEW - custom hook)
│
└── constants/
    └── magic-link.ts                      (NEW - constants)
```

---

## 6. Security Considerations

### Token Security
- ✅ 32-byte random tokens (256 bits of entropy)
- ✅ Tokens hashed with bcrypt before storage
- ✅ Tokens never logged or exposed
- ✅ Single-use enforcement (invalidated after verification)
- ✅ 15-minute expiry (strict)

### Rate Limiting
- ✅ 3 requests per email per hour
- ✅ 10 requests per IP per hour
- ✅ Prevents brute force and spam

### Email Security
- ✅ Deep links include only token (no sensitive data)
- ✅ Token in URL is single-use
- ✅ Email content doesn't expose user info
- ✅ Fallback copy-paste option for accessibility

### Session Management
- ✅ Identical session tokens as OAuth
- ✅ Same expiry and refresh logic
- ✅ Same security headers
- ✅ Same HTTPS enforcement

### Account Deletion
- ✅ Magic link tokens cleared on account deletion
- ✅ No orphaned tokens
- ✅ Complies with Google Play data minimization

---

## 7. Google Play Data Safety Compliance

### Data Collection
- **Email:** Collected (necessary for magic link)
- **Token:** Hashed, single-use, never stored permanently
- **IP Address:** Used for rate limiting only, not stored
- **Device Info:** Not collected

### Data Retention
- **Email:** Stored (user account data)
- **Magic Link Token:** Deleted after 15 minutes (auto-expire)
- **Magic Link Token:** Deleted immediately after use
- **Session Token:** Same as OAuth (existing policy)

### Data Sharing
- **No third-party sharing** (except email service for sending)
- **Email service:** Only receives email address + link
- **No analytics tracking** on magic link flow

---

## 8. Implementation Phases

### Phase 1: Backend Infrastructure (2 days)
- [ ] Create magic-link-service.ts
- [ ] Create rate-limiter.ts
- [ ] Create database migration
- [ ] Create API endpoints (/magic-link, /verify-link)
- [ ] Add email template
- [ ] Unit tests for token generation/verification

### Phase 2: Frontend UI (2 days)
- [ ] Create magic-link-email-input component
- [ ] Create magic-link-confirmation component
- [ ] Update login screen with magic link button
- [ ] Create auth/magic-link verification screen
- [ ] Add deep linking configuration

### Phase 3: Integration & Testing (1 day)
- [ ] End-to-end testing (email → deep link → login)
- [ ] Error handling & edge cases
- [ ] Rate limiting verification
- [ ] Security audit
- [ ] Google Play compliance check

### Phase 4: Documentation & Deployment (1 day)
- [ ] Update API documentation
- [ ] Add troubleshooting guide
- [ ] Create user-facing help docs
- [ ] Deploy to staging
- [ ] Final QA

**Total Effort:** 6 days

---

## 9. Testing Strategy

### Unit Tests
- Token generation (randomness, length)
- Token hashing (consistency, security)
- Token verification (valid, expired, invalid)
- Rate limiting (counts, resets)
- Email validation

### Integration Tests
- Full flow: email → token → verification
- Deep link handling
- Session token issuance
- User creation (new email)
- User update (existing email)

### Security Tests
- Token brute force (rate limiting)
- Token reuse (single-use enforcement)
- Token expiry (15-minute boundary)
- Rate limit bypass attempts
- SQL injection in email field

### UI Tests
- Email input validation
- Loading states
- Error messages
- Deep link routing
- Accessibility (screen readers)

---

## 10. Rollback Plan

If issues arise:
1. **Disable magic link button** in app (feature flag)
2. **Keep OAuth working** (unchanged)
3. **Migrate users** back to OAuth
4. **Database cleanup** (optional - tokens auto-expire)

---

## 11. Monitoring & Metrics

**Track:**
- Magic link requests per day
- Success rate (token verified)
- Error rates (expired, invalid, network)
- Average time to verification
- Rate limit hits
- Email delivery failures

---

## Approval Checklist

Before proceeding with code, please confirm:

- [ ] Architecture aligns with your vision
- [ ] Database schema changes are acceptable
- [ ] Email service integration method is correct
- [ ] Deep linking approach is suitable
- [ ] Security measures are sufficient
- [ ] Timeline (6 days) is acceptable
- [ ] File structure makes sense

---

**Next Steps:**
1. Review this architecture plan
2. Provide feedback/changes
3. Approve for implementation
4. Begin Phase 1 (backend infrastructure)

