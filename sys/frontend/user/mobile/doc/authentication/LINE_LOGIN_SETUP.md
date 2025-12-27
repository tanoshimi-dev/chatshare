# LINE Login Setup Guide (Web OAuth Implementation)

## Current Status

⚠️ **Implementation Note**: LINE login is currently using a **mock/demo mode** due to native SDK compatibility issues with React Native 0.83+ and Gradle 9.0.

The LINE button works and demonstrates the UI flow, but actual LINE authentication will be implemented using:

- **Web-based OAuth flow** (WebView or browser)
- **Backend validation** of LINE access tokens

## Quick Start (Demo Mode)

LINE login is ready to use in demo mode:

1. The **"Sign in with LINE"** button is already functional
2. Returns a mock user profile for testing
3. No LINE Developer account needed for demo

## Future Implementation (Production)

When implementing real LINE authentication:

### 1. Go to LINE Developers Console

1. Visit [LINE Developers Console](https://developers.line.biz/console/)
2. Create a new Provider (or select existing)
3. Create a new Channel
   - Select **LINE Login** as channel type
   - Fill in required information:
     - Channel name: `ChatShare`
     - Channel description: `ChatShare mobile app authentication`
     - App types: Select **Native app**

### 2. Get Channel Information

After creating the channel:

1. Go to **Basic settings** tab
2. Copy your **Channel ID** (e.g., `1234567890`)
3. Note: You don't need Channel Secret for native apps

## Step 2: Configure Android

### 1. Add Channel ID to .env

Edit `.env` file:

```bash
LINE_CHANNEL_ID=your-actual-channel-id
```

Example:

```bash
LINE_CHANNEL_ID=1234567890
```

### 2. Verify Package Name

In LINE Developers Console:

1. Go to your channel > **LINE Login** tab
2. Under **Android settings**:
   - **Package name**: `app.dev.chatshare`
   - **Package signature**: (Use SHA-256 from your keystore - see below)

### 3. Get Package Signature (SHA-256)

Run this command:

```bash
cd android
./gradlew signingReport
```

Look for **SHA-256** under `Variant: debug`:

```
SHA-256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

Copy this SHA-256 value (without spaces or colons) to LINE Console.

### 4. Set Callback URL (Optional for Web Login)

If using web-based flow:

- **Callback URL**: `https://your-domain.com/auth/line/callback`

For native app only, you can skip this.

## Step 3: Test LINE Login

### 1. Rebuild the App

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### 2. Test Sign In

1. Launch the app
2. Tap **"Sign in with LINE"** button
3. LINE app should open (or web browser if LINE app not installed)
4. Authorize the app
5. You should be redirected back with user profile

## Configuration Summary

### Files Modified

- `.env` - Added `LINE_CHANNEL_ID`
- `.env.example` - Added LINE configuration template
- `src/services/authService.ts` - Added LINE login functions
- `src/screens/LoginScreen.tsx` - Added LINE button

### Environment Variables

```bash
# .env
GOOGLE_WEB_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
LINE_CHANNEL_ID=your-line-channel-id
API_BASE_URL=http://192.168.0.241:8080/api/v1
```

## LINE vs Google Comparison

| Feature            | Google Sign-In    | LINE Login        |
| ------------------ | ----------------- | ----------------- |
| **Client ID Type** | Web Client ID     | Channel ID        |
| **Fingerprint**    | SHA-1             | SHA-256           |
| **Package Name**   | app.dev.chatshare | app.dev.chatshare |
| **Email**          | Always provided   | Optional          |
| **Photo**          | Usually provided  | Usually provided  |
| **Display Name**   | Required          | Required          |

## Backend Integration (Future)

When implementing backend validation:

### Google Flow:

```
Client -> Google Sign-In -> serverAuthCode -> Backend validates -> JWT token
```

### LINE Flow:

```
Client -> LINE Login -> accessToken -> Backend validates with LINE API -> JWT token
```

## Troubleshooting

### LINE app not opening

**Problem**: Web browser opens instead of LINE app

**Solution**:

- Install LINE app on device
- LINE SDK will automatically use native app if available

### "Channel not found" error

**Solution**:

1. Verify `LINE_CHANNEL_ID` in `.env` is correct
2. Rebuild app after changing `.env`: `./gradlew clean`

### "Invalid package signature"

**Solution**:

1. Get correct SHA-256 from `./gradlew signingReport`
2. Add to LINE Console without spaces/colons
3. Wait 5-10 minutes for changes to propagate

### Email not provided

**Note**: LINE doesn't always provide email address

- App handles this by creating fallback email: `{userID}@line.user`
- Backend should handle users without verified email

## Security Notes

✅ **Safe to commit:**

- LINE Channel ID (like Google Client ID)

❌ **NEVER commit:**

- LINE Channel Secret (if using web flow)
- Access tokens
- Refresh tokens

## Production Checklist

Before releasing to production:

- [ ] Get release keystore SHA-256
- [ ] Add release SHA-256 to LINE Console
- [ ] Update callback URLs for production domain
- [ ] Test with release build
- [ ] Implement backend token validation
- [ ] Set up proper error handling
- [ ] Add analytics for login events

## Related Documentation

- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/)
- [react-native-line-sdk](https://github.com/line/line-sdk-react-native)
- [Environment Variables Guide](./environment-variables-guide.md)
- [Google Sign-In Setup](../../chatshare/GOOGLE_SIGNIN_SETUP.md)

## Date Added

December 27, 2025
