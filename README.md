# Mirror Collective App

A cross-platform React Native mobile application that runs on both iOS and Android platforms.

## 🚀 Features

- **Cross-Platform**: Native iOS and Android support with a single codebase
- **TypeScript**: Full TypeScript integration for type safety
- **Modern React**: Uses React 19.1.0 with modern hooks and patterns
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Hot Reload**: Fast development with instant code updates
- **CocoaPods**: iOS dependency management configured and ready
- **Metro Bundler**: Fast and efficient JavaScript bundling

## 📱 Platforms Supported

- **iOS**: iPhone and iPad (iOS 13.4+)
- **Android**: Android devices (API level 21+)

## 🛠 Prerequisites

Before running this project, make sure you have:

### For macOS (Required for iOS development):

- **Xcode**: Latest version from the Mac App Store
- **Xcode Command Line Tools**: `xcode-select --install`
- **CocoaPods**: Installed via Homebrew (`brew install cocoapods`)

### For Android development:

- **Android Studio**: Download from [developer.android.com](https://developer.android.com/studio) or `brew install --cask android-studio`
- **Java Development Kit (JDK)**: Version 17 or higher (`brew install --cask zulu@17`)
- **Android SDK**: Installed through Android Studio
- **Android Virtual Device (AVD)**: Created via Android Studio

📖 **Complete Android Setup:** See [ANDROID_SETUP.md](ANDROID_SETUP.md) for detailed instructions.

### General requirements:

- **Node.js**: Version 18 or higher
- **npm** or **yarn**: Package manager
- **React Native CLI**: `npm install -g @react-native-community/cli`

## 🏗 Project Structure

```
MirrorCollectiveApp/
├── android/                 # Android-specific code and configuration
├── ios/                     # iOS-specific code and configuration
├── src/                     # Application source code (if organized)
├── App.tsx                  # Main application component
├── index.js                 # Entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── metro.config.js          # Metro bundler configuration
└── babel.config.js          # Babel configuration
```

## 🚀 Getting Started

### 👨‍💻 New Developer?

**First time setting up?** We have comprehensive guides for you:

- **📋 [Quick Start Checklist](QUICK_START_CHECKLIST.md)** - 5-minute overview
- **🚀 [New Developer Setup Guide](NEW_DEVELOPER_SETUP.md)** - Complete step-by-step instructions
- **🛠 [Development Guide](DEVELOPMENT.md)** - Detailed development workflows

### ⚡ Quick Setup (Experienced Developers)

```bash
# 1. Automated setup
./setup.sh

# 2. Start development
./start-metro.sh

# 3. Run the app
cd MirrorCollectiveApp && npm run ios
```

### 📋 Manual Setup Steps

1. **Install Dependencies**
   ```bash
   cd MirrorCollectiveApp
   npm install
   ```

2. **Install iOS Dependencies** (iOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Start Metro Bundler**
   ```bash
   npm start
   # Or use our smart script: ./start-metro.sh
   ```

4. **Run on iOS** (macOS only)
   ```bash
   npm run ios
   # Or specific simulator:
   npx react-native run-ios --simulator="iPhone 15 Pro"
   ```

5. **Run on Android**
   ```bash
   # 1. Start Android emulator first (via Android Studio)
   # Tools → AVD Manager → Start your emulator
   
   # 2. Verify emulator is running
   adb devices
   
   # 3. Run the app
   npm run android
   ```

**📖 Need Android Setup?** Follow [ANDROID_SETUP.md](ANDROID_SETUP.md) for complete setup instructions.

## 🔧 VS Code Tasks

This project includes pre-configured VS Code tasks for common development workflows:

- **Start Metro Bundler**: Start the development server
- **Run on iOS Simulator**: Build and run on iOS simulator
- **Run on Android Emulator**: Build and run on Android emulator
- **Clean Metro Cache**: Clear Metro bundler cache
- **Clean and Rebuild iOS**: Clean iOS build and rebuild
- **Clean and Rebuild Android**: Clean Android build and rebuild
- **Install Dependencies**: Install npm dependencies
- **Install iOS Pods**: Install CocoaPods dependencies
- **Lint Code**: Run ESLint code linting
- **Run Tests**: Execute Jest tests

Access these tasks via `Command Palette` → `Tasks: Run Task`

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run with coverage:

```bash
npm test -- --coverage
```

## 🧹 Code Quality

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run lint -- --fix
```

## 📦 Building for Production

### iOS

1. Open `ios/MirrorCollectiveApp.xcworkspace` in Xcode
2. Select your device or "Generic iOS Device"
3. Product → Archive
4. Follow the distribution workflow

### Android

```bash
cd android
./gradlew bundleRelease
```

## 🔍 Troubleshooting

### Common Issues

1. **Metro bundler won't start**

   ```bash
   npx react-native start --reset-cache
   ```

2. **iOS build fails**

   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

3. **Android build fails**

   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

4. **CocoaPods issues**
   ```bash
   cd ios
   pod deintegrate
   pod install
   ```

### Clear All Caches

```bash
# Clear npm cache
npm start -- --reset-cache

# Clear Metro cache
npx react-native start --reset-cache

# Clear Gradle cache (Android)
cd android && ./gradlew clean

# Clear Xcode cache (iOS)
# In Xcode: Product → Clean Build Folder
```

## 🌐 Environment Configuration

### Development

The app runs in development mode by default with:

- Hot reloading enabled
- Debug mode active
- Development server connection

### Production

For production builds:

- Optimized bundles
- Minified code
- Performance optimizations
- No debug information

## 📖 Learning Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [iOS Development Guide](https://reactnative.dev/docs/running-on-device)
- [Android Development Guide](https://reactnative.dev/docs/running-on-device)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the [React Native documentation](https://reactnative.dev)
3. Search existing issues in the repository
4. Create a new issue with detailed information

---

Built with ❤️ using React Native
