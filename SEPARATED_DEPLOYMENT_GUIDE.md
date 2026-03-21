# Separated Deployment Guide

This guide explains how to deploy the Change In Youth app with separated frontend and backend.

## Architecture Overview

```
Railway (Backend)          Mobile App (Native)
├── Express.js API         ├── React Native App
├── tRPC Endpoints         ├── Built with Expo EAS
├── Database Connection    ├── Connects to Railway API
└── Authentication         └── Distributed via Play Store
```

## Deployment Steps

### 1. Deploy Backend to Railway

```bash
# Deploy backend-only service
./scripts/deploy-backend.sh
```

**Required Railway Environment Variables:**
- `DATABASE_URL` - Railway database connection
- `JWT_SECRET` - Authentication secret
- `OAUTH_SERVER_URL` - OAuth provider
- `OWNER_OPEN_ID` - Admin user ID
- `SENDGRID_API_KEY` - Email service (optional)
- `AGORA_APP_ID` - Video calling (optional)

### 2. Configure Mobile App

Update the API URL in your mobile environment:
```bash
# Set your Railway backend URL
export EXPO_PUBLIC_API_BASE_URL=https://your-backend.railway.app
```

### 3. Build Mobile App

```bash
# Build for production
./scripts/build-mobile.sh
```

### 4. Deploy to Play Store

1. Download the AAB file from EAS dashboard
2. Upload to Google Play Console
3. Complete app listing
4. Submit for review

## File Structure

```
├── railway-backend.json      # Backend deployment config
├── .env.backend              # Backend environment variables
├── .env.mobile               # Mobile app environment variables
├── eas.json                  # Updated with production API URL
├── scripts/
│   ├── deploy-backend.sh     # Backend deployment script
│   └── build-mobile.sh       # Mobile build script
└── server/_core/env.ts       # Enhanced environment validation
```

## Benefits

- ✅ **Independent scaling** - Backend scales separately from mobile app
- ✅ **No app store approval** for backend updates
- ✅ **Better security** - Backend not exposed to web
- ✅ **Native performance** - Full mobile app experience
- ✅ **Professional deployment** - Industry standard approach

## Development vs Production

**Development:** Use monolithic setup (current)
```bash
pnpm dev  # Runs both frontend and backend together
```

**Production:** Use separated deployment
```bash
# Backend on Railway
./scripts/deploy-backend.sh

# Mobile app via EAS
./scripts/build-mobile.sh
```
