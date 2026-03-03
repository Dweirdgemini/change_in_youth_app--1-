# Local Build Setup Guide - Change In Youth App

## Prerequisites

### 1. Node.js & npm
- **Download:** https://nodejs.org/ (LTS version recommended)
- **Verify installation:**
  ```bash
  node --version
  npm --version
  ```

### 2. Git
- **Download:** https://git-scm.com/
- **Verify installation:**
  ```bash
  git --version
  ```

### 3. EAS CLI
- **Install globally:**
  ```bash
  npm install -g eas-cli
  ```
- **Verify installation:**
  ```bash
  eas --version
  ```

---

## Setup Steps

### Step 1: Download the Project

Download the project folder from Manus Management UI and extract it to your machine.

```bash
cd /path/to/change_in_youth_app
```

### Step 2: Install Dependencies

```bash
npm install
# or if you have pnpm installed:
pnpm install
```

### Step 3: Set Environment Variable

```bash
export EXPO_TOKEN="0dLmqOoIHcgNF91ntU_R4QV8gyTmDiDAf2ZFY8AO"
```

**On Windows (PowerShell):**
```powershell
$env:EXPO_TOKEN="0dLmqOoIHcgNF91ntU_R4QV8gyTmDiDAf2ZFY8AO"
```

**On Windows (Command Prompt):**
```cmd
set EXPO_TOKEN=0dLmqOoIHcgNF91ntU_R4QV8gyTmDiDAf2ZFY8AO
```

### Step 4: Build the APK

```bash
eas build --platform android --profile preview
```

### Step 5: Confirm Keystore Generation

When prompted:
```
? Generate a new Android Keystore? (Y/n)
```

**Type `y` and press Enter**

The build will start. This takes **10-15 minutes** depending on your internet speed.

### Step 6: Download the APK

Once the build completes, you'll see output like:

```
✔ Build finished
📱 APK: https://expo.dev/artifacts/eas/...apk
```

Click the link or copy it to download the APK file.

---

## Install APK on Android Device

### Option 1: USB Cable (Recommended)

1. **Connect your Android device** via USB cable
2. **Enable Developer Mode** on your device:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"
3. **Install the APK:**
   ```bash
   adb install path/to/change-in-youth-app.apk
   ```

### Option 2: Email/Cloud

1. Download the APK to your computer
2. Email it to yourself or upload to Google Drive
3. Download on your Android device and tap to install

### Option 3: QR Code

After the build completes, EAS provides a QR code. Scan it on your Android device to download and install directly.

---

## Troubleshooting

### "eas: command not found"
- Install EAS CLI globally:
  ```bash
  npm install -g eas-cli
  ```

### "EXPO_TOKEN not recognized"
- Make sure you set the environment variable **before** running the build command
- Verify it's set:
  ```bash
  echo $EXPO_TOKEN
  ```

### Build fails with "dependencies not found"
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### "adb: command not found"
- Install Android SDK Platform Tools: https://developer.android.com/tools/releases/platform-tools
- Add to your PATH environment variable

---

## Build Configuration

**Current settings:**

| Setting | Value |
|---------|-------|
| **App Name** | Change In Youth |
| **Package** | space.manus.change_in_youth_app.t20260109113652 |
| **Version** | 1.0.1 |
| **Version Code** | 571105 |
| **Build Type** | APK (preview profile) |

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Set EXPO_TOKEN
3. ✅ Run `eas build --platform android --profile preview`
4. ✅ Confirm keystore generation
5. ✅ Download APK when ready
6. ✅ Install on test device
7. ✅ Test the app

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review EAS documentation: https://docs.expo.dev/eas/
3. Check Expo forums: https://forums.expo.dev/

