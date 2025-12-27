# Google Sign-In DEVELOPER_ERROR Fix

## Problem

Android app showed error when attempting Google Sign-In:

```
Sign In Failed
DEVELOPER_ERROR: Follow troubleshooting instructions at
https://react-native-google-signin.github.io/docs/troubleshooting
```

## Root Cause

**SHA-1 fingerprint mismatch** between:

- The SHA-1 configured in Google Cloud Console (Android OAuth client)
- The actual SHA-1 from the debug keystore used to build the app

## Solution

### Step 1: Get Actual SHA-1 Fingerprint

Run this command from the `android` directory:

```bash
./gradlew signingReport
```

Look for the SHA-1 under `Variant: debug`:

```
SHA1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **ChatShare** (`chatshare-482423`)
3. Navigate to **APIs & Services > Credentials**
4. Find **ChatShare Android** OAuth client (Android type)
5. Update the **SHA-1 certificate fingerprint** to match the one from Step 1:
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```
6. Verify **Package name** is: `app.dev.chatshare`
7. Click **Save**

### Step 3: Fix Redirect URI Issue (Web Client)

**Problem**: Google OAuth doesn't allow private IP addresses (like `192.168.0.241`) in redirect URIs.

**Solution**: Use `localhost` for local development

1. Go to **ChatShare Backend** OAuth client (Web application type)
2. Under **Authorized redirect URIs**, keep only:
   ```
   http://localhost:8080/api/v1/auth/google/call
   ```
3. Remove any URLs with IP addresses like `http://192.168.0.241:8080/...`
4. Click **Save**

### Step 4: Wait and Rebuild

1. Wait **5-10 minutes** for Google to propagate changes
2. Clean and rebuild:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

## Key Points

### Two OAuth Clients Required

1. **Android OAuth Client**

   - Type: Android
   - Name: ChatShare Android
   - Client ID: `684998272240-57hb1lmt95rifslmgui1bqiupp4astqg.apps.googleusercontent.com`
   - Package: `app.dev.chatshare`
   - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - **Not used in code** - matched automatically via SHA-1

2. **Web OAuth Client**
   - Type: Web application
   - Name: ChatShare Backend
   - Client ID: `684998272240-blbifvj5l31r56e04gificvlk70h31ek.apps.googleusercontent.com`
   - **Used in code** as `webClientId` in authService.ts
   - Authorized redirect URIs must use localhost or public domains

### Why This Matters

- React Native Google Sign-In uses the **Web Client ID** in code to get `serverAuthCode`
- The **Android Client** is matched automatically via SHA-1 + package name
- If SHA-1 doesn't match → `DEVELOPER_ERROR`
- If both clients aren't properly configured → Sign-in fails

## Prevention

Before deploying to production:

1. Generate a release keystore
2. Get SHA-1 from release keystore: `keytool -keystore path-to-release.keystore -list -v`
3. Add release SHA-1 to the Android OAuth client in Google Cloud Console
4. Use proper public domain for redirect URIs (not localhost)

## Date Fixed

December 27, 2025
