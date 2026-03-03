# Agora Video Calling Setup Guide for Change In Youth App

This guide will walk you through setting up Agora video calling for your team meetings (8-15 people).

## Why Agora?

- **FREE** for first 10,000 minutes/month
- Perfect for 8-15 participants
- Excellent quality and reliability
- Built-in recording capabilities
- Your usage: ~300 minutes/month = **100% FREE**

---

## Step 1: Create Agora Account (5 minutes)

### Option A: Sign up with Email
1. Go to https://console.agora.io/signup
2. Fill in your email address
3. Read and accept Terms of Service
4. Click **Continue**
5. Enter verification code sent to your email
6. Provide your name, company name ("Change In Youth CIC"), and phone number
7. Set a password and click **Continue**

### Option B: Sign up with Google/GitHub
1. Go to https://console.agora.io/signup
2. Click "Sign up with a third-party account"
3. Choose Google or GitHub
4. Authorize Agora to access your account

---

## Step 2: Create Your First Project (3 minutes)

1. After signing up, you'll be automatically logged into Agora Console
2. Click **Create New Project** (or go to https://console.agora.io/projects)
3. Fill in the details:
   - **Project Name**: "Change In Youth Meetings" (or any name you prefer)
   - **Use Case**: Select "Video Calling"
   - **Authentication**: Check **"Secured mode: APP ID + Token (Recommended)"**
4. Click **Submit**

---

## Step 3: Get Your App ID (1 minute)

1. On the **Projects** page, you'll see your new project
2. Find the **App ID** column
3. Click the **copy icon** next to your App ID
4. **Save this somewhere** - you'll need it in Step 5

Example App ID format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

## Step 4: Get Your App Certificate (2 minutes)

1. On the **Projects** page, click the **pencil icon** (edit) next to your project
2. Scroll down to find **Primary Certificate**
3. Click the **copy icon** under Primary Certificate
4. **Save this somewhere** - you'll need it in Step 5

Example App Certificate format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

## Step 5: Add Credentials to Your App (2 minutes)

Now you need to add these credentials to your Change In Youth app:

1. Open your Change In Youth app in the browser
2. Click the **Management UI** icon (top-right)
3. Go to **Settings** → **Secrets**
4. Click **Add Secret** and add these two:

   **Secret 1:**
   - Key: `AGORA_APP_ID`
   - Value: [paste your App ID from Step 3]

   **Secret 2:**
   - Key: `AGORA_APP_CERTIFICATE`
   - Value: [paste your App Certificate from Step 4]

5. Click **Save**

---

## Step 6: Test Video Calling (5 minutes)

Once I integrate the Agora SDK (which I'll do next), you can test video calling:

1. Create a test session in your app
2. Click "Start Video Call"
3. Open the same session on another device (phone/tablet)
4. Both devices should see each other's video!

---

## What Happens Next?

After you complete Steps 1-5 above, I will:

1. ✅ Install Agora React Native SDK
2. ✅ Connect video calling to your existing attendance tracking
3. ✅ Enable automatic meeting recording
4. ✅ Link attendance duration to invoice generation
5. ✅ Add meeting notes export functionality

---

## Pricing Breakdown

**Your Expected Usage:**
- 15 people × 1 hour meeting × 20 meetings/month = 300 minutes
- Agora FREE tier: 10,000 minutes/month
- **You're using only 3% of the free tier!**

**If you exceed free tier:**
- $0.99 per 1,000 minutes
- Even 100 meetings/month = 1,500 minutes = still FREE

---

## Support

If you have any issues:
- **Agora Support**: support@agora.io
- **Agora Documentation**: https://docs.agora.io
- **Agora Community**: https://www.agora.io/en/community/

---

## Summary

**Total Time**: ~15 minutes
**Cost**: FREE (forever for your usage)
**Result**: Professional video calling with automatic attendance tracking and payment calculation

**Next Steps:**
1. Complete Steps 1-5 above
2. Let me know when you've added the credentials
3. I'll integrate the Agora SDK and test it
4. You'll have fully working video meetings!
