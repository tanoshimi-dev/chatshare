# Google Sign-In Setup Guide (Direct OAuth - No Firebase)

This app uses direct Google OAuth authentication without Firebase. The implementation uses `@react-native-google-signin/google-signin` library.

## Current Configuration

**Web Client ID**: `684998272240-blbifvj5l31r56e04gificvlk70h31ek.apps.googleusercontent.com` (ChatShare Backend)
**Android Client ID**: `684998272240-57hb1lmt95rifslmgui1bqiupp4astqg.apps.googleusercontent.com` (ChatShare Android - DO NOT use in code!)
**Project ID**: `chatshare-482423`

## ⚠️ Important: Web Client ID vs Android Client ID

**In React Native, you MUST use the Web Client ID**, not the Android client ID!

Here's why:

- **Web Client ID** (in code): Used to get `serverAuthCode` that's sent to your backend
- **Android OAuth Client** (in Google Cloud): Required for Android app to authenticate via Google Play Services
- The Android client is matched via SHA-1 + package name (happens automatically)
- Without BOTH configured, sign-in will fail with `DEVELOPER_ERROR`

**You need to create BOTH**:

1. ✅ **Web application** OAuth client → Use this ID in `webClientId` config
2. ✅ **Android** OAuth client → Configure with SHA-1, but don't use the ID in code

## Prerequisites

1. Google Cloud Console project already created (`chatshare-482423`)
2. OAuth 2.0 credentials configured
3. Backend API running at `http://192.168.0.241:8080/api/v1`

## Android Setup

### 1. Get SHA-1 Certificate Fingerprint

For **debug builds**, run:

```bash
cd android
./gradlew signingReport
```

Look for the **SHA-1** fingerprint in the output under `Variant: debug`. It will look like:

```
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

For **release builds**, you'll need the SHA-1 from your release keystore.

### 2. Add SHA-1 to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `chatshare-482423`
3. Navigate to **APIs & Services > Credentials**
4. Find your OAuth 2.0 Client ID
5. Under **Android app**, add:
   - **Package name**: `app.dev.chatshare`
   - **SHA-1 certificate fingerprint**: (paste the SHA-1 from step 1)
6. Click **Save**

### 3. Create/Verify TWO OAuth Clients

You need **TWO** OAuth 2.0 clients in Google Cloud Console:

#### A. Web Application Client (for backend communication)

1. Go to **Credentials > Create Credentials > OAuth Client ID**
2. Select **Web application**
3. Name: **ChatShare Web**
4. Add your backend URL to **Authorized redirect URIs** (if needed)
5. Save and copy the **Client ID** (this is your `webClientId`)

#### B. Android Client (for Google Play Services)

1. Go to **Credentials > Create Credentials > OAuth Client ID**
2. Select **Android**
3. Enter:
   - **Name**: ChatShare Android
   - **Package name**: `app.dev.chatshare`
   - **SHA-1 certificate fingerprint**: (from step 1)
4. Click **Create**
5. **Note**: You don't need to copy this Client ID - it's used automatically via SHA-1 matching

### 4. Verify Configuration Files

The configuration is already set in these files:

**authService.ts**:

```typescript
webClientId: '684998272240-57hb1lmt95rifslmgui1bqiupp4astqg.apps.googleusercontent.com';
```

**strings.xml**:

```xml
<string name="server_client_id">684998272240-57hb1lmt95rifslmgui1bqiupp4astqg.apps.googleusercontent.com</string>
```

## iOS Setup

### 1. Get iOS OAuth Client ID

1. Go to Google Cloud Console > **Credentials**
2. Create a new **OAuth Client ID** for iOS:
   - **Application type**: iOS
   - **Name**: ChatShare iOS
   - **Bundle ID**: `app.dev.chatshare` (or your iOS bundle ID)
3. Note the **iOS Client ID** generated

### 2. Update iOS Configuration

Add to your `Info.plist`:

```xml
<key>GIDClientID</key>
<string>YOUR_IOS_CLIENT_ID.apps.googleusercontent.com</string>
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID_REVERSED</string>
    </array>
  </dict>
</array>
```

## Backend Setup

Your backend API should handle these endpoints:

### 1. GET `/api/v1/auth/google/redirect`

Returns:

```json
{
  "success": true,
  "data": {
    "state": "random-state-token",
    "redirectUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

### 2. POST `/api/v1/auth/google/callback`

Accepts:

```json
{
  "code": "server-auth-code",
  "state": "state-token"
}
```

Returns:

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": "https://...",
      "provider": "google",
      "role": "user",
      "status": "active",
      "email_verified": true,
      "created_at": "2025-12-27T...",
      "updated_at": "2025-12-27T..."
    }
  }
}
```

### 3. GET `/api/v1/auth/me`

Headers: `Authorization: Bearer {token}`

Returns current user info.

### 4. POST `/api/v1/auth/logout`

Headers: `Authorization: Bearer {token}`

Invalidates the session.

## Testing

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Run on Android

```bash
npm run android
# or
yarn android
```

### 3. Test Sign-In Flow

1. Tap "Sign in with Google"
2. Select your Google account
3. Grant permissions
4. You should be redirected back to the app and logged in

## Troubleshooting

### "Sign in failed" Error

- Verify SHA-1 is correctly added to Google Cloud Console
- Check that package name matches: `app.dev.chatshare`
- Ensure Google Sign-In is enabled in Google Cloud Console
- Check backend API is running and accessible

### "DEVELOPER_ERROR"

- SHA-1 fingerprint not configured correctly
- Wrong package name in Google Cloud Console
- Web Client ID is incorrect

### "NETWORK_ERROR"

- Backend API not accessible
- Check API_BASE_URL in `authService.ts`
- Ensure your device/emulator can reach the backend

### "Play Services not available"

- Emulator doesn't have Google Play Services
- Use a device or emulator with Google Play

## Authentication Flow

```
1. App calls configureGoogleSignIn() on mount
2. User taps "Sign in with Google"
3. App requests redirect URL + state from backend
4. App stores state in AsyncStorage
5. App calls GoogleSignin.signIn()
6. User authenticates with Google
7. App receives serverAuthCode
8. App sends code + state to backend /callback endpoint
9. Backend validates with Google, creates/updates user, returns JWT
10. App stores JWT + user data in AsyncStorage
11. User is authenticated
```

## Security Notes

- **Web Client ID** is safe to include in the app (public)
- **Client Secret** should NEVER be in the app - only on backend
- State token prevents CSRF attacks
- JWT tokens are stored securely in AsyncStorage
- Always use HTTPS in production for backend API

## Production Checklist

- [ ] Replace debug SHA-1 with release SHA-1 in Google Cloud Console
- [ ] Update API_BASE_URL to production backend
- [ ] Configure release signing in `android/app/build.gradle`
- [ ] Test with release build before publishing
- [ ] Enable Google Sign-In API in production project
- [ ] Set up proper OAuth consent screen
- [ ] Configure authorized redirect URIs for backend
