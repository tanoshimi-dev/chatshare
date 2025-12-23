# ChatShare — iOS setup & fixes summary

This document summarizes the work performed to add and fix iOS support for the React Native `chatshare` app.

## Situation
- The project was created with React Native CLI but the repository did not include an `ios/` directory (it appeared to be a Windows-targeted RN CLI project).

## What I did (high level)
- Created a temporary React Native project using the same RN version (0.83.1) and copied its `ios/` directory into the project.
- Installed JS dependencies and CocoaPods, ran `pod install` to install iOS native dependencies.
- Fixed a JS/native registration mismatch by updating `AppDelegate.swift` to register the module name `chatshare` (matching `app.json`).
- Renamed Xcode project & scheme from `tempChatshare` → `chatshare` and updated scheme files so the workspace builds cleanly.
- Copied `react-native-vector-icons` font files into `ios/chatshare/Fonts` and added them to `UIAppFonts` in `ios/chatshare/Info.plist` so icons work on iOS.
- Implemented a safe drawer-open fallback in screen headers (`navigation.openDrawer()` → `navigation.getParent()?.openDrawer()` fallback) so the app's drawer can open when nested.
- Updated the bottom tab navigator to use local image assets for icons (with a vector-icon fallback) and added `src/assets/icons/` with README and `.gitkeep` for guidance.

## Key files added or modified
- Added `ios/` to the project: [sys/frontend/user/mobile/chatshare/ios](sys/frontend/user/mobile/chatshare/ios)
- Updated native AppDelegate: [sys/frontend/user/mobile/chatshare/ios/chatshare/AppDelegate.swift](sys/frontend/user/mobile/chatshare/ios/chatshare/AppDelegate.swift)
- Updated Xcode project/scheme files: [sys/frontend/user/mobile/chatshare/ios/chatshare.xcodeproj](sys/frontend/user/mobile/chatshare/ios/chatshare.xcodeproj)
- Added fonts to iOS bundle and `Info.plist`: [sys/frontend/user/mobile/chatshare/ios/chatshare/Fonts](sys/frontend/user/mobile/chatshare/ios/chatshare/Fonts) and [sys/frontend/user/mobile/chatshare/ios/chatshare/Info.plist](sys/frontend/user/mobile/chatshare/ios/chatshare/Info.plist)
- Updated navigation and screens:
  - [sys/frontend/user/mobile/chatshare/src/navigation/BottomTabNavigator.tsx](sys/frontend/user/mobile/chatshare/src/navigation/BottomTabNavigator.tsx)
  - [sys/frontend/user/mobile/chatshare/src/navigation/DrawerNavigator.tsx](sys/frontend/user/mobile/chatshare/src/navigation/DrawerNavigator.tsx)
  - [sys/frontend/user/mobile/chatshare/src/navigation/CustomDrawerContent.tsx](sys/frontend/user/mobile/chatshare/src/navigation/CustomDrawerContent.tsx)
  - Header fixes in screens: `HomeScreen`, `SearchScreen`, `ShareScreen`, `FavoriteScreen` (safe drawer open logic)
- Added assets folder (place icons here): [sys/frontend/user/mobile/chatshare/src/assets/icons](sys/frontend/user/mobile/chatshare/src/assets/icons)

## Exact commands I ran (representative)
```bash
# create temp project and copy ios (performed via RN init)
npx react-native init tempChatshare --version 0.83.1
cp -R tempChatshare/ios ./ios
rm -rf tempChatshare

# install JS deps
npm install

# install pods
cd ios
pod install

# run the iOS simulator
cd ..
npx react-native run-ios --simulator "iPhone 17"
```

Also used these to fix fonts and Info.plist:
```bash
mkdir -p ios/chatshare/Fonts
cp node_modules/react-native-vector-icons/Fonts/*.ttf ios/chatshare/Fonts/
# Add those font filenames to UIAppFonts in ios/chatshare/Info.plist
cd ios && pod install --repo-update
```

## Why these steps were necessary
- React Native CLI apps require native `ios/` and `android/` directories for platform builds; without `ios/` the native iOS app cannot be built or run.
- iOS requires font files to be added to the app bundle and referenced via `UIAppFonts` in `Info.plist` for vector icons to render correctly.
- The JS app name (`app.json` → `name`) must match the native module registered in `AppDelegate` or App registration errors appear ("has not been registered").

## Next recommended actions (manual / optional)
1. Open Xcode workspace and set signing & team: `open ios/chatshare.xcworkspace`.
2. Change the app bundle identifier and product name in Xcode if you want the app id to be your own (e.g. `com.yourcompany.chatshare`).
3. Add real icon PNGs to `src/assets/icons/` (see README in that folder). The code falls back to vector icons if images are missing.
4. Commit the `ios/` folder and any added assets when you're ready:
```bash
git add ios src/assets/icons
git commit -m "Add iOS project and tab icons"
```

## Troubleshooting notes
- If the Metro server port 8081 is in use: find and kill the process: `lsof -i :8081` then `kill <PID>`.
- If icons are still blank on iOS: clean build folder in Xcode (Product → Clean Build Folder), restart Metro with `npx react-native start --reset-cache`, then rebuild.

---

If you want, I can now:
- commit the `ios/` folder and fonts into git, or
- rename the Xcode target/product values programmatically to `chatshare` everywhere, or
- add placeholder icon PNGs so the tabs show images immediately.
