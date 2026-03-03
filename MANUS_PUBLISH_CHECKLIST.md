# Manus Platform - Pre-Publish Checklist

## Backend Service Publishing

### Prerequisites
- [ ] Dockerfile created and tested locally
- [ ] .dockerignore configured
- [ ] Environment variables documented in .env.example
- [ ] Database migrations ready (pnpm db:push)
- [ ] All tests passing (npm test)
- [ ] No critical vulnerabilities (npm audit)

### In Manus Platform

#### Step 1: Verify Backend Configuration
1. **Go to** Project Settings → Backend Service
2. **Check:**
   - [ ] Dockerfile exists in project root
   - [ ] Node version: 22.x or higher
   - [ ] pnpm version: 9.12.0 or higher
   - [ ] Build command: `npm run build` (default)
   - [ ] Start command: `npm start` (default)

#### Step 2: Set Environment Variables
1. **Go to** Secrets/Environment Variables
2. **Add these required variables:**
   - [ ] `NODE_ENV=production`
   - [ ] `JWT_SECRET=<generate-with-openssl-rand-hex-32>`
   - [ ] `OAUTH_SERVER_URL=https://oauth.manus.im`
   - [ ] `VITE_APP_ID=<your-app-id>`
   - [ ] `OWNER_OPEN_ID=<owner-openid>`
   - [ ] `DATABASE_URL=mysql://user:pass@host:3306/db`
   - [ ] `ALLOWED_ORIGINS=https://yourdomain.com`
   - [ ] `LOG_LEVEL=info`
   - [ ] `PORT=3000`

#### Step 3: Build Backend
1. **Click** "Build" button
2. **Wait for build to complete** (5-10 minutes)
3. **Check build logs:**
   - [ ] No errors in pnpm install
   - [ ] npm run build succeeds
   - [ ] Final image size reasonable (~500MB)
4. **If build fails:**
   - Review error message
   - Check Dockerfile syntax
   - Verify pnpm-lock.yaml is up to date
   - Retry build

#### Step 4: Publish Backend
1. **Click** "Publish" button
2. **Confirm deployment** to production
3. **Wait for deployment** (2-5 minutes)
4. **Verify deployment:**
   - [ ] No errors in deployment logs
   - [ ] Service status shows "Running"
   - [ ] Health check endpoint responds

#### Step 5: Test Backend
```bash
# Test health endpoint
curl https://your-api-domain.com/api/health

# Expected response:
# {"ok":true,"timestamp":1234567890}
```

---

## Mobile App Publishing

### Prerequisites
- [ ] App version: 1.0.3
- [ ] App icon uploaded (512x512 PNG)
- [ ] Screenshots prepared (4+ per platform)
- [ ] App description complete
- [ ] Privacy policy URL ready
- [ ] APK/IPA files ready

### In Manus Platform

#### Step 1: Verify App Configuration
1. **Go to** App Settings
2. **Check:**
   - [ ] App name: "Change In Youth"
   - [ ] App slug: "change-in-youth"
   - [ ] Version: 1.0.3
   - [ ] Bundle ID: Correct format
   - [ ] Icon: Uploaded and visible
   - [ ] Splash screen: Configured

#### Step 2: Build APK (Android)
1. **Go to** Build & Publish → Android
2. **Click** "Build APK"
3. **Wait for build** (10-15 minutes)
4. **Download APK** when ready
5. **Verify APK:**
   - [ ] File size reasonable (~50-100MB)
   - [ ] Can be installed on test device
   - [ ] App launches without crashes

#### Step 3: Build IPA (iOS)
1. **Go to** Build & Publish → iOS
2. **Click** "Build IPA"
3. **Wait for build** (15-20 minutes)
4. **Download IPA** when ready
5. **Verify IPA:**
   - [ ] File size reasonable (~80-150MB)
   - [ ] Signing certificate valid
   - [ ] Can be installed via TestFlight

#### Step 4: Publish Mobile App
1. **Click** "Publish" button in Manus
2. **Select platforms:**
   - [ ] Android (Google Play)
   - [ ] iOS (App Store)
3. **Confirm publication**
4. **Wait for submission** (automatic via Manus)

---

## Post-Publish Verification

### Immediate (Within 1 hour)
- [ ] Backend service responding to requests
- [ ] Mobile apps submitted to stores
- [ ] No critical errors in logs
- [ ] Database connections working

### Short-term (24 hours)
- [ ] Apps approved by app stores
- [ ] Apps visible in search
- [ ] Users can download and install
- [ ] No crash reports
- [ ] API endpoints responding

### Medium-term (1 week)
- [ ] 100+ downloads
- [ ] 4.5+ average rating
- [ ] <1% crash rate
- [ ] User feedback positive
- [ ] No security incidents

---

## Troubleshooting

### Backend Build Fails
**Error:** "failed to solve process /bin/sh -c corepack pnpm..."

**Solution:**
1. Verify Dockerfile exists in project root
2. Check pnpm-lock.yaml is up to date: `pnpm install`
3. Ensure Node version is 22.x
4. Retry build in Manus

### Backend Deployment Fails
**Error:** "Service failed to start"

**Solution:**
1. Check environment variables are set
2. Verify DATABASE_URL is correct
3. Check database is accessible
4. Review deployment logs for specific error

### App Store Submission Fails
**Error:** "Invalid APK/IPA"

**Solution:**
1. Verify app icon is correct format
2. Check version number is unique
3. Ensure signing certificate is valid
4. Review store submission guidelines

### Apps Not Appearing in Store
**Timeline:** 24-48 hours typical

**If longer:**
1. Check submission status in store console
2. Verify app meets store guidelines
3. Review rejection reasons if any
4. Resubmit if needed

---

## Support Contacts

| Issue | Contact |
|-------|---------|
| Backend deployment | DevOps team |
| Mobile app build | Manus support |
| App Store issues | Apple/Google support |
| General questions | Product team |

---

## Final Checklist Before Clicking "Publish"

**Backend Service:**
- [ ] Dockerfile created and valid
- [ ] All environment variables set
- [ ] Build completed successfully
- [ ] Health check endpoint working
- [ ] Database migrations applied

**Mobile App:**
- [ ] Version 1.0.3 ready
- [ ] APK built and tested
- [ ] IPA built and tested
- [ ] Screenshots and description ready
- [ ] Privacy policy URL configured

**Documentation:**
- [ ] Deployment guide reviewed
- [ ] Runbook prepared
- [ ] Support contacts documented
- [ ] Monitoring set up
- [ ] Rollback plan ready

---

**Ready to publish? Follow the steps above in order.** ✅
