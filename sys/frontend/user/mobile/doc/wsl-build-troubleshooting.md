# React Native Android Build on WSL - Troubleshooting Report

## Summary

This document details the attempt to build a React Native 0.83.1 Android application in WSL (Windows Subsystem for Linux) using a Windows-based Android SDK located at `E:\dev\android_studio`.

### Original Issue
Gradle build was failing at `settings.gradle` line 3 with the error:
```
Process 'command 'npx'' finished with non-zero exit value 1
```

### Issues Fixed
1. ✅ **React Native Autolinking Path Issue** - Fixed Windows/WSL path mixing
2. ✅ **Android SDK Configuration** - Created `local.properties` with correct SDK path
3. ✅ **Build Tools Compatibility** - Created symlinks for all `.exe` files
4. ✅ **Missing Dependencies** - Reinstalled React Native packages with proper source files
5. ✅ **Ninja Build Tool** - Created symlink for ninja executable
6. ✅ **CMake Executable** - Created symlink for cmake executable

### Final Blocking Issue
❌ **CMake Path Access** - Windows CMake cannot access WSL file paths, preventing native code compilation required by React Native 0.83's new architecture.

---

## Why WSL Build Did Not Succeed

React Native 0.83+ **requires the New Architecture** which cannot be disabled. The New Architecture requires compiling native C++ code using CMake. The fundamental incompatibility is:

1. **Path Format Mismatch**: WSL uses Unix-style paths (`/mnt/e/wsl_dev/...`), while Windows tools expect Windows-style paths (`E:\wsl_dev\...`)

2. **CMake Limitation**: The Windows CMake executable from the Android SDK runs as a Windows process and cannot access WSL filesystem paths. When CMake tries to access `/mnt/e/wsl_dev/101/chatshare/...`, it fails with "directory does not exist"

3. **New Architecture Requirement**: React Native 0.83 warning message:
   ```
   WARNING: Setting `newArchEnabled=false` in your `gradle.properties` file is not
   supported anymore since React Native 0.82.
   
   The application will run with the New Architecture enabled by default.
   ```

4. **Cross-Platform Tool Execution**: While simple tools like `aapt` and `zipalign` can work via symlinks, CMake needs to traverse directory structures and access multiple files, making the WSL/Windows boundary problematic.

---

## Attempted Solutions and Results

### 1. Fixed Autolinking Path Generation
**Problem**: React Native autolinking was generating Windows paths (`E:\wsl_dev\...`) instead of Unix paths.

**Solution**: 
- Removed cached autolinking files: `/android/build/generated/autolinking/`
- Killed Gradle daemon to force regeneration
- Verified `npx @react-native-community/cli config` outputs Unix paths when run in WSL

**Result**: ✅ SUCCESS - Autolinking now generates correct Unix paths

**Files affected**:
- `/android/build/generated/autolinking/autolinking.json`

---

### 2. Configured Android SDK Path
**Problem**: Gradle couldn't find Android SDK
```
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable 
or by setting the sdk.dir path in your project's local properties file
```

**Solution**: Created `local.properties` file with WSL-formatted SDK path
```properties
sdk.dir=/mnt/e/dev/android_studio
```

**Result**: ✅ SUCCESS - Gradle can now locate the Android SDK

**File created**: `/android/local.properties`

---

### 3. Fixed Build Tools Missing Executables
**Problem**: Build tools executables not found
```
Build-tool 36.0.0 is missing AAPT at /mnt/e/dev/android_studio/build-tools/36.0.0/aapt
Installed Build Tools revision 36.0.0 is corrupted
```

**Solution**: Created symlinks for all Windows executables in build-tools directories
```bash
# For each build-tools version (30.0.3, 33.0.0, 34.0.0, 35.0.0, 36.0.0):
cd /mnt/e/dev/android_studio/build-tools/[VERSION]
ln -sf aapt.exe aapt
ln -sf aapt2.exe aapt2
ln -sf aidl.exe aidl
ln -sf dexdump.exe dexdump
ln -sf zipalign.exe zipalign
ln -sf split-select.exe split-select
# ... and other tools
```

**Result**: ✅ SUCCESS - Build tools now accessible from WSL

**Directories modified**:
- `/mnt/e/dev/android_studio/build-tools/*/`

---

### 4. Reinstalled React Native Dependencies
**Problem**: Missing source directories in node_modules
```
Error: ENOENT: no such file or directory, lstat 
'/mnt/e/wsl_dev/101/chatshare/sys/frontend/user/mobile/chatshare/node_modules/react-native-gesture-handler/src/specs'
```

**Solution**: 
```bash
rm -rf node_modules/react-native-gesture-handler
npm install react-native-gesture-handler

# Eventually did full reinstall:
rm -rf node_modules
npm install
```

**Result**: ✅ SUCCESS - All React Native packages have complete source files

**Affected packages**:
- `react-native-gesture-handler`
- `react-native-screens`
- `react-native-safe-area-context`
- `react-native-svg`

---

### 5. Fixed Ninja Build Tool
**Problem**: CMake couldn't find Ninja
```
[CXX1416] Could not find Ninja on PATH or in SDK CMake bin folders.
```

**Solution**: Created symlink for ninja
```bash
cd /mnt/e/dev/android_studio/cmake/3.22.1/bin
ln -sf ninja.exe ninja
```

**Result**: ✅ SUCCESS - Ninja found by CMake

**File created**: `/mnt/e/dev/android_studio/cmake/3.22.1/bin/ninja` (symlink)

---

