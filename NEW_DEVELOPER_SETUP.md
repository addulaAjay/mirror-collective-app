# 🚀 New Developer Setup Guide

**Welcome to the Mirror Collective App!** This guide will help you get up and running with the React Native development environment.

## 📋 Prerequisites Checklist

Before you start, make sure you have these tools installed:

### Required for All Platforms:

- [ ] **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- [ ] **Git** - [Download here](https://git-scm.com/)
- [ ] **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)

### For iOS Development (macOS only):

- [ ] **Xcode** (latest version from Mac App Store)
- [ ] **Xcode Command Line Tools**: Run `xcode-select --install`
- [ ] **Homebrew** - [Install here](https://brew.sh/)
- [ ] **CocoaPods**: Run `brew install cocoapods`

### For Android Development (Optional):

- [ ] **Java JDK 17+** - [Download here](https://www.oracle.com/java/technologies/downloads/) or `brew install --cask zulu@17`
- [ ] **Android Studio** - [Download here](https://developer.android.com/studio) or `brew install --cask android-studio`
- [ ] **Android SDK** (installed via Android Studio)
- [ ] **Android Virtual Device (AVD)** created and configured

📖 **Detailed Android Setup:** See [ANDROID_SETUP.md](ANDROID_SETUP.md) for complete instructions.

## 🛠 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd mirror_collective_app
```

### Step 2: Quick Setup (Recommended)

We have an automated setup script that handles most of the configuration:

```bash
# Make the setup script executable
chmod +x setup.sh

# Run the automated setup
./setup.sh
```

**What this script does:**

- Installs npm dependencies
- Sets up iOS CocoaPods (on macOS)
- Configures the development environment
- Provides next steps

### Step 3: Manual Setup (Alternative)

If you prefer manual setup or the script fails:

```bash
# 1. Navigate to the app directory
cd MirrorCollectiveApp

# 2. Install npm dependencies
npm install

# 3. iOS setup (macOS only)
cd ios
pod install
cd ..
```

### Step 4: Start Development

```bash
# Option 1: Use our smart Metro script (handles port conflicts)
cd ..  # Go back to project root
./start-metro.sh

# Option 2: Standard Metro start
cd MirrorCollectiveApp
npm start
```

### Step 5: Run the App

#### iOS (macOS only):

```bash
# Default simulator
npm run ios

# Specific simulator
npx react-native run-ios --simulator="iPhone 15 Pro"
```

#### Android (requires Android setup):

```bash
# 1. Start Android emulator first (via Android Studio)
# Tools → AVD Manager → Start emulator

# 2. Make sure emulator is running
adb devices

# 3. Run the app
npm run android
```

**📖 Need Android setup?** Follow [ANDROID_SETUP.md](ANDROID_SETUP.md) for complete Android development environment setup.

## 🎯 Expected Results

After successful setup, you should see:

1. **Metro bundler running** on `http://localhost:8082` (or 8081)
2. **iOS simulator** opens with the Mirror Collective app
3. **App displays** with:
   - 🚀 Mirror Collective title
   - Cross-Platform Mobile App subtitle
   - Feature cards with dark/light mode support
   - "Get Started" button that shows an alert

## 🔧 VS Code Integration

### Recommended Extensions

Open VS Code and install these extensions (or use our extension recommendations):

- **React Native Tools** - Debugging and IntelliSense
- **ES7+ React/Redux/React-Native snippets** - Code snippets
- **TypeScript Importer** - Auto import management
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **GitLens** - Git integration

### VS Code Tasks

Press `Cmd+Shift+P` → "Tasks: Run Task" to access:

- **Start Metro Bundler** - Start development server
- **Run on iOS Simulator** - Build and run iOS
- **Run on Android Emulator** - Build and run Android
- **Clean Metro Cache** - Clear bundler cache
- **Install iOS Pods** - Update iOS dependencies
- **Lint Code** - Run ESLint

## 🐛 Troubleshooting Common Issues

### Issue 1: Port 8081 Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::8081`

**Solution:**

```bash
# Use our port management script
./start-metro.sh

# Or manually use different port
npx react-native start --port 8082
```

### Issue 2: iOS Build Fails (Error Code 70)

**Error:** `"xcodebuild" exited with error code '70'`

**Solution:**

```bash
cd MirrorCollectiveApp/ios
xcodebuild clean -workspace MirrorCollectiveApp.xcworkspace -scheme MirrorCollectiveApp
rm -rf Pods && rm Podfile.lock && pod install
cd .. && npx react-native run-ios
```

### Issue 3: CocoaPods Issues

**Error:** Pod-related errors

**Solution:**

```bash
cd MirrorCollectiveApp/ios
pod deintegrate
pod install
cd ..
```

### Issue 4: Metro Cache Issues

**Error:** Bundling errors or old code showing

**Solution:**

```bash
npx react-native start --reset-cache
```

### Issue 5: Android Setup Required

**Error:** Java/Android SDK not found

**Solution:**

1. Install Java JDK 11+
2. Install Android Studio
3. Set up Android SDK
4. Create Android Virtual Device (AVD)
5. Configure environment variables

## 📱 Development Workflow

### Daily Development:

1. **Start Metro:** `./start-metro.sh` (from project root)
2. **Run iOS:** `npm run ios` (from MirrorCollectiveApp/)
3. **Make changes** to `App.tsx` or other files
4. **See changes instantly** with hot reload

### Code Quality:

```bash
# Run linting
npm run lint

# Fix lint issues
npm run lint -- --fix

# Run tests
npm test
```

## 📁 Key Files to Know

- **`App.tsx`** - Main app component (your starting point)
- **`package.json`** - Dependencies and scripts
- **`ios/`** - iOS-specific code and configuration
- **`android/`** - Android-specific code and configuration
- **`.vscode/tasks.json`** - VS Code task configurations
- **`DEVELOPMENT.md`** - Detailed development documentation

## 🎉 You're Ready!

If you've completed all steps successfully:

✅ Metro bundler is running  
✅ iOS app is running on simulator  
✅ You can see the Mirror Collective welcome screen  
✅ Hot reload is working when you make changes

**Next Steps:**

1. Read through `DEVELOPMENT.md` for detailed documentation
2. Explore the `App.tsx` file to understand the code structure
3. Try making small changes and see them update live
4. Check out the VS Code tasks for common workflows

## 🆘 Need Help?

1. **Check existing documentation:**

   - `README.md` - Project overview
   - `DEVELOPMENT.md` - Detailed development guide

2. **Common commands:**

   ```bash
   ./start-metro.sh           # Smart Metro startup
   npm run ios               # Run iOS app
   npm run lint              # Check code quality
   npm test                  # Run tests
   ```

3. **If still stuck:**
   - Check the troubleshooting sections in this guide
   - Review [ANDROID_SETUP.md](ANDROID_SETUP.md) for Android-specific issues
   - Check React Native documentation
   - Ask team members for help

**Welcome to the team! Happy coding! 🚀**
