#!/bin/bash

# Mirror Collective App - Setup Script
# This script helps set up the development environment

echo "🚀 Setting up Mirror Collective App..."
echo "======================================"

# Check if we're in the right directory
if [ ! -d "MirrorCollectiveApp" ]; then
    echo "❌ Error: MirrorCollectiveApp directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Navigate to the app directory
cd MirrorCollectiveApp

echo "📦 Installing npm dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ npm dependencies installed successfully"
else
    echo "❌ Failed to install npm dependencies"
    exit 1
fi

# Check if we're on macOS (required for iOS development)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS - Setting up iOS dependencies..."
    
    # Check if CocoaPods is installed
    if command -v pod &> /dev/null; then
        echo "📱 Installing iOS CocoaPods dependencies..."
        cd ios
        pod install
        if [ $? -eq 0 ]; then
            echo "✅ iOS dependencies installed successfully"
        else
            echo "❌ Failed to install iOS dependencies"
            cd ..
            exit 1
        fi
        cd ..
    else
        echo "⚠️  CocoaPods not found. Installing via Homebrew..."
        if command -v brew &> /dev/null; then
            brew install cocoapods
            cd ios
            pod install
            cd ..
            echo "✅ CocoaPods installed and iOS dependencies configured"
        else
            echo "❌ Homebrew not found. Please install CocoaPods manually:"
            echo "   brew install cocoapods"
            echo "   cd ios && pod install"
        fi
    fi
else
    echo "⚠️  Not running on macOS - iOS development not available"
    echo "You can still develop for Android on this platform"
fi

# Check for Java (required for Android development)
echo ""
echo "☕ Checking Java installation..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}')
    echo "✅ Java found: $JAVA_VERSION"
else
    echo "⚠️  Java not found. Installing Java 17 for Android development..."
    if command -v brew &> /dev/null; then
        brew install --cask zulu@17
        echo "✅ Java 17 installed"
    else
        echo "❌ Homebrew not found. Please install Java manually:"
        echo "   brew install --cask zulu@17"
        echo "   Or download from: https://www.oracle.com/java/technologies/downloads/"
    fi
fi

# Check for Android Studio (optional)
echo ""
echo "🤖 Checking Android development setup..."
if [ -d "/Applications/Android Studio.app" ]; then
    echo "✅ Android Studio found"
    echo "💡 To complete Android setup, see ANDROID_SETUP.md"
else
    echo "⚠️  Android Studio not found"
    echo "For Android development:"
    echo "   brew install --cask android-studio"
    echo "   Or download from: https://developer.android.com/studio"
    echo "📖 See ANDROID_SETUP.md for complete instructions"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "==========="
echo "1. Start the Metro bundler:"
echo "   npm start"
echo ""
echo "2. Run on iOS (macOS only):"
echo "   npm run ios"
echo ""
echo "3. Run on Android (requires Android setup):"
echo "   npm run android"
echo ""
echo "� For Android development setup:"
echo "   See ANDROID_SETUP.md for complete instructions"
echo ""
echo "�📚 For more information, see:"
echo "   - README.md - Project overview"
echo "   - NEW_DEVELOPER_SETUP.md - Complete setup guide"
echo "   - DEVELOPMENT.md - Development workflows"
echo ""
echo "Happy coding! 🚀"
