#!/bin/bash

# Android Development Verification Script
# This script checks if Android development environment is properly set up

echo "🤖 Android Development Environment Check"
echo "========================================="

# Check Java
echo ""
echo "☕ Checking Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}')
    echo "✅ Java found: $JAVA_VERSION"
else
    echo "❌ Java not found"
    echo "   Install with: brew install --cask zulu@17"
    exit 1
fi

# Check Android Studio
echo ""
echo "🎨 Checking Android Studio..."
if [ -d "/Applications/Android Studio.app" ]; then
    echo "✅ Android Studio installed"
else
    echo "❌ Android Studio not found"
    echo "   Install with: brew install --cask android-studio"
    exit 1
fi

# Check Android SDK
echo ""
echo "📱 Checking Android SDK..."
if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME" ]; then
    echo "✅ ANDROID_HOME set: $ANDROID_HOME"
    
    # Check for key SDK components
    if [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
        echo "✅ ADB found"
        ADB_VERSION=$($ANDROID_HOME/platform-tools/adb version 2>&1 | head -1)
        echo "   $ADB_VERSION"
    else
        echo "⚠️  ADB not found in platform-tools"
    fi
    
    if [ -d "$ANDROID_HOME/emulator" ]; then
        echo "✅ Emulator tools found"
    else
        echo "⚠️  Emulator tools not found"
    fi
    
else
    echo "❌ ANDROID_HOME not set or SDK not found"
    echo "   Expected location: $HOME/Library/Android/sdk"
    echo "   Run Android Studio and complete initial setup"
    exit 1
fi

# Check for AVDs
echo ""
echo "📲 Checking Android Virtual Devices..."
if command -v emulator &> /dev/null; then
    AVDS=$(emulator -list-avds 2>/dev/null)
    if [ -n "$AVDS" ]; then
        echo "✅ AVDs found:"
        echo "$AVDS" | sed 's/^/   /'
    else
        echo "⚠️  No AVDs found"
        echo "   Create one in Android Studio: Tools → AVD Manager"
    fi
else
    echo "❌ Emulator command not found"
    echo "   Check PATH includes: $ANDROID_HOME/emulator"
fi

# Check for running devices
echo ""
echo "🔗 Checking connected devices..."
if command -v adb &> /dev/null; then
    DEVICES=$(adb devices | grep -v "List of devices")
    if [ -n "$DEVICES" ] && [ "$DEVICES" != "" ]; then
        echo "✅ Connected devices:"
        echo "$DEVICES" | sed 's/^/   /'
    else
        echo "⚠️  No devices connected"
        echo "   Start an emulator or connect a physical device"
    fi
else
    echo "❌ ADB command not found"
    echo "   Check PATH includes: $ANDROID_HOME/platform-tools"
fi

# Check React Native project
echo ""
echo "⚛️  Checking React Native project..."
if [ -f "MirrorCollectiveApp/android/gradlew" ]; then
    echo "✅ Android project structure found"
    
    # Test Gradle
    cd MirrorCollectiveApp/android
    if ./gradlew --version > /dev/null 2>&1; then
        echo "✅ Gradle wrapper working"
    else
        echo "⚠️  Gradle wrapper issues"
    fi
    cd ../..
else
    echo "❌ Android project not found"
    echo "   Expected: MirrorCollectiveApp/android/gradlew"
fi

echo ""
echo "📋 Summary:"
echo "==========="

# Quick status check
ALL_GOOD=true

if ! command -v java &> /dev/null; then ALL_GOOD=false; fi
if [ ! -d "/Applications/Android Studio.app" ]; then ALL_GOOD=false; fi
if [ ! -n "$ANDROID_HOME" ] || [ ! -d "$ANDROID_HOME" ]; then ALL_GOOD=false; fi

if [ "$ALL_GOOD" = true ]; then
    echo "🎉 Android development environment looks good!"
    echo ""
    echo "Next steps:"
    echo "1. Start Android emulator (via Android Studio)"
    echo "2. Run: npm run android"
    echo ""
    echo "📖 See ANDROID_SETUP.md for detailed instructions"
else
    echo "⚠️  Some components missing - see errors above"
    echo ""
    echo "📖 See ANDROID_SETUP.md for complete setup instructions"
fi
