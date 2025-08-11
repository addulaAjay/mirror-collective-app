#!/usr/bin/env bash
set -euo pipefail

echo "[android-clean] Stopping gradle daemons"
(cd android && ./gradlew --stop) || true

echo "[android-clean] Removing build + .cxx artifacts"
rm -rf android/app/build android/build android/app/.cxx

echo "[android-clean] Removing react-native android build intermediates"
rm -rf node_modules/react-native/ReactAndroid/build || true

echo "[android-clean] Clearing Gradle react-android caches"
find "$HOME/.gradle/caches" -type d -path "*react-android-0.80.1*" -prune -exec rm -rf {} + 2>/dev/null || true

echo "[android-clean] Removing per-app CMake/NDK cache"
rm -rf android/app/.cxx

if [ "${1:-}" = "reinstall" ]; then
  echo "[android-clean] Reinstalling JS dependencies"
  rm -rf node_modules package-lock.json
  npm install
fi

echo "[android-clean] Gradle clean"
(cd android && ./gradlew clean)

echo "[android-clean] Done. Rebuild with: npx react-native run-android"
