# Authentication Options for Change In Youth App

## Current Status
- **Current:** OAuth only
- **Supported:** Google, Microsoft, or custom OAuth provider
- **No:** Username/password authentication

## Option 1: Add Username & Password (Email-based)

### What It Does
Users can sign up with email and password, OR use OAuth.

### Implementation Complexity
**Effort:** Medium (2-3 days)
**Risk:** Low (well-established patterns)

### What You Need
1. **Password hashing** - bcrypt library (already available)
2. **Email verification** - Send confirmation email
3. **Password reset** - Forgot password flow
4. **Database changes** - Add `password` field to users table
5. **New API endpoints** - `/api/auth/register`, `/api/auth/login`
6. **UI changes** - Login screen with email/password form

### Security Considerations
- ✅ Passwords hashed with bcrypt (never stored plain text)
- ✅ HTTPS only (enforced by Google Play)
- ✅ Session tokens (same as OAuth)
- ⚠️ Password reset emails must be secure
- ⚠️ Rate limiting on login attempts (prevent brute force)

### Pros
- ✅ Users don't need external OAuth account
- ✅ Works offline (no OAuth provider dependency)
- ✅ Familiar to most users
- ✅ Can pre-populate users via CSV with temporary passwords

### Cons
- ❌ More security responsibility (password management)
- ❌ Password reset emails can fail
- ❌ Users forget passwords
- ❌ More support burden

---

## Option 2: Add Email Magic Link Authentication

### What It Does
Users click "Sign in with email" → receive link → click link → logged in (no password needed).

### Implementation Complexity
**Effort:** Medium (2-3 days)
**Risk:** Low

### What You Need
1. **Email service** - Send magic links (already have backend)
2. **Token generation** - Create unique, time-limited tokens
3. **Database changes** - Add `magicLinkToken` and `magicLinkExpiry` fields
4. **New API endpoints** - `/api/auth/magic-link`, `/api/auth/verify-link`
5. **UI changes** - Email input screen, link verification

### Security Considerations
- ✅ No passwords to manage
- ✅ Tokens expire (15-30 minutes)
- ✅ One-time use only
- ✅ Email-based (user controls access)

### Pros
- ✅ No passwords to remember
- ✅ Simpler than password management
- ✅ Works with OAuth
- ✅ Good for organizations (email-based)

### Cons
- ❌ Requires email delivery (can be slow)
- ❌ Links can expire
- ❌ Users must check email

---

## Option 3: Add Two-Factor Authentication (2FA)

### What It Does
After OAuth login, user enters a code from their phone (TOTP - Time-based One-Time Password).

### Implementation Complexity
**Effort:** Medium (2-3 days)
**Risk:** Low

### What You Need
1. **TOTP library** - `speakeasy` or `otplib` (npm packages)
2. **QR code generation** - For authenticator app setup
3. **Database changes** - Add `twoFactorSecret` field
4. **New API endpoints** - `/api/auth/2fa/setup`, `/api/auth/2fa/verify`
5. **UI changes** - 2FA setup screen, code entry screen

### Security Considerations
- ✅ Requires phone (second factor)
- ✅ Works with Google Authenticator, Microsoft Authenticator, Authy
- ✅ No SMS costs
- ✅ Backup codes for recovery

### Pros
- ✅ Significantly increases security
- ✅ Industry standard
- ✅ Works with existing OAuth
- ✅ Users keep control (optional)

### Cons
- ❌ More steps to login
- ❌ Users can lose phone
- ❌ Requires backup codes

---

## Option 4: Add Biometric Authentication (Fingerprint/Face)

### What It Does
After first OAuth login, user can use fingerprint or face recognition on mobile.

### Implementation Complexity
**Effort:** Low (1-2 days)
**Risk:** Low

### What You Need
1. **Expo SecureStore** - Already in your app
2. **react-native-biometrics** - npm package
3. **Local storage** - Store encrypted session token locally
4. **UI changes** - Biometric prompt on login screen

### Security Considerations
- ✅ Biometric data never leaves device
- ✅ Falls back to OAuth if biometric fails
- ✅ Secure enclave storage
- ✅ User can disable anytime

### Pros
- ✅ Fastest login experience
- ✅ Works offline (uses stored token)
- ✅ No additional complexity
- ✅ Users love it

### Cons
- ❌ Only works on mobile
- ❌ Requires first OAuth login
- ❌ Biometric enrollment needed

---

## Recommendation for Change In Youth

### Best Approach: **Hybrid Authentication**

Implement in this order:

**Phase 1 (Now):** Keep OAuth only
- ✅ Simple, secure, proven
- ✅ Works for closed testing

**Phase 2 (After launch):** Add Email Magic Link
- ✅ No password management
- ✅ Works with organizations
- ✅ Good user experience
- ✅ Medium effort

**Phase 3 (Optional):** Add Biometric
- ✅ Improves mobile experience
- ✅ Low effort
- ✅ Users love it

**Phase 4 (Optional):** Add 2FA
- ✅ For high-security users
- ✅ Optional (not forced)
- ✅ Increases trust

---

## Quick Implementation Timeline

| Option | Effort | Timeline | Priority |
|--------|--------|----------|----------|
| Keep OAuth only | None | 0 days | ✅ Current |
| Add Email Magic Link | Medium | 2-3 days | 🟡 Phase 2 |
| Add Biometric | Low | 1-2 days | 🟡 Phase 3 |
| Add Username/Password | Medium | 2-3 days | 🔴 Not recommended |
| Add 2FA | Medium | 2-3 days | 🟡 Phase 4 |

---

## My Recommendation for Google Play Submission

**For now:** Keep answer as **"OAuth only"**

**Why:**
- ✅ You're in closed testing (small user group)
- ✅ OAuth is secure and proven
- ✅ Easier to manage
- ✅ No password support burden
- ✅ Users can be pre-invited

**After launch:** Add Email Magic Link for broader audience

---

## Questions to Consider

1. **Do you want users to create their own accounts?**
   - If YES → Add Email Magic Link or Username/Password
   - If NO → Keep OAuth (invite-only)

2. **Is this for internal team only or external users?**
   - Internal → OAuth is fine
   - External → Add Email Magic Link

3. **What's your password reset support capacity?**
   - Low → Don't add passwords
   - High → Can add passwords

4. **Do you want mobile-only fast login?**
   - Yes → Add Biometric

---

## What Should You Do Now?

**For Google Play submission:**
- ✅ Answer: **"OAuth"** only
- ✅ This is honest and accurate
- ✅ You can add more auth methods later

**After successful launch:**
- Plan Phase 2: Email Magic Link
- Gather user feedback
- Decide based on demand

---

**Last Updated:** 2026-02-21
