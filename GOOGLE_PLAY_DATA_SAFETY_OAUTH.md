# Google Play Data Safety Form - OAuth Authentication

## Quick Reference: What to Select

Based on your app's actual authentication method (OAuth only), here's what to select in Google Play Console's Data Safety section.

---

## 1. Data Collection & Safety

### Question: "Does your app collect or share any of the required user data types?"

**Answer: YES**

---

## 2. Data Types Collected

Select ONLY the following (do NOT select others):

### ✅ SELECT THESE:

1. **Account Information**
   - Type: Email address
   - Purpose: Authentication & account management
   - Shared with third parties: No
   - Retained: Until account deletion

2. **App Activity**
   - Type: App interactions & feature usage
   - Purpose: Analytics & service improvement
   - Shared with third parties: No
   - Retained: For analytics purposes

### ❌ DO NOT SELECT:

- ❌ Contacts
- ❌ Calendar
- ❌ Photos & videos
- ❌ Audio files
- ❌ Location
- ❌ Health & fitness
- ❌ Financial information
- ❌ Messages
- ❌ Files & documents
- ❌ Search history
- ❌ Web browsing history
- ❌ Identifiers
- ❌ Precise location
- ❌ Approximate location
- ❌ Device or other IDs
- ❌ Cookies or similar technologies
- ❌ Advertising ID
- ❌ User IDs
- ❌ Crash logs
- ❌ Diagnostics
- ❌ Other app performance data

---

## 3. Security & Encryption

### Question: "Is data encrypted in transit?"

**Answer: YES**

- All API communication uses HTTPS/TLS
- OAuth tokens transmitted over secure channels
- Session tokens stored securely

### Question: "Is data encrypted at rest?"

**Answer: YES** (if applicable to your backend)

- Database encryption enabled
- Sensitive fields encrypted

---

## 4. Authentication Method

### Question: "How do users sign in?"

**Answer: Third-party authentication (OAuth)**

- Google OAuth
- Microsoft OAuth
- Apple OAuth

**Do NOT claim:**
- ❌ Username/password authentication
- ❌ Email magic links
- ❌ Phone number authentication

---

## 5. Account Deletion

### Question: "Can users request deletion of their account and data?"

**Answer: YES**

**Deletion Method:**
- In-app: More → Settings → Delete Account
- Email: support@changeinyouth.org.uk

**Deletion Timeline:** Immediate (within 30 days for backups)

**Policy URL:** [Paste your hosted Account Deletion Policy URL here]

---

## 6. Data Sharing

### Question: "Do you share user data with third parties?"

**Answer: NO**

- Email addresses are NOT shared with third parties
- OAuth providers (Google, Microsoft, Apple) receive only what's necessary for authentication
- No data brokers or analytics companies receive personal data

---

## 7. Data Retention

### Question: "How long do you retain user data?"

**Answer:**

- **Active accounts:** Data retained while account is active
- **Deleted accounts:** Personal data deleted immediately; audit logs retained for 90 days
- **Backups:** May exist for up to 30 days

---

## 8. Privacy Policy

### Question: "Do you have a privacy policy?"

**Answer: YES**

**Include in your privacy policy:**
- Data collection practices
- Account deletion process
- Data retention periods
- User rights under GDPR
- Contact information for privacy inquiries

---

## 9. Restricted Data Use

### Question: "Do you use restricted data types?"

**Answer: NO**

Your app does NOT use:
- ❌ Phone numbers (for contact)
- ❌ Precise location
- ❌ Health/fitness data
- ❌ Financial information
- ❌ Sensitive personal information

---

## 10. Compliance Checklist

Before submitting to Google Play:

- [ ] Account Deletion Policy is published and accessible
- [ ] Delete Account feature is working in-app
- [ ] API endpoint `/api/v1/users/me` (DELETE) is functional
- [ ] Email confirmation is required for deletion
- [ ] Audit logs are in place
- [ ] HTTPS/TLS is enforced for all API calls
- [ ] OAuth providers are properly configured
- [ ] Privacy policy mentions account deletion
- [ ] Support email is monitored (support@changeinyouth.org.uk)
- [ ] Test deletion on iOS and Android

---

## 11. Common Mistakes to Avoid

❌ **DON'T claim username/password auth** if you only use OAuth

❌ **DON'T select data types you don't actually collect**

❌ **DON'T forget the Account Deletion Policy URL**

❌ **DON'T say deletion takes weeks** if it's immediate

❌ **DON'T claim data encryption if it's not implemented**

---

## 12. Support Email Template

If users contact you about deletion:

```
Subject: Account Deletion Request

Thank you for contacting us. We can help you delete your account.

Option 1 (Recommended): Use the in-app Delete Account feature
- Open the app
- Go to More → Settings
- Tap "Delete Account"
- Enter your email to confirm
- Your account will be deleted immediately

Option 2: Email confirmation
- Reply to this email confirming your request
- Include the email address associated with your account
- We will process your request within 30 days

Your personal data will be permanently deleted. Audit logs may be retained for compliance purposes.

Best regards,
Change In Youth Support Team
```

---

## 13. Testing Before Submission

1. **Create a test account** using OAuth
2. **Navigate to More → Settings**
3. **Tap Delete Account**
4. **Enter your email** and confirm deletion
5. **Verify in database** that:
   - `deletedAt` field is set
   - Name is anonymized
   - Email is anonymized
   - Profile image is removed
6. **Try to log in** with the deleted account (should fail)

---

## 14. Post-Submission

After Google Play approves your app:

1. Monitor deletion requests via logs
2. Respond to support emails within 24-48 hours
3. Keep audit logs for 90 days minimum
4. Update privacy policy if practices change
5. Test deletion quarterly to ensure it's working

---

**Last Updated:** February 24, 2026
