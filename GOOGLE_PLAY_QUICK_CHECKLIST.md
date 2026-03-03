# Google Play Upload - Quick Checklist

## ✅ Before You Start
- [ ] APK downloaded from EAS Build
- [ ] Google Play Developer Account active
- [ ] App created in Google Play Console
- [ ] App store listing completed (name, description, screenshots)
- [ ] Privacy policy URL added
- [ ] Content rating questionnaire completed

---

## 📱 Step-by-Step Upload

### 1. Download APK (5 minutes)
- [ ] Go to https://expo.dev/builds
- [ ] Find your successful Android build
- [ ] Click "Download"
- [ ] Save APK file locally

### 2. Upload to Google Play (10 minutes)
- [ ] Go to https://play.google.com/console
- [ ] Select "Change In Youth" app
- [ ] Click "Testing" → "Internal testing"
- [ ] Click "Create new release"
- [ ] Upload APK file
- [ ] Add release notes (optional)
- [ ] Click "Start rollout to Internal testing"

### 3. Add Testers (5 minutes)
- [ ] In "Internal testing", scroll to "Testers"
- [ ] Add each email:
  - [ ] cindy@changeinyouth.org.uk
  - [ ] angel@changeinyouth.org.uk
  - [ ] demitra@changeinyouth.org.uk
  - [ ] jm@changeinyouth.org.uk
  - [ ] deji@changeinyouth.org.uk
  - [ ] infotasiauk@gmail.com
  - [ ] ceylanisnot@gmail.com
  - [ ] yasmin.tayane@outlook.com
  - [ ] abigailasantetalks@gmail.com
- [ ] Verify all 9 testers added
- [ ] Invitations sent automatically

---

## ⏱️ Wait for Approval
- [ ] Google Play review: 2-4 hours
- [ ] Testers receive email: 5-15 minutes after approval
- [ ] Testers download app: 5-30 minutes

---

## 📊 Monitor Testing
- [ ] Check "Quality" → "Crashes & ANRs" for errors
- [ ] Check "Quality" → "User feedback" for comments
- [ ] Respond to tester feedback
- [ ] Fix any bugs found

---

## 🚀 After Testing (If Successful)
- [ ] Create new release in "Production" track
- [ ] Upload same APK
- [ ] Submit for production review (24-48 hours)

---

## 🆘 If Issues Found
- [ ] Fix bugs in code
- [ ] Build new APK: `eas build --platform android`
- [ ] Upload new APK to internal testing
- [ ] Notify testers to test again

---

## 📞 Support
- Google Play Help: https://support.google.com/googleplay/android-developer
- EAS Docs: https://docs.expo.dev/eas/
- Expo Forums: https://forums.expo.dev

---

**Estimated Total Time:** 20-30 minutes (plus 2-4 hour wait for Google Play review)
