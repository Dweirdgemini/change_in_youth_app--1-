# Apple App Store Publishing Guide - Change In Youth

## Prerequisites

- ✅ Apple Developer Account (£79/year or $99/year)
- ✅ Mac computer (for generating signing certificates)
- ✅ App signing certificate and provisioning profile
- ✅ App icon and screenshots
- ✅ App description and privacy policy
- ✅ Version 1.0.3 ready to publish

## Step-by-Step Publishing Process

### Step 1: Prepare Your Apple Developer Account

1. **Go to** [Apple Developer Program](https://developer.apple.com/programs/)
2. **Enroll** in Apple Developer Program (£79/year)
3. **Verify your identity** and payment method
4. **Access** [App Store Connect](https://appstoreconnect.apple.com)

### Step 2: Create App Record in App Store Connect

1. **Login to** [App Store Connect](https://appstoreconnect.apple.com)
2. **Click** "My Apps"
3. **Click** "+" button to create new app
4. **Select** "New App"
5. **Fill in:**
   - Platform: iOS
   - Name: "Change In Youth"
   - Primary Language: English
   - Bundle ID: Select or create (e.g., `space.manus.change.in.youth.t20260204`)
   - SKU: `CHANGEINyouth001`
   - User Access: Full Access
6. **Click** "Create"

### Step 3: Fill in App Information

#### 3.1 App Information Section
1. **Go to** "App Information" tab
2. **Fill in:**
   - Category: Business or Productivity
   - Subcategory: Business or Project Management
   - Content Rights: Select "This app does not use third-party content"
   - Age Rating: 4+
   - Copyright: "Change In Youth CIC © 2026"
   - Contact Email: hello@changeindelivery.org
   - Support URL: https://www.changeindelivery.org/support
   - Privacy Policy URL: https://www.changeindelivery.org/privacy

#### 3.2 Pricing and Availability
1. **Go to** "Pricing and Availability" tab
2. **Set pricing:**
   - Price tier: Free (or select paid tier)
   - Availability: Select countries where app should be available
3. **Regions:** Select all or specific regions
4. **Availability date:** Immediate or schedule for future date

### Step 4: Prepare App Screenshots and Preview

#### 4.1 App Icon
1. **Prepare icon:** 1024x1024 px, PNG format
   - Use `assets/images/icon.png` from project
   - Must be high quality with no transparency
   - Apple will automatically scale for different sizes

2. **Upload to App Store Connect:**
   - Go to "App Preview and Screenshots"
   - Upload icon under "App Icon"

#### 4.2 Screenshots
1. **Prepare screenshots** for each device type:
   - iPhone 6.7" (required)
   - iPhone 6.1" (required)
   - iPad Pro 12.9" (optional but recommended)

2. **Screenshot dimensions:**
   - iPhone 6.7": 1284x2778 px
   - iPhone 6.1": 1170x2532 px
   - iPad Pro 12.9": 2048x2732 px

3. **Create 4-5 screenshots showing:**
   1. Home dashboard with quick stats
   2. Schedule/calendar view
   3. Financial management interface
   4. Task management
   5. Team communications

4. **Add text overlays** describing features:
   - "Manage your team's schedule"
   - "Track finances in real-time"
   - "Approve invoices instantly"
   - "Collaborate with your team"

5. **Upload to App Store Connect:**
   - Go to "App Preview and Screenshots"
   - Select device type
   - Upload screenshots in order

#### 4.3 App Preview (Video)
1. **Optional but recommended** — 15-30 second video
2. **Dimensions:** Same as screenshots
3. **Content:** Show app in action (walkthrough of key features)
4. **Upload:** In "App Preview and Screenshots" section

### Step 5: Write App Description

#### 5.1 App Name and Subtitle
- **Name:** Change In Youth
- **Subtitle:** "Team management & financial platform"

#### 5.2 Description
```
Change In Youth is a comprehensive digital platform designed for 
youth organizations delivering workshops and programs in schools.

FEATURES:
• Team Scheduling & Rotas - Calendar-based session scheduling with 
  facilitator assignment and availability tracking
• Financial Management - Real-time budget tracking, invoice management, 
  and approval workflows
• Task Management - Create, assign, and track tasks linked to projects 
  and sessions
• Compliance Documentation - Centralized document storage, digital 
  signatures, and automated reminders
• Team Communications - Project-specific chat channels, direct messaging, 
  and announcements
• Performance Analytics - Track team productivity, session attendance, 
  and budget utilization
• Surveys & Feedback - Create custom surveys and collect participant 
  feedback

BENEFITS:
✓ Reduce administrative time by 40-60%
✓ Eliminate spreadsheets and paper forms
✓ Real-time budget control and financial accuracy
✓ Complete compliance documentation and audit trail
✓ Centralized team communication and collaboration
✓ Data-driven insights for better decision making

SECURITY:
• OAuth authentication for secure login
• Role-based access control
• End-to-end encrypted communications
• GDPR compliant data handling
• Complete audit logging

Perfect for youth organizations, charities, schools, and community programs.

Download Change In Youth today and transform how your team works!
```

#### 5.3 Keywords
Add relevant search terms (comma-separated):
```
team management, scheduling, financial tracking, invoicing, youth, 
organization, project management, compliance, task management, chat, 
communication, budget tracking, business, productivity
```

### Step 6: Build and Upload IPA

#### 6.1 Generate IPA File

**Option A: Using Manus Platform (Recommended)**
1. In Manus platform, click "Build IPA"
2. Wait for build to complete
3. Download IPA file

**Option B: Using EAS Build (Expo)**
```bash
cd /home/ubuntu/change_in_youth_app
eas build --platform ios --auto-submit
```

#### 6.2 Upload to App Store Connect

1. **Install Transporter** (free app from App Store)
2. **Open Transporter**
3. **Select** your IPA file
4. **Click** "Deliver"
5. **Sign in** with Apple ID
6. **Wait** for upload to complete (5-15 minutes)

**Alternative: Using xcrun command**
```bash
xcrun altool --upload-app -f "Change In Youth.ipa" \
  -t ios \
  -u "your-apple-id@example.com" \
  -p "your-app-specific-password"
```

### Step 7: Version Information

1. **Go to** "App Store" tab
2. **Version:** 1.0.3
3. **Release Notes:**
   ```
   Version 1.0.3 - Initial Launch
   
   Welcome to Change In Youth! This initial release includes:
   
   • Team scheduling and rotas
   • Financial management and invoicing
   • Task management
   • Team communications
   • Compliance documentation
   • Performance analytics
   
   We're excited to help your organization work more efficiently.
   
   For support, visit: hello@changeindelivery.org
   ```
4. **Copyright:** Change In Youth CIC © 2026
5. **Support URL:** https://www.changeindelivery.org/support
6. **Privacy Policy URL:** https://www.changeindelivery.org/privacy

### Step 8: App Review Information

1. **Go to** "App Review Information" section
2. **Fill in:**
   - Contact email: hello@changeindelivery.org
   - Contact phone: +44 (0) 123 456 7890
   - Demo account email: demo@changeindelivery.org
   - Demo account password: [Create test account]
   - Notes for reviewer:
     ```
     This is a team management and financial platform for youth 
     organizations. The app requires login via OAuth. 
     
     Demo account credentials:
     Email: demo@changeindelivery.org
     Password: [password]
     
     Key features to test:
     1. Login and dashboard
     2. Schedule/calendar view
     3. Financial management
     4. Task creation and assignment
     5. Team chat
     
     The app handles sensitive financial and personal data securely.
     ```

### Step 9: Compliance and Legal

1. **Go to** "Compliance" section
2. **Answer questions:**
   - Export compliance: No (unless applicable)
   - Encryption: Yes (for secure communications)
   - Advertising: No
   - Third-party SDKs: Declare any used

3. **Age Rating Questionnaire:**
   - Violence: None
   - Sexual content: None
   - Profanity: None
   - Alcohol/tobacco: None
   - Gambling: None
   - Medical: No
   - Other: No

### Step 10: Submit for Review

1. **Review all sections** for completeness
2. **Check for warnings** (fix any red flags)
3. **Click** "Submit for Review"
4. **Confirm** submission

### Step 11: Apple Review Process

**Timeline:** 24-48 hours typically

**Apple will check:**
- ✅ App functionality and stability
- ✅ Privacy policy accuracy
- ✅ Permissions justified
- ✅ No policy violations
- ✅ Demo account works
- ✅ Content rating accuracy
- ✅ Screenshots match app functionality

**If rejected:**
- Review rejection reason in App Store Connect
- Fix issues
- Resubmit for review

## Common Rejection Reasons & Solutions

| Reason | Solution |
|--------|----------|
| Incomplete privacy policy | Add comprehensive privacy policy explaining data collection and usage |
| Demo account doesn't work | Ensure demo account is active and credentials are correct |
| Crashes during testing | Test thoroughly on multiple iOS versions, fix bugs, resubmit |
| Misleading screenshots | Ensure screenshots accurately represent app functionality |
| Unclear app purpose | Improve app description and screenshots to clearly show what app does |
| Missing support contact | Add support email and website URL |
| Permissions not justified | Explain why each permission is needed in app description |

## Post-Launch Monitoring

### Week 1
- [ ] Monitor crash reports in App Store Connect
- [ ] Check user ratings and reviews
- [ ] Monitor daily active users (DAU)
- [ ] Fix any critical bugs

### Week 2-4
- [ ] Respond to user reviews
- [ ] Monitor performance metrics
- [ ] Plan version 1.0.4 with improvements
- [ ] Gather user feedback

### Ongoing
- [ ] Monthly updates with new features
- [ ] Security patches as needed
- [ ] Performance optimization
- [ ] User support and bug fixes

## Useful Links

- [App Store Connect](https://appstoreconnect.apple.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Optimization Guide](https://developer.apple.com/app-store/optimization/)
- [TestFlight for Beta Testing](https://developer.apple.com/testflight/)

## Timeline Summary

| Step | Time |
|------|------|
| Account setup | 5 minutes |
| App record creation | 5 minutes |
| App information | 20 minutes |
| Screenshots & graphics | 30 minutes |
| Description & keywords | 15 minutes |
| Build and upload IPA | 15 minutes |
| Review information | 10 minutes |
| Submit for review | 2 minutes |
| **Total preparation** | **~100 minutes** |
| **Apple review time** | **24-48 hours** |
| **Live on App Store** | **Next day** |

## Success Checklist

Before clicking "Submit for Review":

- [ ] App icon uploaded (1024x1024 PNG)
- [ ] Screenshots uploaded for all required devices
- [ ] App description complete and accurate
- [ ] Keywords added
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] Copyright information filled
- [ ] Age rating completed
- [ ] Demo account created and tested
- [ ] IPA file uploaded successfully
- [ ] Version notes added
- [ ] All required fields filled (no red warnings)

---

**Once approved, your app will be available to millions of iOS users worldwide!** 🎉
