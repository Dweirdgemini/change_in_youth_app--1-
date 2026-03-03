# Change In Youth App - Gemini Agent Brief

## PRIVACY POLICY SUMMARY

### Current Status
- Privacy policy created and ready for Google Play Console
- Format: Google Docs (easiest, fastest approach)
- Location: Will be hosted on Google Docs with public link

### Key Privacy Policy Facts (DO NOT MISS)

**1. Permissions & Data Collection**
- App uses CAMERA permission ONLY
- Camera is used for in-app functionality only (no automatic capture/transmission)
- No images or videos are stored or transmitted without explicit user action
- No personal data is automatically collected or stored

**2. Data Handling**
- No data is sold to third parties
- No data is shared with third parties
- No automatic data transmission
- User has full control over any data sharing

**3. Compliance Requirements**
- GDPR compliant (UK Data Protection Act 2018)
- UK GDPR compliant (since app is UK-based)
- Privacy policy must be accessible from Google Play Console
- Contact email: privacy@changeinyouth.org.uk (UPDATE THIS)

**4. Google Play Requirements**
- Privacy policy URL must be public and accessible
- Policy must clearly explain camera permission usage
- Policy must state no data sales/sharing
- Policy must include contact information

**5. Implementation Steps**
1. Create Google Doc with privacy policy text
2. Share publicly: "Anyone with the link → Viewer"
3. Copy the Google Docs link
4. Paste link into Google Play Console → Store listing → Privacy policy URL
5. Save and submit

### Privacy Policy Content (Already Created)
- Plain English, no legal jargon
- Covers camera permission explicitly
- States no automatic data collection
- Clarifies no third-party sharing
- Includes contact email placeholder
- Ready to copy-paste into Google Docs

---

## VERSION MANAGEMENT SUMMARY

### Current Status
- App version: 1.0.1
- versionCode: 10007 (configured in eas.json)
- Build type: AAB (Android App Bundle)
- Ready for Google Play submission

### Key Version Facts (DO NOT MISS)

**1. Version Numbers Explained**
- **versionName** (1.0.1) = User-visible version (shown in app store)
- **versionCode** (10007) = Internal build number (must always increase)
- versionCode MUST be higher than any previous build submitted to Google Play
- versionCode is a positive integer only

**2. Current Configuration**
- eas.json: `"versionCode": 10007` (in production profile)
- app.config.ts: `version: "1.0.1"`
- app.json: `"version": "1.0.1"`
- Both files must match for consistency
- **MAXIMUM versionCode allowed by Google Play: 2,100,000,000**
- Current versionCode (10007) has plenty of room for future updates

**3. Semantic Versioning (MAJOR.MINOR.PATCH)**
- 1.0.1 = Version 1, Minor 0, Patch 1
- Increment PATCH for bug fixes: 1.0.0 → 1.0.1
- Increment MINOR for new features: 1.0.1 → 1.1.0
- Increment MAJOR for breaking changes: 1.1.0 → 2.0.0

**4. versionCode Strategy**
- Started at 10000 (gives room for future versions)
- Current: 10007 (exceeds Google Play requirement of >10006)
- Increment by 1 for each release (recommended approach)
- NEVER reuse or decrease versionCode
- **CRITICAL: Maximum versionCode is 2,100,000,000 (Google Play limit)**
- At current rate (10007 + 1 per release), you have 2.1 billion releases before hitting limit
- This is NOT a concern for any practical app lifecycle

**5. Release Process**
1. Make code changes
2. Increment versionCode in eas.json (10007 → 10008)
3. Update versionName if user-facing change (1.0.1 → 1.0.2)
4. Build AAB: `eas build --platform android --profile production`
5. Upload to Google Play Console
6. Commit to git with tag: `git tag v1.0.2`

**6. Important Rules**
- ✅ Always increment versionCode before building
- ✅ versionCode must be unique per build
- ✅ versionCode must be higher than previous builds
- ✅ Keep versionName semantic (MAJOR.MINOR.PATCH)
- ✅ Document releases in git tags
- ✅ Stay below maximum versionCode: 2,100,000,000
- ❌ Never reuse versionCode
- ❌ Never decrease versionCode
- ❌ Never use versionCode 0 or negative
- ❌ Never exceed 2,100,000,000 (Google Play will reject submission)

**7. Conflict Resolution**
- If versionCode is rejected: Check Google Play Console for highest versionCode used
- If multiple developers: Establish build coordinator, increment in main branch only
- If need to skip numbers: Allowed! Just ensure new versionCode > previous

### Version Files Location
- `app.config.ts` - Line with `version: "1.0.1"`
- `app.json` - Line with `"version": "1.0.1"`
- `eas.json` - Line with `"versionCode": 10007` in production profile

### Next Release Example
**When ready for version 1.0.2:**
1. Update app.config.ts: `version: "1.0.2"`
2. Update app.json: `"version": "1.0.2"`
3. Update eas.json: `"versionCode": 10008`
4. Build and upload
5. Tag: `git tag v1.0.2`

---

## CRITICAL FACTS SUMMARY (For Gemini)

### Privacy Policy - Must Include
✅ Camera permission usage explained
✅ No automatic data collection
✅ No data sales or third-party sharing
✅ Contact email for privacy questions
✅ GDPR/UK Data Protection compliance
✅ Public URL accessible from Google Play

### Version Management - Must Remember
✅ versionCode MUST increase (never decrease/reuse)
✅ versionCode must be > 10006 (current: 10007)
✅ versionCode MUST NOT exceed 2,100,000,000 (Google Play maximum)
✅ versionName follows MAJOR.MINOR.PATCH (1.0.1)
✅ Both eas.json and app.config.ts must match
✅ Update BOTH files when incrementing version
✅ Increment versionCode BEFORE building

---

## Quick Reference Links

**Privacy Policy Files:**
- Full policy: `/home/ubuntu/change_in_youth_app/PRIVACY_POLICY.md`
- Google Docs guide: `/home/ubuntu/change_in_youth_app/PRIVACY_POLICY_GOOGLE_DOCS_GUIDE.md`
- HTML version: `/home/ubuntu/change_in_youth_app/privacy-policy.html`

**Version Management Files:**
- Build guide: `/home/ubuntu/change_in_youth_app/BUILD_AAB_FINAL.md`
- Version script: `/home/ubuntu/skills/expo-aab-builder/scripts/increment_version.py`
- Strategy guide: `/home/ubuntu/skills/expo-aab-builder/references/version-strategy.md`

---

**Last Updated:** 2026-02-18
**App:** Change In Youth
**Status:** Ready for Google Play Console submission
