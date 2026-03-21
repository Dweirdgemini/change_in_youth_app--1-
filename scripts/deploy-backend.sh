#!/bin/bash

# Backend Deployment Script for Railway
# This script deploys the backend-only service to Railway

echo "🚀 Deploying Change In Youth Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || {
    echo "📝 Please login to Railway:"
    railway login
}

# Load backend environment variables
if [ -f ".env.backend" ]; then
    echo "📋 Loading backend environment variables..."
    echo "⚠️  Make sure to set these variables in Railway dashboard:"
    cat .env.backend | grep -E '^[A-Z_].*=' | sed 's/^/  - /'
    echo ""
else
    echo "⚠️  .env.backend file not found."
fi

# Verify Dockerfile exists
if [ ! -f "Dockerfile.backend" ]; then
    echo "❌ Dockerfile.backend not found. Cannot deploy."
    exit 1
fi

echo "🐳 Using Docker-based deployment (more reliable than NIXPACKS)"

# Deploy backend using Docker configuration
echo "📦 Deploying backend service..."
railway up --config railway-backend.json

echo "✅ Backend deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Set environment variables in Railway dashboard"
echo "2. Update EXPO_PUBLIC_API_BASE_URL in mobile app"
echo "3. Test backend health endpoint"
echo "4. Deploy mobile app"
