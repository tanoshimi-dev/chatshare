# LINE Login Custom URL Scheme Implementation

## Changes Made

This document outlines the changes made to implement custom URL scheme (`chatshare://`) handling for LINE Login callback instead of using HTTPS URLs.

### 1. Mobile App Configuration

#### iOS Configuration
- **File**: `ios/chatshare/Info.plist`
- **Changes**: Added `chatshare` URL scheme to `CFBundleURLTypes`
- **Purpose**: Allows iOS to open the app when `chatshare://` URLs are accessed

#### Android Configuration
- **File**: `android/app/src/main/AndroidManifest.xml`
- **Changes**: Added intent filter for `chatshare` scheme in MainActivity
- **Purpose**: Allows Android to open the app when `chatshare://` URLs are accessed

### 2. Frontend (React Native) Changes

#### LoginScreen.tsx
- **Deep Link Handling**: Added `useEffect` hook to listen for `chatshare://auth/line/callback` deep links
- **System Browser**: Changed LINE login to open system browser instead of WebView
- **Backward Compatibility**: Maintained existing WebView callback handling for transition period

#### Key Changes:
1. **Deep Link Listener**: Uses `Linking.addEventListener()` to handle incoming deep links
2. **Initial URL Check**: Handles app launch from deep link using `Linking.getInitialURL()`
3. **Browser Opening**: Uses `Linking.openURL()` to open LINE OAuth in system browser
4. **Error Handling**: Properly handles LINE OAuth errors and user cancellation

### 3. Backend Configuration

#### Environment Variables
- **File**: `sys/backend/.env`
- **Changes**: 
  - `LINE_REDIRECT_URL=chatshare://auth/line/callback`
  - `LINE_CALLBACK_URL=chatshare://auth/line/callback`

#### Example Configuration
- **File**: `sys/backend/app/.env.example`
- **Changes**: Updated example to show custom URL scheme

#### Docker Configuration
- **File**: `sys/backend/docker-compose.dev.yml`
- **Changes**: Updated default LINE_REDIRECT_URL to use custom scheme

## LINE Developer Console Configuration

**IMPORTANT**: You must update the LINE Developer Console to allow the new callback URL:

1. Go to [LINE Developer Console](https://developers.line.biz/console/)
2. Select your channel
3. Go to "LINE Login" tab
4. Add `chatshare://auth/line/callback` to "Callback URL" list
5. Save changes

## Flow Comparison

### Before (HTTPS Callback)
1. User taps LINE login button
2. App opens WebView with LINE OAuth URL
3. User logs in on LINE
4. LINE redirects to `https://yourdomain.com/api/v1/auth/line/callback?code=xxx`
5. WebView intercepts the callback URL
6. App extracts code from URL and sends to backend

### After (Custom URL Scheme)
1. User taps LINE login button
2. App opens system browser with LINE OAuth URL  
3. User logs in on LINE
4. LINE redirects to `chatshare://auth/line/callback?code=xxx`
5. System opens app via deep link
6. App extracts code from deep link and sends to backend

## Benefits

1. **Better User Experience**: No need for WebView, uses native browser
2. **Security**: System browser is more secure than embedded WebView
3. **Reliability**: Less prone to WebView-related issues
4. **Standard Practice**: Follows OAuth best practices for mobile apps

## Testing

### Debug Deep Links

You can test deep links using ADB (Android) or Simulator (iOS):

#### Android
```bash
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "chatshare://auth/line/callback?code=test123&state=test456" \
  com.yourpackage.chatshare
```

#### iOS Simulator
```bash
xcrun simctl openurl booted "chatshare://auth/line/callback?code=test123&state=test456"
```

## Rollback Plan

If issues arise, you can quickly rollback by:

1. Reverting the environment variables to HTTPS URLs
2. Uncommenting the WebView navigation code in `handleLineSignIn`
3. Commenting out the deep link handling code

The app maintains backward compatibility during the transition period.

## Next Steps

1. **Update LINE Developer Console** with new callback URL
2. **Test on physical devices** to ensure deep linking works correctly
3. **Monitor error logs** for any callback handling issues
4. **Remove WebView code** after confirming deep links work reliably
5. **Update documentation** for other developers

## Troubleshooting

### Common Issues

1. **Deep link not working**: Check URL scheme configuration in manifest files
2. **App not opening**: Ensure LINE Developer Console has correct callback URL
3. **State validation errors**: Verify state token is properly stored and retrieved
4. **Authorization code issues**: Check that code extraction from URL is working correctly

### Debug Logs

Enable debug logging to monitor:
- Deep link URL reception
- Code extraction process
- Backend API calls
- Error conditions