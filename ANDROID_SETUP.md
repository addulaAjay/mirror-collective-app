# 🤖 Android Development Setup Guide

## 📋 Prerequisites

Before setting up Android development, ensure you have:

- ✅ **Java JDK 17+** installed
- ✅ **Android Studio** installed
- ✅ **React Native CLI** installed
- ✅ **Node.js 18+** installed

## 🛠 Step-by-Step Android Setup

### Step 1: Install Java (if not already installed)

```bash
# Install Java via Homebrew
brew install --cask zulu@17

# Verify installation
java -version
```

### Step 2: Install Android Studio

```bash
# Install via Homebrew
brew install --cask android-studio

# Or download manually from:
# https://developer.android.com/studio
```

### Step 3: Android Studio Initial Setup

1. **Open Android Studio** from Applications or run:

   ```bash
   open -a "Android Studio"
   ```

2. **Complete Setup Wizard:**

   - Choose "Standard" installation
   - Accept all license agreements
   - Let it download Android SDK, platform-tools, and emulator
   - Wait for initial sync to complete

3. **Verify SDK Installation:**
   - Go to `Preferences` → `Appearance & Behavior` → `System Settings` → `Android SDK`
   - Note the SDK location (usually `/Users/[username]/Library/Android/sdk`)

### Step 4: Configure Environment Variables

Add these to your `~/.zshrc` file:

```bash
# Android environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Apply changes:

```bash
source ~/.zshrc
```

### Step 5: Create Android Virtual Device (AVD)

1. **Open AVD Manager:**

   - In Android Studio: `Tools` → `AVD Manager`
   - Or click the AVD Manager icon in the toolbar

2. **Create Virtual Device:**

   - Click "Create Virtual Device"
   - Choose "Phone" → "Pixel 7" (recommended)
   - Select system image: **API 34 (Android 14)** with Google APIs
   - Click "Download" if not already downloaded
   - Configure AVD:
     - Name: `Pixel_7_API_34`
     - Advanced Settings → RAM: 4096 MB (if your Mac has enough RAM)
   - Click "Finish"

3. **Test AVD:**
   - Click the "Play" button next to your AVD
   - Wait for emulator to boot (can take 2-3 minutes first time)

### Step 6: Verify Command Line Tools

```bash
# Check if tools are accessible
adb version
emulator -version
sdkmanager --version

# If any command fails, restart terminal and try again
```

## 🚀 Running React Native on Android

### Step 1: Start Android Emulator

```bash
# Method 1: Via Android Studio AVD Manager (Recommended)
# Open Android Studio → Tools → AVD Manager → Click Play button

# Method 2: Via Command Line
emulator -avd Pixel_7_API_34

# Method 3: List and start any available AVD
emulator -list-avds
emulator @[avd-name]
```

### Step 2: Start Metro Bundler

```bash
cd MirrorCollectiveApp

# Start Metro on port 8082 (our configured port)
npx react-native start --port=8082
```

### Step 3: Build and Run Android App

```bash
# In a new terminal (while Metro is running)
cd MirrorCollectiveApp

# Build and install on emulator/device
RCT_METRO_PORT=8082 npx react-native run-android

# Or using npm script
npm run android
```

## 🔧 Troubleshooting Android Issues

### Issue 1: `adb not found`

**Solution:**

```bash
# Add platform-tools to PATH
export PATH=$PATH:$ANDROID_HOME/platform-tools
source ~/.zshrc

# Or use full path temporarily
$ANDROID_HOME/platform-tools/adb devices
```

### Issue 2: No Android Emulator Running

**Error:** `No emulators found as an output of emulator -list-avds`

**Solution:**

1. Open Android Studio
2. Go to `Tools` → `AVD Manager`
3. Create a new Virtual Device (see Step 5 above)
4. Start the emulator before running `npm run android`

### Issue 3: Java Runtime Not Found

**Error:** `Unable to locate a Java Runtime`

**Solution:**

```bash
# Install Java JDK
brew install --cask zulu@17

# Verify installation
java -version
```

### Issue 4: SDK License Issues

**Error:** License acceptance required

**Solution:**

```bash
# Accept all SDK licenses
yes | sdkmanager --licenses

# Or manually in Android Studio:
# SDK Manager → Install any pending updates → Accept licenses
```

### Issue 5: Metro Port Configuration

If using port 8082 instead of default 8081:

```bash
# Method 1: Set environment variable
export RCT_METRO_PORT=8082
npx react-native run-android

# Method 2: Configure device manually
adb reverse tcp:8082 tcp:8082

# Method 3: Use device settings
# Shake device → Dev Settings → Debug server host & port → Set to your-ip:8082
```

### Issue 6: Gradle Build Failures

**Solution:**

```bash
cd MirrorCollectiveApp/android

# Clean Gradle cache
./gradlew clean

# Try building again
cd .. && npx react-native run-android
```

### Issue 7: Emulator Performance Issues

**Solutions:**

- **Increase RAM:** AVD Manager → Edit AVD → Advanced → RAM: 4096 MB
- **Enable Hardware Acceleration:** Ensure Intel HAXM or Apple Silicon support
- **Close other apps:** Free up system resources
- **Use x86_64 images:** Faster on Intel Macs

## 📱 Android Development Workflow

### Daily Development:

1. **Start Emulator:**

   ```bash
   # Via Android Studio (recommended)
   open -a "Android Studio"
   # Then: Tools → AVD Manager → Start emulator
   ```

2. **Start Metro:**

   ```bash
   cd MirrorCollectiveApp
   ./start-metro.sh  # Uses smart port management
   ```

3. **Run Android App:**

   ```bash
   npm run android
   ```

4. **Development:**
   - Edit code in `App.tsx`
   - Press `R` twice in Android emulator for reload
   - Or shake device for dev menu

### VS Code Tasks for Android:

Use `Cmd+Shift+P` → "Tasks: Run Task":

- **Run on Android Emulator** - Build and run Android
- **Clean Android Build** - Clear Gradle cache
- **Start Android Emulator** - Launch emulator

## 🔍 Useful Android Commands

```bash
# Device management
adb devices                          # List connected devices
adb reverse tcp:8082 tcp:8082       # Port forwarding for Metro

# Emulator management
emulator -list-avds                 # List available AVDs
emulator -avd Pixel_7_API_34        # Start specific AVD

# Debugging
npx react-native log-android        # View Android logs
adb logcat                          # Full Android logs

# Build management
cd android && ./gradlew clean       # Clean Android build
```

## ✅ Success Checklist

After completing setup, you should be able to:

- [ ] Open Android Studio without errors
- [ ] See Android SDK installed in preferences
- [ ] Create and start Android Virtual Device
- [ ] Run `adb devices` and see your emulator
- [ ] Build Android app with `npm run android`
- [ ] See Mirror Collective app running on Android emulator
- [ ] Hot reload works when editing code

## 🎯 Performance Tips

1. **Use x86_64 emulator images** for better performance
2. **Allocate sufficient RAM** to AVD (4GB recommended)
3. **Enable hardware acceleration** in AVD settings
4. **Close unnecessary apps** while developing
5. **Use Genymotion** as alternative emulator for better performance

---

**Android setup complete! 🎉 You can now develop for both iOS and Android!**
