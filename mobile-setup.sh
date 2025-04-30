#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================"
echo "GlobalEduConnect Mobile App Setup Script"
echo "========================================"

# Check for required tools
echo "Checking environment..."
if ! [ -x "$(command -v node)" ]; then
  echo "Error: Node.js is not installed." >&2
  exit 1
fi

if ! [ -x "$(command -v npm)" ]; then
  echo "Error: npm is not installed." >&2
  exit 1
fi

# Create mobile assets directory if it doesn't exist
if [ ! -d "src/assets/mobile" ]; then
  echo "Creating mobile assets directory..."
  mkdir -p src/assets/mobile
fi

# Build the web app with production optimizations
echo "Building web application for production..."
NODE_ENV=production npm run build

# Copy PWA and offline files to the dist folder
echo "Copying PWA assets to dist folder..."
cp client/public/offline.html dist/
cp client/public/manifest.json dist/

# Create icons directory in dist if not exists
mkdir -p dist/icons
mkdir -p dist/screenshots

# Generate app icons if ImageMagick is available
if [ -x "$(command -v convert)" ]; then
  echo "Generating app icons using ImageMagick..."
  ./generate-icons.sh
else
  echo "ImageMagick not found. Skipping icon generation."
  echo "If you need app icons, please install ImageMagick and run ./generate-icons.sh manually."
fi

# Copy any existing icons to dist folder
if [ -d "client/public/icons" ]; then
  echo "Copying app icons to dist folder..."
  cp -r client/public/icons/* dist/icons/ 2>/dev/null || :
fi

# Copy any screenshots to dist folder
if [ -d "client/public/screenshots" ]; then
  echo "Copying app screenshots to dist folder..."
  cp -r client/public/screenshots/* dist/screenshots/ 2>/dev/null || :
fi

# Run optimizations on build output
echo "Optimizing build for mobile..."
# Generate a service worker for offline capabilities
if [ -f "node_modules/workbox-cli/node_modules/.bin/workbox" ]; then
  echo "Generating service worker for offline support..."
  npx workbox-cli generateSW workbox-config.js || echo "Skipping service worker generation (workbox-config.js not found)"
else
  echo "Workbox CLI not found. Installing workbox-cli..."
  npm install workbox-cli
  echo "Generating service worker for offline support..."
  npx workbox-cli generateSW workbox-config.js || echo "Failed to generate service worker"
fi

# Initialize Capacitor if not already initialized
if [ ! -f "capacitor.config.ts" ]; then
  echo "Initializing Capacitor..."
  npx cap init GlobalEduConnect com.globaleduconnect.app
else
  echo "Capacitor already initialized, using existing configuration"
fi

# Add Android platform if not already added
if [ ! -d "android" ]; then
  echo "Adding Android platform..."
  npx cap add android
else
  echo "Android platform already exists, will sync latest changes"
fi

# Add iOS platform (if on macOS) if not already added
if [[ "$OSTYPE" == "darwin"* ]]; then
  if [ ! -d "ios" ]; then
    echo "Adding iOS platform..."
    npx cap add ios
  else
    echo "iOS platform already exists, will sync latest changes"
  fi
else
  echo "Skipping iOS platform (not on macOS)"
fi

# Copy web assets to mobile projects with optimization
echo "Copying and optimizing web assets for mobile..."
npx cap sync

# Apply custom native configuration
echo "Applying additional mobile optimizations..."

# For Android
if [ -d "android" ]; then
  echo "Optimizing Android configuration..."
  
  # Create android resource directories if needed
  mkdir -p android/app/src/main/res/xml
  
  # Set network security config for Android
  if [ ! -f "android/app/src/main/res/xml/network_security_config.xml" ]; then
    echo "Creating Android network security configuration..."
    cat > android/app/src/main/res/xml/network_security_config.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">globaleduconnect.replit.app</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
EOF
  fi
fi

# For iOS (macOS only)
if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
  echo "Optimizing iOS configuration..."
  
  # Add App Transport Security settings for iOS (would normally be done in Xcode)
  echo "Note: For iOS, please manually configure App Transport Security settings in Xcode"
fi

echo "Mobile setup completed successfully!"
echo ""
echo "✅ Web application built and optimized for mobile"
echo "✅ Capacitor configuration complete"
echo "✅ Mobile platforms prepared"
echo ""
echo "To open Android Studio: npx cap open android"
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "To open Xcode (macOS only): npx cap open ios"
fi
echo ""
echo "For subsequent builds, run: npm run build && npx cap sync"
echo ""
echo "To run in development mode with live reload:"
echo "npx cap run android --livereload --external"
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "npx cap run ios --livereload --external"
fi