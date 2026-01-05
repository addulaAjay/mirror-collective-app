# Project Context

## Overview
MirrorCollectiveApp is a React Native application targeting both iOS and Android platforms. It uses standard React Native tooling along with specific configurations for Firebase distribution and native builds.

## Directory Structure
- **Root**: Contains configuration files (`package.json`, `tsconfig.json`, `babel.config.js`) and documentation.
- **src**: Source code for the Release application components and logic.
- **android**: Android native project files.
- **ios**: iOS native project files.
- **__tests__**: Test files.

## Key Configurations & Scripts

### NPM Scripts (`package.json`)
- **Start**: `npm start` (Runs metro bundler on port 8083)
- **Android**:
    - Run: `npm run android`
    - Build APK: `npm run build:android:apk`
    - Build Bundle: `npm run build:android:bundle`
    - Distribute: `npm run distribute:android` (Firebase App Distribution)
    - Clean: `npm run clean:android` or `npm run android:deep-clean`
- **iOS**:
    - Run: `npm run ios`
    - Build Archive: `npm run build:ios:archive`
    - Distribute: `npm run distribute:ios`
    - Clean: `npm run clean:ios`
- **Testing**: `npm test` (Vitest), `npm run test:ui`

### Recent Configuration Changes
#### Android (`android/build.gradle`, `android/gradle.properties`)
- **Gradle Plugin**: Updated to `8.6.0`
- **Kotlin Plugin**: Updated to `2.1.20`
- **Compile SDK**: Suppressed warning for SDK 35 (`android.suppressUnsupportedCompileSdk=35`)

#### Dependencies
- React Native: `0.80.1`
- React: `19.1.0`
- TypeScript: `5.0.4`

## Development Notes
- The project uses `vitest` for testing.
- Firebase App Distribution is configured for both iOS and Android.
- A custom port (8083) is used for the metro bundler.
