# Delete Account Feature - Rollout Plan & Verification

## Overview

This document outlines the rollout strategy, testing checklist, and verification procedures for the new in-app account deletion feature.

---

## Phase 1: Internal Testing (Week 1)

### Objectives
- Verify feature works end-to-end
- Confirm database changes are applied
- Validate API responses
- Test on iOS and Android

### Testing Checklist

#### Database Migration
- [ ] Run `pnpm db:push` successfully
- [ ] Verify `deletedAt` column exists in `users` table
- [ ] Confirm no foreign key constraint errors

#### Backend API Testing

**Test 1: Successful Deletion**
```bash
curl -X DELETE http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"confirmEmail":"user@example.com"}'
```
- [ ] Returns 200 status
- [ ] Response includes `status: "deleted"`
- [ ] Response includes `deletedAt` timestamp
- [ ] User PII is anonymized in database

**Test 2: Email Mismatch**
```bash
curl -X DELETE http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"confirmEmail":"wrong@example.com"}'
```
- [ ] Returns 400 status
- [ ] Error message indicates email mismatch
- [ ] User account is NOT deleted

**Test 3: Unauthenticated Request**
```bash
curl -X DELETE http://localhost:3000/api/v1/users/me \
  -H "Content-Type: application/json" \
  -d '{"confirmEmail":"user@example.com"}'
```
- [ ] Returns 401 status
- [ ] Error message indicates authentication required

**Test 4: Idempotency**
```bash
# Call deletion twice with same user
curl -X DELETE http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"confirmEmail":"user@example.com"}'

# Second call
curl -X DELETE http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"confirmEmail":"user@example.com"}'
```
- [ ] First call returns 200 with `status: "deleted"`
- [ ] Second call returns 200 with `status: "already_deleted"`
- [ ] No errors on second call

#### Frontend UI Testing

**Test 5: Modal Appears**
- [ ] Navigate to More → Settings
- [ ] Tap "Delete Account" button
- [ ] Modal appears with warning text
- [ ] Email field is pre-filled with user email

**Test 6: Email Validation**
- [ ] Leave email field empty, Delete button is disabled
- [ ] Enter wrong email, Delete button is enabled but shows error on tap
- [ ] Enter correct email (case-insensitive), Delete button is enabled

**Test 7: Successful Deletion Flow**
- [ ] Enter correct email
- [ ] Tap "Delete permanently"
- [ ] Loading spinner appears
- [ ] Success alert appears
- [ ] User is signed out automatically
- [ ] App navigates to login screen

**Test 8: Error Handling**
- [ ] Simulate network error, error message appears
- [ ] Simulate 500 error, user-friendly error message appears
- [ ] Cancel button closes modal without deleting

#### Database Verification

After successful deletion:
```sql
SELECT id, name, email, deletedAt FROM users WHERE id = <user_id>;
```
- [ ] `deletedAt` is set to current timestamp
- [ ] `name` contains "Deleted User"
- [ ] `email` contains "deleted.local"
- [ ] `profileImageUrl` is NULL

#### Session Invalidation

