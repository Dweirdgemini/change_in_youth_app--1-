# Google Play Console Upload - Visual Step-by-Step Guide

## Phase 1: Download APK from EAS

### Step 1.1: Access EAS Dashboard
Navigate to **https://expo.dev/builds** and sign in with your Expo account. You'll see a list of all your builds organized by project.

### Step 1.2: Find Your Successful Build
Look for your latest Android build with a green checkmark (✓) indicating success. Click on it to view details.

### Step 1.3: Download APK
Click the **"Download"** button. Your browser will download the APK file (approximately 50-150 MB). Save it to a location you can easily access.

**Expected filename:** Something like `change-in-youth-1.0.0.apk` or similar.

---

## Phase 2: Upload APK to Google Play Console

### Step 2.1: Access Google Play Console
Go to **https://play.google.com/console** and sign in with your developer account (dej@changeinyouth.org.uk or your Google account).

### Step 2.2: Select Your App
From the dashboard, click on **"Change In Youth"** app to open it.

### Step 2.3: Navigate to Internal Testing
In the left sidebar menu, find **"Testing"** section and click **"Internal testing"**. This is where you'll upload your APK for closed testing.

### Step 2.4: Create New Release
Click the **"Create new release"** button. A dialog will appear with options to upload your APK.

### Step 2.5: Upload APK File
Click **"Browse files"** and select your downloaded APK, or drag and drop the APK file into the upload area. Google Play will begin scanning the file.

**Wait for:** Upload to complete (usually 1-2 minutes). You'll see a progress bar and then a green checkmark when successful.

### Step 2.6: Add Release Notes (Optional)
In the **"Release notes"** field, add a brief description:

```
Version 1.0.0 - Initial Closed Testing Release

Key Features:
- Team management and scheduling
- Task tracking and assignment
- Financial management and invoicing
- Budget monitoring and compliance tracking
- Team communication and analytics

This is a closed testing build for internal testers only.
Please report any issues or feedback.
```

### Step 2.7: Review Release
Click **"Review release"** to see a summary of your upload. Verify:
- APK file is listed
- Version number is correct (1.0.0)
- Release notes are visible
- No errors are shown

### Step 2.8: Start Rollout
Click **"Start rollout to Internal testing"** button. Your release is now submitted for Google Play review.

**Status:** Pending review (typically 2-4 hours)

---

## Phase 3: Add Testers to Internal Testing

### Step 3.1: Locate Testers Section
While still in **"Testing"** → **"Internal testing"**, scroll down to find the **"Testers"** section. You'll see an email input field.

### Step 3.2: Add First Tester
Click the email input field and type the first tester's email:
```
cindy@changeinyouth.org.uk
```
Press **Enter** or click **"Add"** button.

### Step 3.3: Add Remaining Testers
Repeat the process for each tester:

**Internal Team (Change In Youth):**
- angel@changeinyouth.org.uk
- demitra@changeinyouth.org.uk
- jm@changeinyouth.org.uk
- deji@changeinyouth.org.uk

**External Testers:**
- infotasiauk@gmail.com
- ceylanisnot@gmail.com
- yasmin.tayane@outlook.com
- abigailasantetalks@gmail.com

### Step 3.4: Verify All Testers Added
You should see all 9 email addresses listed in the testers section. Each will show a status:
- **Invited:** Google Play has sent an invitation
- **Accepted:** Tester has joined the testing group
- **Not accepted:** Tester hasn't responded yet

### Step 3.5: Automatic Invitations
Google Play automatically sends invitation emails to all added testers. They will receive an email with:
- Subject: "You're invited to test Change In Youth"
- Link to join the testing group
- Link to download the app from Google Play
- Your release notes

---

## Phase 4: Monitor Testing Progress

### Step 4.1: Check Tester Status
Return to **"Testing"** → **"Internal testing"** to see:
- How many testers have accepted invitations
- How many are still pending
- When each tester joined

