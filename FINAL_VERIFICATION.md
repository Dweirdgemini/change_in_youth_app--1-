# Final Pre-Publish Verification Guide

## 🎯 Go/No-Go Decision Framework

Before clicking "Publish" in Manus, verify each section below. If all sections are ✅, you are **GO for launch**.

---

## Section 1: Code Quality & Security

### Tests
```bash
cd /home/ubuntu/change_in_youth_app
npm test
```
**Expected:** 90+ tests passing (96%+ pass rate)
- [ ] ✅ Tests passing
- [ ] ✅ No new failures
- [ ] ✅ Coverage acceptable

**If failing:** Fix test failures before publishing.

### Build
```bash
npm run build
```
**Expected:** Build succeeds, `dist/index.js` created (~500KB)
- [ ] ✅ Build completes without errors
- [ ] ✅ Output file exists
- [ ] ✅ No TypeScript errors blocking build

**If failing:** Fix build errors before publishing.

### Security Audit
```bash
npm audit
```
**Expected:** 12 vulnerabilities remaining (all non-critical)
- [ ] ✅ No critical vulnerabilities
- [ ] ✅ No high-severity vulnerabilities
- [ ] ✅ All fixable issues addressed

**If failing:** Address critical vulnerabilities before publishing.

---

## Section 2: Configuration & Secrets

### Environment Variables
**Verify these are set in Manus Secrets:**
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET=<32-char-hex-string>`
- [ ] `OAUTH_SERVER_URL=https://oauth.manus.im`
- [ ] `VITE_APP_ID=<your-app-id>`
- [ ] `OWNER_OPEN_ID=<owner-openid>`
- [ ] `DATABASE_URL=mysql://...`
- [ ] `ALLOWED_ORIGINS=https://yourdomain.com`
- [ ] `LOG_LEVEL=info`
- [ ] `PORT=3000`

**How to verify in Manus:**
1. Go to Project Settings → Secrets
2. Confirm all variables are present
3. Verify no placeholder values (e.g., `<your-app-id>` should be replaced)

### Database Configuration
**Verify database is accessible:**
```bash
# Test connection (if you have access to sandbox)
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SELECT 1"
```
- [ ] ✅ Database connection works
- [ ] ✅ Schema is up to date
- [ ] ✅ Migrations applied

---

## Section 3: Docker & Backend

### Dockerfile
**Verify Dockerfile exists and is correct:**
- [ ] ✅ `Dockerfile` exists in project root
- [ ] ✅ Uses Node 22-alpine
- [ ] ✅ Installs pnpm@9.12.0
- [ ] ✅ Runs `npm run build`
- [ ] ✅ Exposes port 3000
- [ ] ✅ Has health check

### .dockerignore
**Verify .dockerignore exists:**
- [ ] ✅ `.dockerignore` exists
- [ ] ✅ Excludes node_modules, tests, .git, etc.
- [ ] ✅ Optimizes build size

### Backend Build in Manus
**In Manus platform:**
1. Go to Backend Service section
2. Click "Build"
3. Wait for build to complete
4. **Verify:**
   - [ ] ✅ Build succeeds (no errors)
   - [ ] ✅ Image size reasonable (~500MB)
   - [ ] ✅ No warnings in logs

**If build fails:**
- Review error message
- Check Dockerfile syntax
- Verify pnpm-lock.yaml
- Retry build

---

## Section 4: Mobile App

### App Icon & Assets
**Verify in project:**
- [ ] ✅ `assets/images/icon.png` exists (512x512)
- [ ] ✅ `assets/images/splash-icon.png` exists
- [ ] ✅ `assets/images/favicon.png` exists
- [ ] ✅ `assets/images/android-icon-foreground.png` exists

**In Manus:**
1. Go to App Settings
2. **Verify:**
   - [ ] ✅ App icon displays correctly
   - [ ] ✅ Splash screen configured
   - [ ] ✅ All platforms have icons

### App Configuration
**Verify app.config.ts:**
```bash
grep -E "appName|appSlug|version" /home/ubuntu/change_in_youth_app/app.config.ts
```
**Expected output:**
```
appName: "Change In Youth"
appSlug: "change-in-youth"
version: "1.0.3"
```
- [ ] ✅ App name correct
- [ ] ✅ App slug correct
- [ ] ✅ Version is 1.0.3
- [ ] ✅ Bundle ID configured

### APK Build
**In Manus platform:**
1. Go to Android section
2. Click "Build APK"
3. Wait 10-15 minutes
4. **Verify:**
   - [ ] ✅ Build succeeds
   - [ ] ✅ APK file size 50-100MB
   - [ ] ✅ Can download APK

### IPA Build
**In Manus platform:**
1. Go to iOS section
2. Click "Build IPA"
3. Wait 15-20 minutes
4. **Verify:**
   - [ ] ✅ Build succeeds
   - [ ] ✅ IPA file size 80-150MB
   - [ ] ✅ Can download IPA

