# Google Play Console Upload & Closed Testing Guide

## Overview
This guide walks you through uploading your APK to Google Play Console and setting up closed testing with your 9 testers.

---

## Part 1: Download Your APK from EAS

### Step 1: Access EAS Build Dashboard
1. Go to **https://expo.dev/builds**
2. Sign in with your Expo account
3. Find your latest successful Android build

### Step 2: Download the APK
1. Click on the successful build
2. Click **"Download"** button
3. Save the APK file (e.g., `change-in-youth-1.0.0.apk`)

**File Size:** Typically 50-150 MB

---

## Part 2: Upload APK to Google Play Console

### Prerequisites
- ✅ Google Play Developer Account ($25 one-time fee)
- ✅ App created in Google Play Console
- ✅ App details filled out (name, description, screenshots, etc.)

### Step 1: Access Google Play Console
1. Go to **https://play.google.com/console**
2. Sign in with your Google account (dej@changeinyouth.org.uk or your developer account)
3. Select your app: **"Change In Youth"**

### Step 2: Navigate to Internal Testing Track
1. In the left sidebar, click **"Testing"** → **"Internal testing"**
2. You should see an empty release section

### Step 3: Create a New Release
1. Click **"Create new release"** button
2. You'll see the upload section

### Step 4: Upload the APK
1. Click **"Browse files"** or drag-and-drop the APK
2. Select your downloaded APK file
3. Wait for the upload to complete (usually 1-2 minutes)

**What to expect:**
- Google Play will scan the APK for security issues
- It will extract app details (version, permissions, etc.)
- You'll see a green checkmark when upload is successful

### Step 5: Add Release Notes (Optional but Recommended)
1. In the **"Release notes"** section, add:
   ```
   Version 1.0.0 - Initial Closed Testing Release
   
   Features:
   - Team management and scheduling
   - Task tracking and assignment
   - Financial management and invoicing
   - Budget monitoring and compliance tracking
   - Team communication and analytics
   
   This is a closed testing build for internal testers only.
   ```

### Step 6: Review and Confirm
1. Review all the information
2. Click **"Review release"** button
3. Verify everything looks correct
4. Click **"Start rollout to Internal testing"** button

**Status:** Your release is now pending review (usually 2-4 hours)

---

## Part 3: Add Testers to Internal Testing Group

### Step 1: Access Testers Section
1. Still in **"Testing"** → **"Internal testing"**
2. Scroll down to **"Testers"** section
3. You'll see an email input field

### Step 2: Add Individual Testers
1. Click the email input field
2. Enter the first tester email:
   ```
   cindy@changeinyouth.org.uk
   ```
3. Press **Enter** or click **"Add"**
4. Repeat for each tester:
   - angel@changeinyouth.org.uk
   - demitra@changeinyouth.org.uk
   - jm@changeinyouth.org.uk
   - deji@changeinyouth.org.uk
   - infotasiauk@gmail.com
   - ceylanisnot@gmail.com
   - yasmin.tayane@outlook.com
   - abigailasantetalks@gmail.com

### Step 3: Verify Testers Added
1. You should see all 9 emails listed in the testers section
2. Each email should show a status (usually "Invited" or "Accepted")

### Step 4: Send Invitations
1. Google Play automatically sends invitations when you add testers
2. Testers will receive an email with:
   - Link to join the testing group
   - Link to download the app from Google Play
   - Release notes

---

## Part 4: Tester Email List Reference

| # | Email | Organization |
|---|-------|---------------|
| 1 | cindy@changeinyouth.org.uk | Change In Youth |
| 2 | angel@changeinyouth.org.uk | Change In Youth |
| 3 | demitra@changeinyouth.org.uk | Change In Youth |
| 4 | jm@changeinyouth.org.uk | Change In Youth |
| 5 | deji@changeinyouth.org.uk | Change In Youth |
| 6 | infotasiauk@gmail.com | External |
| 7 | ceylanisnot@gmail.com | External |
| 8 | yasmin.tayane@outlook.com | External (Yasmin Tayane) |
| 9 | abigailasantetalks@gmail.com | External (Abigail Asante) |

---

## Part 5: Monitor Testing Progress

### Check Tester Status
1. Go to **"Testing"** → **"Internal testing"**
2. Look at the **"Testers"** section to see:
   - How many testers have accepted
   - How many are still pending
   - When they joined

### View Crash Reports
1. Go to **"Quality"** → **"Crashes & ANRs"**
2. Monitor for any crashes reported by testers
3. Fix issues and upload new APK to internal testing

### View Feedback
1. Go to **"Quality"** → **"User feedback"**
2. Read comments and ratings from testers
3. Use feedback to improve the app

---

## Part 6: Troubleshooting

### Issue: APK Upload Fails
**Solution:**
- Verify APK is for Android (not iOS)
- Check file size is under 4 GB
- Ensure APK is signed correctly
- Try uploading again or contact EAS support

### Issue: Testers Not Receiving Invitations
**Solution:**
- Verify email addresses are correct
- Check spam/junk folders
- Resend invitation manually:
  1. Go to Internal testing
  2. Click on tester email
  3. Click "Resend invitation"

### Issue: Tester Can't Download App
**Solution:**
- Verify tester has accepted the invitation
- Check they're using a Google Play account
- Ensure device meets minimum requirements (Android 8.0+)
- Ask tester to clear Google Play cache:
  1. Settings → Apps → Google Play Store
  2. Storage → Clear Cache
  3. Try downloading again

### Issue: App Crashes on Tester Device
**Solution:**
- Check crash reports in Quality section
- Fix the issue locally
- Build new APK with fix
- Upload to internal testing
- Notify testers of new version

---

## Part 7: After Closed Testing

### If Testing is Successful
1. Create a new release in **"Production"** track
2. Upload the same APK
3. Fill out store listing details
4. Submit for review (takes 24-48 hours)

### If Issues Found
1. Fix the issues in your code
2. Build new APK with `eas build --platform android`
3. Upload new APK to internal testing
4. Notify testers to test again

---

## Timeline Expectations

| Step | Time |
|------|------|
| APK Upload | 1-2 minutes |
| Google Play Review | 2-4 hours |
| Tester Invitation Delivery | 5-15 minutes |
| Tester Download & Install | 5-30 minutes (varies by device) |
| Initial Testing | 24-48 hours |
| Feedback Collection | 3-7 days |
| Production Release Review | 24-48 hours |

---

## Important Notes

⚠️ **Do NOT:**
- Change app name or package name after upload
- Remove features that testers are using
- Upload unsigned APKs
- Share APK outside of Google Play testing

✅ **DO:**
- Keep testers informed of updates
- Respond to feedback quickly
- Test on multiple devices before uploading
- Keep version numbers consistent

---

## Support & Resources

- **Google Play Help:** https://support.google.com/googleplay/android-developer
- **EAS Documentation:** https://docs.expo.dev/eas/
- **Expo Community:** https://forums.expo.dev

---

## Quick Reference: Your App Details

| Detail | Value |
|--------|-------|
| App Name | Change In Youth |
| Package Name | space.manus.change_in_youth_app.t20260109113652 |
| Version | 1.0.0 |
| Min Android | 8.0 (API 26) |
| Target Android | 14.0 (API 34) |
| Testers | 9 |
| Testing Track | Internal |

---

**Last Updated:** 2026-02-17
**Status:** Ready for APK upload
