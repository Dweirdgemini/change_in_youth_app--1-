# Build Android App Bundle (.aab) - Final Instructions

## ✅ Configuration Complete

**Version Details:**
- Version Name: 1.0.1
- **versionCode: 10007** ✓ (Higher than required 10006)
- Build Type: AAB (Android App Bundle)
- Build Profile: production

---

## How to Build the AAB

You have **two options** to build the AAB:

### Option 1: Use Manus Publishing UI (Recommended - Easiest)

**Step 1:** Go to Manus dashboard → Click **"Publish"** button

**Step 2:** Select **"Android"** → **"AAB"**

**Step 3:** Confirm build settings:
```
Platform: Android
Build Type: AAB
Version: 1.0.1
versionCode: 10007 ✓
```

**Step 4:** Click **"Start Build"**

**Step 5:** Wait 15-25 minutes for build to complete

**Step 6:** Click **"Download"** to get the .aab file

---

### Option 2: Use EAS CLI (If You Have Terminal Access)

If you have access to a terminal with EAS CLI installed:

```bash
cd /home/ubuntu/change_in_youth_app
eas build --platform android --profile production
```

This will:
- Build using the "production" profile from eas.json
- Use versionCode 10007
- Generate an AAB file
- Provide a download link

---

## What You'll Get

**File Details:**
- Filename: `change-in-youth-1.0.1.aab`
- File Size: 30-80 MB (typical)
- Format: Android App Bundle (.aab)
- versionCode: 10007
- versionName: 1.0.1

---

## Verification Checklist

Once you have the .aab file, verify:

- ✅ File exists and is named correctly
- ✅ File size is 30-80 MB
- ✅ File extension is `.aab` (not `.apk`)
- ✅ File is not corrupted

---

## Upload to Google Play Console

Once you have the AAB file:

**Step 1:** Go to https://play.google.com/console

**Step 2:** Select your app "Change In Youth"

**Step 3:** Go to **"Testing"** → **"Internal testing"**

**Step 4:** Click **"Create new release"**

**Step 5:** Upload the .aab file

**Step 6:** Add your 9 testers:
- cindy@changeinyouth.org.uk
- angel@changeinyouth.org.uk
- demitra@changeinyouth.org.uk
- jm@changeinyouth.org.uk
- deji@changeinyouth.org.uk
- infotasiauk@gmail.com
- ceylanisnot@gmail.com
- yasmin.tayane@outlook.com
- abigailasantetalks@gmail.com

**Step 7:** Click **"Start rollout to Internal testing"**

---

## Build Configuration Details

**eas.json (production profile):**
```json
{
  "production": {
    "android": {
      "buildType": "aab",
      "versionCode": 10007
    }
  }
}
```

**app.config.ts:**
```typescript
version: "1.0.1"
```

**app.json:**
```json
"version": "1.0.1"
```

---

## Timeline

| Step | Duration |
|------|----------|
| Start build | 1 min |
| Build process | 15-25 min |
| Download | 2-5 min |
| Upload to Google Play | 5-10 min |
| Add testers | 5 min |
| **Total** | **30-50 min** |

---

## Troubleshooting

### Build Fails
- Retry the build
- Check internet connection
- Contact Manus support if issue persists

### versionCode Mismatch
- Verify eas.json has `"versionCode": 10007`
- Verify app.config.ts has `version: "1.0.1"`
- Rebuild if needed

### AAB File Won't Upload to Google Play
- Verify file is .aab (not .apk)
- Verify versionCode is higher than any previous builds
- Try uploading again

---

## Summary

✅ **Configuration Ready:**
- Version: 1.0.1
- versionCode: 10007 (meets requirement > 10006)
- Build Type: AAB
- No functionality changed

**Next Action:** Build the AAB using Manus Publishing UI or EAS CLI

---

**Status:** Ready to build  
**Requirement Met:** versionCode 10007 > 10006 ✓  
**Last Updated:** 2026-02-18
