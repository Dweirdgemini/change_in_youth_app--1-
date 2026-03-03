# Google Play Data Safety Compliance Guide

**Internal Reference Document**  
**Last Updated:** February 24, 2026

---

## Overview

This document provides the exact answers to select in the Google Play Console Data Safety form based on the app's actual data collection, transmission, and retention practices.

**App Authentication Method:** Username/Email + Password (no OAuth)  
**Data Transmission:** HTTPS (encrypted in transit)  
**Account Deletion:** Email-based request process

---

## Google Play Data Safety Form - Exact Answers

### Section 1: Data Collection

**Question: "Does your app collect or share any of the required user data?"**

**Answer: YES**

**Reason:** The app collects account creation data (email/username and password) which is required for authentication.

---

### Section 2: Data Types Collected

When prompted to select which data types your app collects, select **ONLY**:

#### ✅ **Account & Authentication Data**
- **Type:** Account Information
- **Data Collected:** 
  - Email address (username)
  - Password (hashed)
- **Purpose:** Account creation and authentication
- **Shared with Third Parties:** NO
- **Retention:** Until account deletion request

---

#### ✅ **App Activity Data** (if applicable)
- **Type:** App Activity
- **Data Collected:** 
  - User interactions within the app (feature usage, navigation patterns)
- **Purpose:** Improving app functionality and performance
- **Shared with Third Parties:** NO
- **Retention:** Aggregated, non-personally identifiable data retained indefinitely

---

#### ❌ **DO NOT SELECT:**
- Precise location
- Coarse location
- Personal information (name, phone, address) — unless explicitly collected
- Health & fitness
- Financial information (unless app handles payments)
- Messages
- Photos & videos
- Audio files
- Contacts
- Calendar
- SMS
- Call logs
- Web browsing history
- Search history
- Identifiers
- Cookies
- Crash logs (unless you explicitly collect them)
- Diagnostics

---

### Section 3: Data Security

**Question: "Is all of the user data you collect encrypted in transit?"**

**Answer: YES**

**Reason:** All data is transmitted over HTTPS with TLS encryption.

---

**Question: "Do you have a mechanism in place for users to request deletion of their data?"**

**Answer: YES**

**Reason:** Users can request account deletion via email (support@changeinyouth.org.uk). See `ACCOUNT_DELETION_POLICY.md` for details.

---

### Section 4: Account Creation

**Question: "How do users create an account in your app?"**

**Answer: Username and Password**

**Details:**
- Users provide an email address (username)
- Users create a password
- No OAuth or third-party login methods are used
- Account is created directly in the app

---

### Section 5: Data Retention

**Question: "How long is user data retained?"**

**Answer: Until Account Deletion Request**

**Details:**
- **Active Accounts:** Data retained while account is active
- **After Deletion Request:** 
  - Personal data deleted within 30 days
  - Aggregated analytics retained indefinitely (non-personally identifiable)
  - Financial records retained for 7 years (UK tax law requirement)
  - Backup data retained for up to 90 days
  - Support communications retained for dispute resolution

---

### Section 6: Third-Party Sharing

**Question: "Do you share user data with third parties?"**

**Answer: NO**

**Details:**
- No data is shared with third-party services for marketing, advertising, or analytics
- No third-party SDKs that collect personal data
- No data brokers or data aggregators
- Data remains entirely within the app's backend infrastructure

---

### Section 7: Sensitive Permissions

**Question: "Does your app request any sensitive permissions?"**

**Answer: NO** (unless your app uses camera, microphone, contacts, etc.)

**Note:** If your app uses camera or other sensitive permissions, update this answer and explain the purpose in the Data Safety form.

---

## Hosting the Account Deletion Policy

### Option 1: Google Docs (Recommended for Quick Setup)

1. Go to [Google Docs](https://docs.google.com)
2. Create a new document
3. Copy the content from `ACCOUNT_DELETION_POLICY.md`
4. Paste into the Google Doc
5. Click **Share** → Set to "Anyone with the link can view"
6. Copy the shareable link
7. In Google Play Console:
   - Go to **App Content** → **Data Safety**
   - Paste the link in the "Account Deletion Policy" field

### Option 2: Static Website

1. Upload `account-deletion-policy.html` to your web server
2. Ensure the page is publicly accessible (no authentication required)
3. Copy the full URL (e.g., `https://changeinyouth.org.uk/account-deletion-policy`)
4. In Google Play Console, paste the URL in the "Account Deletion Policy" field

### Option 3: GitHub Pages

1. Create a new repository: `changeinyouth.github.io`
2. Upload `account-deletion-policy.html` as `index.html`
3. Enable GitHub Pages in repository settings
4. Copy the GitHub Pages URL
5. Paste into Google Play Console

---

## Complete Google Play Data Safety Checklist

- [ ] **Data Types:** Selected ONLY "Account Information" and "App Activity"
- [ ] **Encryption:** Confirmed all data encrypted in transit (HTTPS)
- [ ] **Account Deletion:** Confirmed mechanism exists (email-based request)
- [ ] **Account Creation:** Selected "Username and Password"
- [ ] **Third-Party Sharing:** Confirmed NO
- [ ] **Data Retention:** Specified "Until Account Deletion Request"
- [ ] **Sensitive Permissions:** Reviewed and updated if needed
- [ ] **Policy URL:** Added link to Account Deletion Policy
- [ ] **Tested Policy URL:** Verified the link is publicly accessible
- [ ] **Reviewed All Answers:** Confirmed accuracy before submission

---

## Important Notes

### ⚠️ Accuracy is Critical

Google Play takes data safety declarations seriously. Inaccurate information can result in:
- App removal from Google Play Store
- Developer account suspension
- Legal liability

### ✅ If You Add New Features

If you add new data collection in the future (e.g., camera, contacts, location), you **MUST**:

1. Update the Data Safety form with new data types
2. Explain the purpose of data collection
3. Update this guide
4. Update the privacy policy
5. Resubmit to Google Play for review

### ✅ Regular Audits

Review the Data Safety form **quarterly** to ensure:
- All answers remain accurate
- No new data collection has been added without updating the form
- Privacy policy is current and accessible

---

## Support & Questions

For questions about Google Play Data Safety requirements, refer to:
- [Google Play Data Safety Guide](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play Privacy Policy Requirements](https://support.google.com/googleplay/android-developer/answer/10144311)
- [UK GDPR Compliance](https://ico.org.uk/for-organisations/guide-to-data-protection/)

---

## Version History

| Date | Changes |
|------|---------|
| 2026-02-24 | Initial version: Account deletion policy and Google Play compliance guide created |

