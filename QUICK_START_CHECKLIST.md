# 📋 Quick Setup Checklist

**For new developers joining the Mirror Collective App project**

## ✅ Pre-Setup Checklist

**Required Tools:**
- [ ] Node.js v18+ installed
- [ ] Git installed
- [ ] VS Code installed

**For iOS Development (macOS only):**
- [ ] Xcode installed (Mac App Store)
- [ ] Command Line Tools: `xcode-select --install`
- [ ] Homebrew installed
- [ ] CocoaPods: `brew install cocoapods`

**For Android Development (optional):**
- [ ] Java JDK 17+ installed (`brew install --cask zulu@17`)
- [ ] Android Studio installed (`brew install --cask android-studio`)
- [ ] Android SDK configured via Android Studio
- [ ] Android Virtual Device (AVD) created

📖 **Android Setup:** See [ANDROID_SETUP.md](ANDROID_SETUP.md)

## 🚀 Setup Commands

```bash
# 1. Clone repository
git clone <repo-url>
cd mirror_collective_app

# 2. Run automated setup
chmod +x setup.sh
./setup.sh

# 3. Start development
./start-metro.sh
```

```bash
# 4a. Run iOS app (in new terminal)
cd MirrorCollectiveApp
npm run ios

# 4b. Run Android app (requires Android setup first)
# See ANDROID_SETUP.md for emulator setup
npm run android
```

## ✅ Success Indicators

- [ ] Metro running on http://localhost:8082
- [ ] iOS simulator opens
- [ ] App shows "Mirror Collective" welcome screen
- [ ] Hot reload works when editing files

## 🔧 VS Code Tasks

Press `Cmd+Shift+P` → "Tasks: Run Task":
- Start Metro Bundler
- Run on iOS Simulator  
- Clean Metro Cache
- Install iOS Pods

## 🐛 Quick Fixes

**Port busy:** `./start-metro.sh`  
**iOS build fails:** Clean Xcode + reinstall pods  
**Cache issues:** `npx react-native start --reset-cache`  

## 📚 Key Files

- `App.tsx` - Main component (start here)
- `NEW_DEVELOPER_SETUP.md` - Full setup guide
- `DEVELOPMENT.md` - Detailed documentation
- `README.md` - Project overview

---
**Ready to code! 🎉**