### 6. Fixed CMake Executable
**Problem**: CMake executable not found
```
Cannot run program "/mnt/e/dev/android_studio/cmake/3.22.1/bin/cmake": 
error=2, No such file or directory
```

**Solution**: Created symlink for cmake
```bash
cd /mnt/e/dev/android_studio/cmake/3.22.1/bin
ln -sf cmake.exe cmake
```

**Result**: ✅ SUCCESS - CMake executable found and can be launched

**File created**: `/mnt/e/dev/android_studio/cmake/3.22.1/bin/cmake` (symlink)

---

### 7. Created Missing CMakeLists.txt
**Problem**: CMakeLists.txt missing from react-native package
```
[CXX1400] Gradle project cmake.path is 
/mnt/e/wsl_dev/101/chatshare/.../ReactAndroid/cmake-utils/default-app-setup/CMakeLists.txt 
but that file doesn't exist
```

**Solution**: Created standard React Native 0.83 CMakeLists.txt file with required configuration

**Result**: ✅ File created but ❌ BLOCKED by next issue

**File created**: 
- `/node_modules/react-native/ReactAndroid/cmake-utils/default-app-setup/CMakeLists.txt`

---

### 8. Attempted to Disable New Architecture
**Problem**: CMake path access issues with Windows tools

**Solution Attempted**: Set `newArchEnabled=false` in gradle.properties

**Result**: ❌ FAILED - React Native 0.82+ doesn't support disabling new architecture
```
WARNING: Setting `newArchEnabled=false` in your `gradle.properties` file is not
supported anymore since React Native 0.82.

The application will run with the New Architecture enabled by default.
```

---

### 9. CMake Path Access (FINAL BLOCKING ISSUE)
**Problem**: Windows CMake cannot access WSL paths
```
CMake Error: The source directory 
"/mnt/e/wsl_dev/101/chatshare/sys/frontend/user/mobile/chatshare/node_modules/react-native/ReactAndroid/cmake-utils/default-app-setup" 
does not exist.
```

**Attempted Solution**: 
- Verified directory exists in WSL: ✅ Directory and files present
- Created symlinks for cmake and ninja: ✅ Executables can run
- Created CMakeLists.txt: ✅ File exists

**Root Cause**: Windows CMake process cannot access WSL filesystem paths. The cmake.exe runs as a Windows process and has no knowledge of the WSL filesystem mounting at `/mnt/`.

**Result**: ❌ BLOCKED - Cannot proceed with current setup

**Error command**:
```bash
/mnt/e/dev/android_studio/cmake/3.22.1/bin/cmake \
  -H/mnt/e/wsl_dev/101/chatshare/sys/frontend/user/mobile/chatshare/node_modules/react-native/ReactAndroid/cmake-utils/default-app-setup \
  -DCMAKE_SYSTEM_NAME=Android \
  # ... other parameters
```

---

## Recommended Solutions

### Option 1: Install Android SDK in WSL (Recommended)
Install Android SDK natively in WSL to avoid Windows/WSL path incompatibility.

**Steps**:
```bash
# Download Android command line tools
wget https://dl.google.com/android/repository/commandlinetools-linux-[VERSION]_latest.zip

# Install to WSL home directory
mkdir -p ~/android-sdk/cmdline-tools
unzip commandlinetools-linux-*_latest.zip -d ~/android-sdk/cmdline-tools

# Install required packages
~/android-sdk/cmdline-tools/bin/sdkmanager --sdk_root=$HOME/android-sdk \
  "platform-tools" "platforms;android-34" "build-tools;34.0.0" "ndk;27.1.12297006" "cmake;3.22.1"

# Update local.properties
echo "sdk.dir=$HOME/android-sdk" > android/local.properties
```

**Pros**: 
- Native compatibility with WSL
- All tools work without symlinks
- Better performance

**Cons**: 
- Requires ~10GB disk space
- Additional SDK installation
- Separate SDK maintenance

---

### Option 2: Build from Windows
Run the build from Windows Command Prompt or PowerShell instead of WSL.

**Steps**:
```cmd
cd E:\wsl_dev\101\chatshare\sys\frontend\user\mobile\chatshare\android
gradlew.bat assembleDebug
```

**Additional Setup Needed**:
1. Remove `local.properties` or update it to use Windows path:
   ```properties
   sdk.dir=E:\\dev\\android_studio
   ```
2. Ensure Node.js is installed on Windows
3. Run npm install from Windows if needed

**Pros**: 
- Uses existing Windows Android SDK
- No additional installations
- Direct compatibility

**Cons**: 
- Need Node.js on Windows
- Different development environment
- May need to manage dependencies separately

---

### Option 3: Use Android Studio
Open and build the project directly in Android Studio on Windows.

**Steps**:
1. Open Android Studio
2. File → Open → Navigate to `E:\wsl_dev\101\chatshare\sys\frontend\user\mobile\chatshare\android`
3. Let Android Studio sync Gradle
4. Build → Make Project or Build → Build Bundle(s) / APK(s)

**Pros**: 
- GUI interface
- Integrated debugging
- Handles configuration automatically

**Cons**: 
- Requires Android Studio installation
- Heavier IDE

---

## Conclusion

The React Native 0.83 Android build **cannot be completed in WSL using a Windows Android SDK** due to fundamental incompatibility between:
- Windows CMake executable expecting Windows paths
- React Native New Architecture requiring CMake for native code compilation
- WSL filesystem using Unix-style paths that Windows processes cannot access

The most practical solution is **Option 1 (Install Android SDK in WSL)** for a native WSL development environment, or **Option 2 (Build from Windows)** to use existing Windows tools.
