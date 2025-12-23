## Enabling react-native-vector-icons (MaterialIcons) on iOS

Summary
-------
This note explains the minimal steps I performed to make `react-native-vector-icons/MaterialIcons` (and other icon fonts) work on iOS for the ChatShare project.

Problem
-------
- Android displayed icons correctly, but on iOS icons were blank/squares. The project did not originally include an `ios/` folder.

Solution (what I did)
---------------------
1. Add an `ios/` native project (I created a temp RN project with the same RN version and copied its `ios/` folder into the repo).
2. Copy the vector icon TTF files into the iOS app bundle resources:

   - Create a Fonts folder under the app target resources (example used here):
     `ios/chatshare/Fonts`
   - Copy fonts from `node_modules/react-native-vector-icons/Fonts/*.ttf` into that folder.

3. Add the font filenames to `UIAppFonts` in the iOS Info.plist so iOS bundles them:

   - Example entry added to `ios/chatshare/Info.plist` (array `UIAppFonts`):
     - `MaterialIcons.ttf`
     - (and the rest of the ttf files you copied)

4. Reinstall CocoaPods / integrate native changes:

   ```bash
   cd ios
   pod install --repo-update
   ```

5. Rebuild the app (also restart Metro):

   ```bash
   # in project root
   npx react-native start --reset-cache
   npx react-native run-ios --simulator "iPhone 17"
   ```

Why this is required
---------------------
- On iOS, custom fonts (including icon fonts) must be included in the app bundle and listed in `UIAppFonts` inside `Info.plist`. Without that, iOS cannot load the font glyphs and icons appear as empty/unknown characters.

Files changed / created (examples from the work)
-----------------------------------------------
- `ios/chatshare/Fonts/*.ttf` — font files copied from `react-native-vector-icons`.
- `ios/chatshare/Info.plist` — updated with a `UIAppFonts` array listing the TTF filenames.
- `ios/` — native iOS directory added to the project (created from temp RN project).

Troubleshooting
---------------
- If icons still show blanks after making these changes:
  - Clean Xcode build folder (Xcode → Product → Clean Build Folder).
  - Fully quit the app in the simulator and reinstall via `npx react-native run-ios`.
  - Restart Metro with `--reset-cache`.
  - Ensure the font filenames in `UIAppFonts` exactly match the TTF filenames in the app bundle.

Notes & alternatives
--------------------
- Some projects rely on the `react-native-vector-icons` Pod to bundle fonts automatically; copying them into the app bundle is a direct, explicit approach that works reliably.
- If you prefer Pod-managed fonts, verify the Podspec for `react-native-vector-icons` and that the fonts are included in the generated Pod resources; then `pod install` should do the bundling automatically.

Commit considerations
---------------------
- The `ios/` folder and font TTFs are significant binary additions. Consider whether you want to commit them to the repository (I can commit them if you want). If you prefer to keep binaries out, document the steps in README so other devs can generate/copy fonts locally.

If you'd like I can:
- Commit the copied fonts and `ios/` changes now, or
- Revert the manual copy and configure Pod-managed font bundling instead.
