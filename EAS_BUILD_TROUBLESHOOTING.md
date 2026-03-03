# EAS Build Troubleshooting Guide

## Problem: `pnpm install failed: exit status 1`

This error occurs when EAS cannot install dependencies in the build environment.

### Root Causes
1. Network issues in EAS build container
2. Incompatible dependency versions
3. pnpm cache corruption
4. Missing native build tools

### Solutions Applied

#### 1. ✅ Updated `.npmrc` Configuration
```
node-linker=hoisted
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
prefer-workspace-packages=true
```

**What this does:**
- `shamefully-hoist=true` - Hoists all dependencies to node_modules root (compatibility)
- `strict-peer-dependencies=false` - Allows peer dependency mismatches
- `auto-install-peers=true` - Automatically installs peer dependencies
- `prefer-workspace-packages=true` - Uses workspace packages when available

#### 2. ✅ Created `eas.json` Configuration
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    },
    "internal": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### How to Retry the Build

#### Option 1: Using Manus UI (Recommended)
1. Go to the Manus dashboard
2. Click **"Publish"** button (top right)
3. Select **"Android"** → **"APK"**
4. Click **"Build"**

#### Option 2: Using EAS CLI Locally
```bash
cd /home/ubuntu/change_in_youth_app

# Build for internal testing (APK)
eas build --platform android --profile internal

# Or build for production (AAB)
eas build --platform android --profile production
```

#### Option 3: Using Manus Command Line
```bash
# If you have Manus CLI installed
manus build android --profile internal
```

### What to Check if Build Still Fails

1. **Check pnpm lockfile integrity:**
   ```bash
   pnpm install --frozen-lockfile
   ```

2. **Verify all dependencies install locally:**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. **Check for conflicting versions:**
   ```bash
   pnpm list --depth=0
   ```

4. **Look for native build issues:**
   - Ensure `expo-build-properties` is installed
   - Check `app.config.ts` for build configuration

### Key Dependencies
- **Expo SDK:** ~54.0.29
- **React Native:** 0.81.5
- **Node.js:** 22.13.0
- **pnpm:** 9.12.0

### If Build Still Fails

1. **Clear EAS cache:**
   ```bash
   eas build --platform android --clear-cache
   ```

2. **Check EAS status:**
   Visit https://status.expo.io to see if EAS is experiencing issues

3. **Contact Expo Support:**
   - Go to https://expo.dev/support
   - Include the workflow ID from the error message

### Build Profiles Explained

| Profile | Output | Use Case |
|---------|--------|----------|
| `preview` | APK | Quick testing on emulator/device |
| `preview2` | APK | Alternative preview build |
| `preview3` | APK | Another alternative preview |
| `internal` | APK | Closed testing on Google Play |
| `production` | AAB | Production release on Google Play |

### Next Steps After Successful Build

1. **Download APK** from EAS dashboard
2. **Upload to Google Play Console:**
   - Go to Internal testing track
   - Create a new release
   - Upload the APK
3. **Add testers:**
   - Add the 9 tester emails to the internal testing group
   - Send invitations
4. **Monitor feedback** from testers

---

**Last Updated:** 2026-02-17
**Status:** Ready for retry