After deletion:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <deleted_user_token>"
```
- [ ] Returns 401 Unauthorized
- [ ] User cannot make authenticated API calls

---

## Phase 2: Closed Testing (Week 2)

### Objectives
- Test with real users in closed beta
- Gather feedback on UX
- Monitor for unexpected issues
- Verify email support process

### Participants
- [ ] 3-5 internal team members
- [ ] 5-10 trusted external beta testers

### Testing Tasks
- [ ] Each tester deletes their own account
- [ ] Collect feedback on modal clarity
- [ ] Verify support email responses
- [ ] Monitor server logs for errors
- [ ] Check audit logs for deletion records

### Success Criteria
- [ ] 100% of testers successfully delete accounts
- [ ] No crashes or errors in logs
- [ ] All deleted users have `deletedAt` set
- [ ] All deleted users cannot log back in
- [ ] Support emails are processed within 24 hours

---

## Phase 3: Production Deployment (Week 3)

### Pre-Deployment Checklist

#### Code Review
- [ ] Backend code reviewed by 2+ engineers
- [ ] Frontend code reviewed by 2+ engineers
- [ ] Tests pass in CI/CD pipeline
- [ ] No TypeScript errors
- [ ] No console warnings

#### Documentation
- [ ] Account Deletion Policy published
- [ ] Google Play Data Safety form completed
- [ ] Release notes prepared
- [ ] Support team trained on deletion requests

#### Monitoring
- [ ] Error tracking configured (Sentry/similar)
- [ ] Audit logs configured
- [ ] Database backups verified
- [ ] Rollback plan documented

### Deployment Steps

1. **Merge to main branch**
   - [ ] PR approved
   - [ ] All tests passing
   - [ ] Code review complete

2. **Deploy backend**
   - [ ] Run database migration: `pnpm db:push`
   - [ ] Deploy API server
   - [ ] Verify health check: `GET /api/health`
   - [ ] Test delete endpoint manually

3. **Deploy frontend**
   - [ ] Build mobile app
   - [ ] Test on iOS simulator
   - [ ] Test on Android emulator
   - [ ] Verify modal appears and works

4. **Monitor for 24 hours**
   - [ ] Check error logs every 2 hours
   - [ ] Monitor deletion requests
   - [ ] Respond to support emails
   - [ ] Track user feedback

### Rollback Plan

If critical issues occur:

1. **Immediate actions**
   - [ ] Disable delete account button (feature flag)
   - [ ] Post-message to users explaining temporary unavailability
   - [ ] Investigate root cause

2. **Rollback steps**
   - [ ] Revert code to previous version
   - [ ] Restore database from backup if needed
   - [ ] Redeploy frontend without delete feature
   - [ ] Notify users that feature is back online

---

## Phase 4: Post-Launch Monitoring (Ongoing)

### Daily Tasks (First Week)
- [ ] Check error logs for deletion-related errors
- [ ] Monitor deletion request volume
- [ ] Respond to support emails
- [ ] Track user feedback

### Weekly Tasks
- [ ] Review deletion audit logs
- [ ] Verify all deletions are complete
- [ ] Check for any database anomalies
- [ ] Update documentation if needed

### Monthly Tasks
- [ ] Generate deletion report (count, timestamps)
- [ ] Review support tickets related to deletion
- [ ] Verify backup deletion process
- [ ] Test deletion on new app versions

---

## Verification Checklist

### Before Google Play Submission

- [ ] Account Deletion Policy is published and publicly accessible
- [ ] Delete Account button appears in More → Settings
- [ ] Modal shows correct warning text
- [ ] Email confirmation is required
- [ ] API endpoint responds correctly
- [ ] PII is anonymized after deletion
- [ ] User cannot log in after deletion
- [ ] Audit logs are created
- [ ] All tests pass
- [ ] No console errors or warnings

### After Google Play Approval

- [ ] Monitor deletion requests in logs
- [ ] Respond to support emails within 24 hours
- [ ] Verify deletion completeness monthly
- [ ] Update privacy policy if practices change
- [ ] Test deletion quarterly on new devices

---

## Support Email Template

**Subject:** Account Deletion Request

```
Thank you for contacting us regarding account deletion.

We can help you delete your account in two ways:

**Option 1: In-App Deletion (Recommended)**
1. Open the Change In Youth app
2. Go to More → Settings
3. Tap "Delete Account"
4. Enter your email to confirm
5. Your account will be deleted immediately

**Option 2: Email-Based Deletion**
Reply to this email with:
- Your full name
- Email address associated with your account
- Confirmation that you want to delete your account

We will process your request within 30 days and confirm deletion via email.

Once deleted, your account cannot be recovered. All personal data will be permanently removed.

If you have any questions, please reply to this email.

Best regards,
Change In Youth Support Team
support@changeinyouth.org.uk
```

---

## Metrics to Track

- **Deletion requests per week** — Monitor usage
- **Successful deletions** — Percentage of requests that complete
- **Failed deletions** — Investigate any errors
- **Support emails** — Response time and resolution
- **User feedback** — Sentiment and suggestions
- **Error rate** — Monitor for bugs

---

## Contacts

- **Backend Lead:** [Name]
- **Frontend Lead:** [Name]
- **QA Lead:** [Name]
- **Support Lead:** [Name]
- **Product Manager:** [Name]

---

**Last Updated:** February 24, 2026