---

## Section 5: Documentation & Runbooks

### Deployment Guides
**Verify these files exist:**
- [ ] ✅ `DOCKER_FIX.md` — Backend Docker fix
- [ ] ✅ `GOOGLE_PLAY_PUBLISHING_GUIDE.md` — Android publishing
- [ ] ✅ `APPLE_APP_STORE_PUBLISHING_GUIDE.md` — iOS publishing
- [ ] ✅ `COMPLETE_DEPLOYMENT_GUIDE.md` — Full deployment orchestration
- [ ] ✅ `MANUS_PUBLISH_CHECKLIST.md` — Manus-specific checklist

### Environment Documentation
**Verify .env.example exists:**
```bash
ls -l /home/ubuntu/change_in_youth_app/.env.example
```
- [ ] ✅ `.env.example` exists
- [ ] ✅ All required variables documented
- [ ] ✅ Example values provided

---

## Section 6: Security Verification

### No Test Endpoints
**Verify test-login removed:**
```bash
grep -r "test-login\|/auth/test" /home/ubuntu/change_in_youth_app/server/
```
**Expected:** No results (0 matches)
- [ ] ✅ No test-login endpoints
- [ ] ✅ No development auth bypasses
- [ ] ✅ No debug endpoints

### CORS Configuration
**Verify CORS is hardened:**
```bash
grep -A 5 "ALLOWED_ORIGINS\|Access-Control" /home/ubuntu/change_in_youth_app/server/_core/index.ts
```
**Expected:** Whitelist-based CORS (not `*`)
- [ ] ✅ CORS uses whitelist
- [ ] ✅ No wildcard origins
- [ ] ✅ Specific domains allowed

### No Console Logs
**Verify no console.log in server code:**
```bash
grep -r "console\." /home/ubuntu/change_in_youth_app/server/_core/ | grep -v "logger"
```
**Expected:** No results or only logger calls
- [ ] ✅ No console.log statements
- [ ] ✅ Using structured logging (pino)
- [ ] ✅ No sensitive data logged

---

## Section 7: Database & Migrations

### Schema Consistency
**Verify schema matches Drizzle:**
```bash
# Check if migrations needed
pnpm db:push --dry-run
```
**Expected:** "No changes needed" or list of pending migrations
- [ ] ✅ Schema up to date
- [ ] ✅ All tables exist
- [ ] ✅ Relationships correct

### Database Fail-Fast
**Verify database connection fails gracefully:**
- [ ] ✅ Database URL required (no default)
- [ ] ✅ Connection errors logged
- [ ] ✅ Server exits if DB unavailable

---

## Section 8: Monitoring & Alerting

### Health Check Endpoint
**Verify health check exists:**
```bash
# Will test after deployment
curl https://your-api-domain.com/api/health
```
**Expected response:**
```json
{"ok":true,"timestamp":1234567890}
```
- [ ] ✅ Health endpoint implemented
- [ ] ✅ Returns 200 status
- [ ] ✅ Includes timestamp

### Error Logging
**Verify error logging configured:**
- [ ] ✅ Structured logging (pino) enabled
- [ ] ✅ Error level set to "info" or "error"
- [ ] ✅ Logs include timestamps and context

---

## Final Go/No-Go Decision

### Count Your Checkmarks

**Total items:** 70+

**Scoring:**
- 65+ ✅ = **GO FOR LAUNCH** 🚀
- 50-64 ✅ = **PROCEED WITH CAUTION** ⚠️
- <50 ✅ = **NO-GO, FIX ISSUES FIRST** 🛑

### Your Score: _____ / 70+

---

## If GO: Next Steps

1. **Publish Backend Service**
   - In Manus: Click "Publish" on Backend Service
   - Wait for deployment (2-5 minutes)
   - Verify health endpoint responds

2. **Publish Mobile App**
   - In Manus: Click "Publish" on Mobile App
   - Select Android and iOS
   - Apps will be submitted to stores

3. **Monitor for 24-48 Hours**
   - Check crash reports
   - Monitor user reviews
   - Be ready to hotfix if needed

---

## If NO-GO: Blockers to Fix

**List any unchecked items that are blocking launch:**

1. _________________________________
2. _________________________________
3. _________________________________

**Fix these items, then return to this checklist.**

---

## Support Escalation

| Severity | Response Time | Contact |
|----------|---------------|---------|
| Critical (P1) | 15 min | DevOps Lead |
| High (P2) | 1 hour | Backend Lead |
| Medium (P3) | 4 hours | Product Manager |
| Low (P4) | 24 hours | Support Team |

---

**Last Updated:** February 4, 2026  
**Version:** 1.0.3  
**Status:** Ready for Verification

**Print this page, check all boxes, and bring to launch meeting.** ✅
