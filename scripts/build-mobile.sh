#!/bin/bash

# Production Build Script for Mobile App
# This script builds the mobile app for production deployment

echo "🚀 Building Change In Youth Mobile App for Production..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Load mobile environment variables
if [ -f ".env.mobile" ]; then
    echo "📱 Loading mobile environment variables..."
    export $(cat .env.mobile | grep -v '^#' | xargs)
else
    echo "⚠️  .env.mobile file not found. Using default configuration."
fi

# Validate required environment variables
if [ -z "$EXPO_PUBLIC_API_BASE_URL" ]; then
    echo "❌ EXPO_PUBLIC_API_BASE_URL is required"
    exit 1
fi

echo "🔧 API Base URL: $EXPO_PUBLIC_API_BASE_URL"

# Build for Android Production
echo "📦 Building Android App Bundle for Play Store..."
eas build --platform android --profile production

echo "✅ Mobile app build completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Download the built AAB file from EAS dashboard"
echo "2. Upload to Google Play Console"
echo "3. Complete the Play Store listing"
echo "4. Submit for review"
