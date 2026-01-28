# Apple Sign In - Quick Start Guide

## ✅ What's Already Done

The code implementation is complete. Here's what has been added:

### Frontend (React Native)
- ✅ Installed `@invertase/react-native-apple-authentication` package
- ✅ Added Apple Sign In functionality to `authService.ts`
- ✅ Added `loginWithApple()` to `AuthContext`
- ✅ Added Apple Sign In button to `LoginScreen` (shows only on iOS 13+)
- ✅ iOS pod installation completed

### Backend (Go/Gin)
- ✅ Added Apple config to `config.go`
- ✅ Added `AppleCallback` handler in `auth.go`
- ✅ Added `/api/v1/auth/apple/callback` route
- ✅ Token verification logic implemented

## 📋 What You Need to Do

### Step 1: Enable Sign In with Apple in Xcode (Required)

1. Open your iOS project:
   ```bash
   cd /Volumes/SSD-PSTU3A/work/dev/chatshare/sys/frontend/user/mobile/chatshare/ios
   open chatshare.xcworkspace
   ```

2. In Xcode:
   - Select your project in the navigator (chatshare)
   - Select your target (chatshare)
   - Go to "Signing & Capabilities" tab
   - Click "+ Capability" button
   - Search for and add **"Sign In with Apple"**

3. Build the project to ensure capability is registered

### Step 2: Configure Apple Developer Portal (Required)

1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Select "Identifiers" → Select your App ID
4. In the capabilities list, enable "Sign In with Apple"
5. Click "Save"
6. Download the updated provisioning profile if needed

### Step 3: Environment Configuration (Optional for Development)

**Frontend .env** (already configured):
```bash
# No additional config needed for Apple Sign In
# Bundle ID is automatically used
```

**Backend .env** (Optional - for production token verification):
```bash
# Apple Sign In Configuration (Optional)
# These are only needed for full token verification in production
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_CLIENT_ID=com.yourcompany.chatshare
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY=/path/to/AuthKey_KEYID.p8
```

**Note**: The backend currently works without these values. Token verification is simplified for development. For production, you should implement full JWT signature verification using Apple's public keys.

### Step 4: Test on iOS Device or Simulator

1. Make sure backend is running:
   ```bash
   cd /Volumes/SSD-PSTU3A/work/dev/chatshare/sys/backend
   docker compose -f docker-compose.dev.yml up
   ```

2. Build and run iOS app:
   ```bash
   cd /Volumes/SSD-PSTU3A/work/dev/chatshare/sys/frontend/user/mobile/chatshare
   npx react-native run-ios --simulator "iPhone 17"
   ```

3. On the login screen:
   - You should see "Sign in with Apple" button (black button)
   - Button only appears on iOS 13+ devices
   - Click the button to test

### Step 5: Testing Checklist

- [ ] Apple Sign In button appears on iOS (not on Android)
- [ ] Clicking button shows Apple authentication dialog
- [ ] Can sign in with Apple ID
- [ ] User data is returned (name, email may be limited on first use)
- [ ] JWT token is generated and stored
- [ ] App navigates to main screen after login
- [ ] Can view user profile with Apple provider

## 🔧 Troubleshooting

### "Sign in with Apple" button doesn't appear
**Solution**: 
- Verify you're running on iOS 13+ device/simulator
- Check that capability was added in Xcode
- Rebuild the app after adding capability

### "Capability is not enabled" error
**Solution**:
- Go to Apple Developer Portal
- Enable "Sign In with Apple" for your App ID
- Download updated provisioning profile
- Clean and rebuild in Xcode

### Authentication fails with "Invalid token"
**Solution**:
- Check backend logs for detailed error
- Verify backend URL is accessible from iOS simulator
- For production, implement full token verification

### Email is null/missing
**Solution**: 
- This is normal behavior for Apple Sign In
- Apple only provides email on first sign in
- If user hides email, we use placeholder: `{userID}@privaterelay.appleid.com`
- Store email properly on first authentication

## 🔐 Security Notes for Production

When moving to production, enhance security by:

1. **Full Token Verification**: 
   - Fetch Apple's public keys from `https://appleid.apple.com/auth/keys`
   - Verify JWT signature using these keys
   - Check token expiration, issuer, and audience claims

2. **Backend Environment Variables**:
   - Set `APPLE_TEAM_ID` from your Apple Developer account
   - Set `APPLE_CLIENT_ID` to your app's bundle identifier
   - For server-to-server communication, generate a key:
     - Create a new key in Apple Developer Portal
     - Download the .p8 file
     - Set `APPLE_KEY_ID` and `APPLE_PRIVATE_KEY` path

3. **HTTPS Only**:
   - Apple Sign In requires HTTPS in production
   - Configure SSL certificates for your backend

## 📚 Additional Resources

- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- [Token Verification Guide](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user)

## 🎉 That's It!

Your app now supports Apple Sign In! The main requirement is enabling the capability in Xcode (Step 1). Everything else is optional for development.
