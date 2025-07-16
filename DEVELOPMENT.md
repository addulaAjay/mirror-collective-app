# Quick Development Guide

## ✅ Current Status

**iOS Development Ready!**

- ✅ React Native 0.80.1 installed
- ✅ CocoaPods configured and installed
- ✅ Metro bundler running on port 8082
- ✅ iOS build successful (iPhone 16 Pro simulator)
- ✅ iOS app successfully launched and running
- ✅ Java JDK 17 installed
- ✅ Android Studio installed
- ⚠️ Android emulator setup pending (see [ANDROID_SETUP.md](ANDROID_SETUP.md))

## 🚀 Quick Start

### Option 1: Automated Setup

```bash
# Run the setup script
./setup.sh
```

### Option 2: Manual Setup

```bash
# Install dependencies
cd MirrorCollectiveApp
npm install

# iOS setup (macOS only)
cd ios && pod install && cd ..

# Start development
npm start
```

### Option 3: Port Manager (Recommended)

```bash
# Start Metro with automatic port management
./start-metro.sh        # Uses port 8082 by default
./start-metro.sh 8083   # Use specific port
```

## 📱 Running the App

### Start Metro Bundler (Required first)

```bash
# Default port (8081)
npm start

# Use a different port if 8081 is busy
npx react-native start --port 8082

# Reset cache and use different port
npx react-native start --port 8082 --reset-cache
```

### iOS Development (macOS only)

```bash
# Default simulator
npm run ios

# Specific simulator
npx react-native run-ios --simulator="iPhone 15 Pro"
```

### Android Development

```bash
# 1. Start Android emulator first (via Android Studio or command line)
emulator -avd Pixel_7_API_34

# 2. Verify emulator is running
adb devices

# 3. Run the app
npm run android

# Alternative: Use RN CLI directly with custom Metro port
RCT_METRO_PORT=8082 npx react-native run-android
```

**📖 Android Setup Required?** See [ANDROID_SETUP.md](ANDROID_SETUP.md) for complete setup instructions.

## 🛠 VS Code Integration

### Tasks Available

- `Start Metro Bundler` - Start development server
- `Run on iOS Simulator` - Build and run iOS
- `Run on Android Emulator` - Build and run Android
- `Clean Metro Cache` - Clear bundler cache
- `Install Dependencies` - Install npm packages
- `Install iOS Pods` - Update iOS dependencies

### Keyboard Shortcuts

- `Cmd+Shift+P` → "Tasks: Run Task" → Select task

## 🧹 Troubleshooting

### Clear Everything

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear iOS build
cd ios && xcodebuild clean && cd ..

# Clear Android build
cd android && ./gradlew clean && cd ..

# Reinstall dependencies
rm -rf node_modules && npm install
cd ios && pod install && cd ..
```

### Common Issues

1. **Metro won't start**: Clear cache and restart
2. **iOS won't build**: Clean Xcode project and pods
3. **Android won't build**: Clear Gradle cache
4. **Hot reload not working**: Restart Metro bundler
5. **Port 8081 in use**: Use different port or kill conflicting process
6. **Xcode build fails (error code 70)**: Clean and rebuild

### Xcode Build Issues

If you get "xcodebuild exited with error code '70'":

```bash
# 1. Clean Xcode workspace
cd ios && xcodebuild clean -workspace MirrorCollectiveApp.xcworkspace -scheme MirrorCollectiveApp

# 2. Reinstall CocoaPods dependencies
rm -rf Pods && rm Podfile.lock && pod install

# 3. Try building again
cd .. && npx react-native run-ios

# 4. If still failing, open in Xcode for detailed error logs
open ios/MirrorCollectiveApp.xcworkspace
```

### Port Conflicts (EADDRINUSE)

If you see "Error: listen EADDRINUSE: address already in use :::8081":

```bash
# Option 1: Use a different port
npx react-native start --port 8082

# Option 2: Find and kill the process using port 8081
lsof -ti:8081
kill -9 <PID>

# Option 3: Kill all Node processes (nuclear option)
pkill -f node

# Option 4: Use netstat to find what's using the port
netstat -an | grep 8081
```

## 📝 Development Tips

1. **File Organization**: Keep components in logical folders
2. **TypeScript**: Use proper types for better development experience
3. **Testing**: Add tests as you develop features
4. **Performance**: Use React DevTools for optimization
5. **Debugging**: Use Flipper or Chrome DevTools

## 🔧 Useful Commands

```bash
# Development
npm start                    # Start Metro bundler (port 8081)
npx react-native start --port 8082  # Start on different port
npm run ios                  # Run on iOS
npm run android             # Run on Android

# Code Quality
npm run lint                # Run ESLint
npm run lint -- --fix      # Fix ESLint issues
npm test                    # Run tests

# Debugging
npx react-native log-ios    # iOS logs
npx react-native log-android # Android logs

# Port Management
lsof -ti:8081               # Find process using port 8081
kill -9 $(lsof -ti:8081)   # Kill process using port 8081
npx react-native start --port 8082  # Use alternative port

# Cleanup
npx react-native start --reset-cache  # Clear Metro cache
```

## 🔧 Custom Port Configuration

When using a custom port (not 8081), you may need to configure your device/simulator:

### iOS Simulator

Usually works automatically with any port.

### Physical iOS Device

1. Shake the device or press `Cmd+D` in simulator
2. Tap "Configure Bundler"
3. Enter your computer's IP and custom port (e.g., `192.168.1.100:8082`)

### Android Emulator/Device

```bash
# Forward the custom port to the device
adb reverse tcp:8082 tcp:8082

# Or set up the dev server URL manually:
# 1. Shake the device or press `Cmd+M`
# 2. Tap "Dev Settings"
# 3. Tap "Debug server host & port for device"
# 4. Enter: your-ip:8082 (e.g., 192.168.1.100:8082)
```

### Find Your IP Address

```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Get just the main IP
ipconfig getifaddr en0
```

Happy coding! 🎉
