# Google Play Data Safety - Quick Reference Checklist

**For:** Change In Youth CIC Android App  
**Date:** February 24, 2026

---

## Before You Start

- [ ] Have the Google Play Console open
- [ ] Navigate to **App Content** → **Data Safety**
- [ ] Have `GOOGLE_PLAY_DATA_SAFETY_GUIDE.md` open for reference
- [ ] Have the Account Deletion Policy URL ready

---

## Step 1: Data Collection Declaration

**Question:** "Does your app collect or share any of the required user data?"

- [ ] Select **YES**

---

## Step 2: Data Types

**Question:** "Which data types does your app collect?"

**Select ONLY these:**

- [ ] ✅ **Account Information**
  - [ ] Email address (username)
  - [ ] Password (hashed)
  - Purpose: Account creation and authentication
  - Shared: NO
  - Retention: Until account deletion

- [ ] ✅ **App Activity** (if applicable)
  - [ ] App interactions
  - Purpose: Improving app functionality
  - Shared: NO
  - Retention: Aggregated, non-personally identifiable

**Do NOT select:**
- [ ] ❌ Precise location
- [ ] ❌ Coarse location
- [ ] ❌ Personal information (unless collected)
- [ ] ❌ Health & fitness
- [ ] ❌ Financial information
- [ ] ❌ Messages
- [ ] ❌ Photos & videos
- [ ] ❌ Audio files
- [ ] ❌ Contacts
- [ ] ❌ Calendar
- [ ] ❌ SMS
- [ ] ❌ Call logs
- [ ] ❌ Web browsing history
- [ ] ❌ Search history
- [ ] ❌ Identifiers
- [ ] ❌ Cookies
- [ ] ❌ Crash logs (unless explicitly collected)
- [ ] ❌ Diagnostics

---

## Step 3: Data Security

**Question:** "Is all of the user data you collect encrypted in transit?"

- [ ] Select **YES**
- [ ] Reason: HTTPS/TLS encryption

---

## Step 4: Account Deletion Mechanism

**Question:** "Do you have a mechanism in place for users to request deletion of their data?"

- [ ] Select **YES**
- [ ] Add URL to Account Deletion Policy (see Step 7)

---

## Step 5: Account Creation Method

**Question:** "How do users create an account in your app?"

- [ ] Select **Username and Password**
- [ ] Do NOT select OAuth or third-party login

---

## Step 6: Data Retention

**Question:** "How long is user data retained?"

- [ ] Select **Until Account Deletion Request**
- [ ] Add note: "Personal data deleted within 30 days. Financial records retained for 7 years per UK law. Aggregated analytics retained indefinitely."

---

## Step 7: Account Deletion Policy URL

**Question:** "Provide a link to your account deletion policy"

**Choose ONE option:**

### Option A: Google Docs (Fastest)
- [ ] Create new Google Doc
- [ ] Copy content from `ACCOUNT_DELETION_POLICY.md`
- [ ] Share: "Anyone with link can view"
- [ ] Copy shareable link
- [ ] Paste link into Google Play Console

### Option B: Static Website
- [ ] Upload `account-deletion-policy.html` to your server
- [ ] Verify publicly accessible
- [ ] Copy full URL
- [ ] Paste into Google Play Console

### Option C: GitHub Pages
- [ ] Create repository
- [ ] Upload HTML file
- [ ] Enable GitHub Pages
- [ ] Copy GitHub Pages URL
- [ ] Paste into Google Play Console

**Test the URL:**
- [ ] Click the link in an incognito/private browser window
- [ ] Verify page loads and is readable
- [ ] Verify no login required

---

## Step 8: Third-Party Sharing

**Question:** "Do you share user data with third parties?"

- [ ] Select **NO**

---

## Step 9: Sensitive Permissions

**Question:** "Does your app request any sensitive permissions?"

- [ ] Review your app's permissions in `app.config.ts`
- [ ] If NO sensitive permissions: Select **NO**
- [ ] If YES (camera, microphone, etc.): Select **YES** and explain purpose

---

## Step 10: Review & Submit

- [ ] Review all answers for accuracy
- [ ] Verify Account Deletion Policy URL is working
- [ ] Check that no contradictions exist between answers
- [ ] Click **Save** or **Submit**
- [ ] Wait for Google Play review (typically 24-48 hours)

---

## After Submission

- [ ] Monitor Google Play Console for approval
- [ ] Check email for any compliance questions
- [ ] If rejected, review feedback and update answers
- [ ] Resubmit if required

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Policy URL not accessible" | Verify URL is public (no login required). Test in incognito window. |
| "Data types don't match app behavior" | Review `GOOGLE_PLAY_DATA_SAFETY_GUIDE.md` and update form. |
| "Missing account deletion mechanism" | Ensure Account Deletion Policy URL is provided and working. |
| "Encryption not specified" | Confirm HTTPS is used for all data transmission. |
| "Conflicting answers" | Review all answers for consistency. |

---

## Support Contacts

- **Google Play Support:** [support.google.com/googleplay](https://support.google.com/googleplay)
- **Data Safety Questions:** [Google Play Data Safety Guide](https://support.google.com/googleplay/android-developer/answer/10787469)
- **App Support Email:** support@changeinyouth.org.uk
- **Privacy Email:** privacy@changeinyouth.org.uk

---

## Files Reference

- `ACCOUNT_DELETION_POLICY.md` — Full policy text (copy into Google Doc)
- `account-deletion-policy.html` — Styled HTML version (upload to web server)
- `GOOGLE_PLAY_DATA_SAFETY_GUIDE.md` — Detailed compliance guide
- `PRIVACY_POLICY.md` — General privacy policy (separate from account deletion)

---

**Status:** ✅ Ready for Google Play Submission