### Step 4.2: View Crash Reports
Go to **"Quality"** → **"Crashes & ANRs"** to see if any testers reported crashes. This is critical for identifying bugs.

### Step 4.3: Read User Feedback
Navigate to **"Quality"** → **"User feedback"** to read comments and ratings from testers. Use this feedback to identify issues and improvements.

### Step 4.4: Monitor Install Metrics
Check **"Statistics"** → **"Installs"** to see how many testers have downloaded and installed the app.

---

## Phase 5: Handling Issues During Testing

### If a Tester Reports a Crash

**Step 1:** Go to **"Quality"** → **"Crashes & ANRs"** and review the crash report.

**Step 2:** Identify the issue in your code and fix it locally.

**Step 3:** Build a new APK:
```bash
eas build --platform android
```

**Step 4:** Upload the new APK to internal testing (repeat Phase 2).

**Step 5:** Notify testers that a new version is available.

### If a Tester Can't Download the App

**Possible causes:**
- Tester hasn't accepted the invitation
- Device doesn't meet minimum requirements (Android 8.0+)
- Google Play cache is corrupted

**Solution:**
- Ask tester to check their email for invitation
- Verify their device is running Android 8.0 or higher
- Ask them to clear Google Play cache: Settings → Apps → Google Play Store → Storage → Clear Cache

### If Testing Finds Multiple Issues

Create a prioritized list:
1. **Critical:** App crashes or doesn't start → Fix immediately
2. **High:** Major features don't work → Fix before production
3. **Medium:** UI/UX issues → Fix if time permits
4. **Low:** Minor improvements → Consider for future versions

---

## Phase 6: After Successful Testing

### Option A: Move to Production (Recommended)

**Step 1:** Create a new release in the **"Production"** track (not "Internal testing").

**Step 2:** Upload the same APK that passed testing.

**Step 3:** Complete all store listing requirements:
- App description
- Screenshots (5-8 recommended)
- Feature graphic
- Privacy policy
- Content rating

**Step 4:** Click **"Submit for review"**. Google Play will review (24-48 hours).

**Step 5:** Once approved, your app is live on Google Play Store!

### Option B: Continue Testing (If Issues Found)

**Step 1:** Fix the identified issues in your code.

**Step 2:** Build a new APK with the fixes.

**Step 3:** Upload to internal testing again.

**Step 4:** Notify testers to test the new version.

**Step 5:** Repeat until all issues are resolved.

---

## Timeline Reference

| Activity | Duration |
|----------|----------|
| Download APK from EAS | 5-10 minutes |
| Upload APK to Google Play | 1-2 minutes |
| Google Play Review | 2-4 hours |
| Tester Invitation Email | 5-15 minutes after approval |
| Tester Download & Install | 5-30 minutes per tester |
| Initial Testing Period | 24-48 hours |
| Feedback Collection | 3-7 days |
| Production Review | 24-48 hours |

---

## Important Reminders

**Do NOT:**
- Change the app name after uploading
- Change the package name after uploading
- Remove features that testers are using
- Upload unsigned or debug APKs
- Share APK outside of Google Play testing

**DO:**
- Keep testers informed of updates
- Respond to feedback promptly
- Test on multiple devices before uploading
- Keep version numbers consistent
- Document all changes between versions

---

## Contact Information for Testers

When notifying testers, you can use this template:

---

**Subject:** Change In Youth - Closed Testing Invitation

Hi [Tester Name],

You've been invited to participate in closed testing for the Change In Youth app on Google Play!

**What to do:**
1. Check your email for an invitation from Google Play
2. Click the link to join the testing group
3. Download the app from Google Play Store
4. Test the app and report any issues

**Important:** This is a closed testing build. Please do not share the app outside of this testing group.

**How to report issues:**
- In Google Play Store, go to the app page
- Scroll to "About this app" → "Send feedback"
- Describe the issue and include screenshots if possible

Thank you for helping us improve Change In Youth!

Best regards,
Change In Youth Team

---

**Last Updated:** 2026-02-17
**Status:** Ready for APK upload
