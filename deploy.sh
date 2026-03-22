#!/bin/bash

# MDS SE Timeline - Firebase Deployment Script
# This script builds and deploys your application to Firebase Hosting

echo "🚀 Starting deployment process..."
echo ""

# Step 1: Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI is not installed."
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Firebase CLI. Please install manually:"
        echo "   npm install -g firebase-tools"
        exit 1
    fi
fi

echo "✅ Firebase CLI is installed"
echo ""

# Step 2: Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Step 3: Deploy to Firebase
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed. Please check your Firebase configuration."
    exit 1
fi

echo ""
echo "✅ Deployment completed successfully!"
echo "🎉 Your application is now live!"
echo ""
echo "📝 Next steps:"
echo "   1. Check your Firebase Console for the hosting URL"
echo "   2. Test your application in production"
echo "   3. Share the URL with your team"
echo ""
