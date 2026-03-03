# Release Notes: Account Deletion Feature

**Version:** 1.1.0  
**Release Date:** February 24, 2026  
**Type:** Feature Release

---

## Summary

This release introduces a new in-app account deletion feature that allows users to permanently delete their accounts and personal data. This feature is required for Google Play Data Safety compliance and gives users control over their data.

---

## What's New

### User-Facing Features

**In-App Account Deletion**

Users can now delete their accounts directly from the app without contacting support. The feature is located in More → Settings → Delete Account.

**Email-Based Deletion**

Users can also request deletion via email at support@changeinyouth.org.uk if they prefer not to use the in-app feature.

**Account Deletion Policy**

A new public policy explains how users can delete their accounts and what data is retained. The policy is available at [your-hosted-url].

### Technical Changes

**Backend**

- New REST API endpoint: `DELETE /api/v1/users/me`
- Requires Bearer token authentication
- Email confirmation required to prevent accidental deletion
- PII anonymization (name, email, profile image)
- Audit logging for all deletion requests
- Idempotent design (safe to call multiple times)

**Database**

- Added `deletedAt` column to `users` table
- Soft delete approach: user records preserved for audit trail
- Anonymized PII: name, email, profile image, tokens

**Frontend**

- New Delete Account modal component
- Email confirmation input
- Loading state during deletion
- Error handling and user feedback
- Automatic sign-out after successful deletion

---

## Breaking Changes

None. This is a purely additive feature.

---

## Bug Fixes

None in this release.

---

## Known Limitations

- Deletion is immediate; there is no grace period
- Related user content (messages, posts, etc.) is not automatically deleted (preserved for audit trail)
- Backup copies may exist for up to 30 days before permanent deletion

---

## Security Considerations

**Authentication:** All deletion requests require valid Bearer token authentication. Unauthenticated requests are rejected with 401 Unauthorized.

**Confirmation:** Email confirmation is required to prevent accidental deletion. The provided email must match the user's registered email (case-insensitive).

**Audit Logging:** All deletion requests are logged with timestamp and request ID for compliance and investigation purposes.

**Data Encryption:** All API communication uses HTTPS/TLS. Session tokens are invalidated immediately upon deletion.

---

## Testing

### Unit Tests
- Email validation (case-insensitive, whitespace handling)
- Successful deletion with correct email
- Email mismatch rejection
- Idempotency (calling twice returns success both times)
- PII anonymization verification

### Integration Tests
- API endpoint authentication
- Database updates verification
- Session invalidation
- Error handling

### Manual Testing
- Modal appears in More → Settings
- Email input validation
- Successful deletion flow
- Error scenarios (network, wrong email, etc.)
- Sign-out after deletion

---

## Deployment Notes

### Prerequisites
- Database migration must be run: `pnpm db:push`
- HTTPS/TLS must be enabled for all API endpoints
- Audit logging must be configured

### Deployment Steps

1. Run database migration to add `deletedAt` column
2. Deploy backend API with new `/api/v1/users/me` endpoint
3. Deploy frontend with Delete Account modal
4. Publish Account Deletion Policy
5. Update Google Play Data Safety form
6. Monitor logs for deletion requests

### Rollback Plan

If critical issues occur:

1. Disable delete account button via feature flag
2. Revert code to previous version
3. Restore database from backup if needed
4. Notify users of temporary unavailability

---

## Migration Guide

### For Users

Users can now delete their accounts in two ways:

**In-App:** More → Settings → Delete Account → Enter email → Confirm

**Email:** Send deletion request to support@changeinyouth.org.uk

### For Admins

- Monitor deletion requests in audit logs
- Respond to support emails within 24 hours
- Verify deletion completeness monthly
- No action required for in-app deletions (automatic)

---

## Compliance

This feature enables compliance with:

- Google Play Data Safety requirements
- UK GDPR Article 17 (Right to Erasure)
- CCPA Section 1798.100 (Consumer Right to Delete)
- Other applicable data protection regulations

---

## Support

For questions or issues related to account deletion:

- **In-App Help:** Contact support@changeinyouth.org.uk
- **Technical Issues:** Report via GitHub issues or internal tracking
- **Privacy Questions:** Contact support@changeinyouth.org.uk

---

## Acknowledgments

This feature was developed to meet Google Play Data Safety requirements and to give users control over their personal data.

---

## Future Enhancements

Potential improvements for future releases:

- Bulk deletion for admins (with audit trail)
- Scheduled deletion (delete after N days)
- Data export before deletion
- Partial deletion (delete specific data types)
- Deletion status dashboard for admins

---

**Last Updated:** February 24, 2026
