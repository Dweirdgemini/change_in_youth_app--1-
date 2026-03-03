# How to Build APK Using Manus Publishing UI

## Overview
Manus has a built-in Publishing feature that builds your Android APK without needing EAS CLI. This is the easiest way to get your APK.

---

## Step 1: Access Manus Dashboard

### 1.1: Go to Manus Home
Navigate to **https://manus.im** in your browser.

### 1.2: Log In
Sign in with your Manus account (if not already logged in).

### 1.3: Find Your Project
You should see your project **"Change In Youth"** in your workspace. Click on it to open the project dashboard.

---

## Step 2: Locate the Publish Button

### 2.1: Look for the Publish Button
In the **top-right corner** of the Manus dashboard, you should see a **"Publish"** button (or similar).

**Location:** Top-right of the screen, next to settings icon (⚙️)

### 2.2: Click the Publish Button
Click on **"Publish"** to open the publishing options.

**What you'll see:** A dropdown menu or modal with options for different platforms.

---

## Step 3: Select Android Platform

### 3.1: Choose Android
From the publishing options, select **"Android"**.

**Options you might see:**
- iOS
- Android ← **Select this**
- Web

### 3.2: Wait for Android Options to Load
After selecting Android, you'll see options for the build type.

---

## Step 4: Select Build Type (APK vs AAB)

### 4.1: Choose APK for Testing
For closed testing on Google Play, select **"APK"**.

**Why APK?**
- **APK:** Smaller file, faster build, good for testing
- **AAB:** Optimized for production, required for Google Play Store final release

**For now:** Select **"APK"** for your closed testing build.

### 4.2: Confirm Selection
Click **"APK"** or **"Build APK"** button.

---

## Step 5: Start the Build

### 5.1: Click Build Button
You should see a **"Build"** or **"Start Build"** button. Click it.

### 5.2: Confirm Build Settings
You might see a confirmation dialog showing:
- Platform: Android
- Build Type: APK
- Version: 1.0.0
- App Name: Change In Youth

Click **"Confirm"** or **"Start Build"** to begin.

### 5.3: Build Started
You'll see a message like:
```
Build started for Android APK
Build ID: expo-build-xxxxx
Status: In Progress
```

---

## Step 6: Monitor Build Progress

### 6.1: Wait for Build to Complete
The build typically takes **10-20 minutes**. You'll see a progress indicator showing:
- Downloading dependencies
- Compiling code
- Building APK
- Finalizing

### 6.2: Check Build Status
The status will change from:
- 🟡 **In Progress** → 🟢 **Completed** (if successful)
- 🟡 **In Progress** → 🔴 **Failed** (if there's an error)

### 6.3: If Build Fails
If you see a red error message, note the error and contact support or check the error logs.

---

## Step 7: Download Your APK

### 7.1: Build Completed Successfully
Once the build shows **"Completed"** with a green checkmark, you'll see a **"Download"** button.

### 7.2: Click Download
Click the **"Download"** button to download your APK file.

**File size:** Typically 50-150 MB

### 7.3: Save the APK
Your browser will download the APK. Save it to a location you can easily access (e.g., Downloads folder).

**Filename:** Something like `change-in-youth-1.0.0.apk`

---

## Step 8: Verify APK Downloaded

### 8.1: Check Your Downloads
Open your Downloads folder and verify the APK file is there.

### 8.2: Check File Size
The APK should be:
- **Minimum:** 30 MB
- **Typical:** 50-150 MB
- **Maximum:** 200 MB

If it's much smaller or larger, something might be wrong.

---

## Troubleshooting

### Build Fails with "pnpm install failed"
**Solution:**
- Click **"Retry Build"** button
- Wait for retry to complete
- If it fails again, contact Manus support

### Build Takes Too Long (> 30 minutes)
**Solution:**
- The build might be stuck
- Click **"Cancel Build"** and try again
- Check your internet connection

### Can't Find Publish Button
**Solution:**
- Refresh the page (F5 or Cmd+R)
- Make sure you're on the project dashboard (not workspace)
- Check if you have permission to publish (ask your admin)

### Download Button Doesn't Work
**Solution:**
- Try a different browser (Chrome, Firefox, Safari)
- Clear browser cache and try again
- Contact Manus support

---

## After Downloading APK

Once you have the APK file, follow these steps:

### 1. Upload to Google Play Console
- Go to https://play.google.com/console
- Select your app "Change In Youth"
- Go to "Testing" → "Internal testing"
- Click "Create new release"
- Upload the APK file
- Add testers (9 emails)
- Click "Start rollout"

### 2. Testers Receive Invitations
- Google Play sends emails to all 9 testers
- Testers click link to join testing group
- Testers download app from Google Play Store

### 3. Monitor Testing
- Check crash reports in Google Play Console
- Read tester feedback
- Fix any issues found

---

## Quick Reference

| Step | Action | Time |
|------|--------|------|
| 1 | Go to Manus dashboard | 1 min |
| 2 | Click Publish button | 1 min |
| 3 | Select Android → APK | 1 min |
| 4 | Click Build | 1 min |
| 5 | Wait for build | 10-20 min |
| 6 | Download APK | 2-5 min |
| 7 | Upload to Google Play | 5-10 min |
| 8 | Add testers | 5 min |
| **Total** | | **30-50 min** |

---

## Important Notes

✅ **DO:**
- Use APK for testing (faster)
- Use AAB for production release
- Keep your APK file safe
- Test on multiple devices
- Monitor crash reports

❌ **DO NOT:**
- Share APK outside of Google Play testing
- Upload unsigned APKs
- Change app name after uploading
- Delete APK after uploading (keep backup)

---

## Support

If you encounter issues:
1. Check the error message carefully
2. Try the troubleshooting steps above
3. Contact Manus support at https://help.manus.im
4. Include the build ID (e.g., expo-build-xxxxx)

---

**Last Updated:** 2026-02-18
**Status:** Ready to build
