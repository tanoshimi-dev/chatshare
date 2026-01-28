# Apple Sign In Implementation Guide

This guide provides step-by-step instructions for implementing Apple Sign In in your React Native app with Go backend.

## Overview

Apple Sign In integration requires:
1. **iOS Native Configuration**: Enable Sign In with Apple capability in Xcode
2. **React Native Package**: Install and configure `@invertase/react-native-apple-authentication`
3. **Frontend Code**: Add Apple Sign In button and logic to LoginScreen
4. **Backend API**: Add Apple authentication endpoint in Go/Gin
5. **Database**: Store Apple provider users in existing User model

## Prerequisites

- Apple Developer Account (required for Sign In with Apple)
- Xcode 13+ 
- React Native 0.60+
- iOS 13+ (Apple Sign In is only available on iOS 13+)

---

## Part 1: iOS Native Configuration

### 1.1 Enable Sign In with Apple in Xcode

1. Open Xcode project:
   ```bash
   cd /Volumes/SSD-PSTU3A/work/dev/chatshare/sys/frontend/user/mobile/chatshare/ios
   open chatshare.xcworkspace
   ```

2. In Xcode:
   - Select your project in the navigator
   - Select your target (chatshare)
   - Go to "Signing & Capabilities" tab
   - Click "+ Capability"
   - Add "Sign In with Apple"

### 1.2 Configure Apple Developer Portal

1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Select your App ID (bundle identifier)
4. Enable "Sign In with Apple" capability
5. Save and download the updated provisioning profile

---

## Part 2: Install React Native Package

### 2.1 Install Apple Authentication Package

```bash
cd /Volumes/SSD-PSTU3A/work/dev/chatshare/sys/frontend/user/mobile/chatshare
npm install @invertase/react-native-apple-authentication
```

### 2.2 iOS Pod Installation

```bash
cd ios
pod install
cd ..
```

### 2.3 Update package.json

The package should be added automatically, but verify:

```json
{
  "dependencies": {
    "@invertase/react-native-apple-authentication": "^2.3.0"
  }
}
```

---

## Part 3: Frontend Implementation

### 3.1 Update authService.ts

Add Apple Sign In functions to handle authentication flow.

### 3.2 Update LoginScreen.tsx

Add Apple Sign In button with proper iOS version checking.

### 3.3 Update AuthContext.tsx

Add support for Apple authentication in the context.

---

## Part 4: Backend Implementation

### 4.1 Update config.go

Add Apple Sign In configuration:

```go
type Config struct {
    // ... existing fields ...
    AppleTeamID      string
    AppleClientID    string // Your app's bundle ID
    AppleKeyID       string
    ApplePrivateKey  string // Path to .p8 key file or key content
}
```

### 4.2 Add Apple Authentication Handler

Create new handler in `auth.go`:

```go
// POST /api/v1/auth/apple/callback
func (h *AuthHandler) AppleCallback(c *gin.Context) {
    // Handle Apple ID token verification
    // Create or update user
    // Return JWT token
}
```

### 4.3 Update router.go

Add Apple authentication routes:

```go
auth := v1.Group("/auth")
{
    // ... existing routes ...
    auth.POST("/apple/callback", authHandler.AppleCallback)
}
```

### 4.4 Update Database Models

The existing User model already supports multiple providers through the `provider` field, so no schema changes are needed.

---

## Part 5: Environment Configuration

### 5.1 Frontend .env

Update `.env` file:

```bash
# Apple Sign In (iOS only)
APPLE_CLIENT_ID=com.yourcompany.chatshare
```

### 5.2 Backend .env

Update backend `.env` file:

```bash
# Apple Sign In Configuration
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_CLIENT_ID=com.yourcompany.chatshare
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_KEYID.p8
```

---

## Part 6: Testing

### 6.1 Test on iOS Device/Simulator

1. Build and run on iOS:
   ```bash
   npx react-native run-ios --simulator "iPhone 17"
   ```

2. Test Apple Sign In flow:
   - Click "Sign in with Apple" button
   - Authenticate with Apple ID
   - Verify user data is returned
   - Verify backend creates/updates user
   - Verify JWT token is stored

### 6.2 Test Points

- ✅ Apple Sign In button only appears on iOS 13+
- ✅ Button styling matches Apple guidelines
- ✅ Authentication flow completes successfully
- ✅ User data is properly extracted from ID token
- ✅ Backend creates new user or updates existing user
- ✅ JWT token is generated and stored
- ✅ Navigation proceeds to main app after login

---

## Security Considerations

1. **ID Token Validation**: Always verify the Apple ID token on the backend
2. **User Privacy**: Respect Apple's user privacy requirements
3. **Email Relay**: Handle Apple's private email relay feature
4. **Token Expiration**: Implement proper token refresh logic
5. **HTTPS Only**: Apple Sign In requires HTTPS in production

---

## Apple Sign In Flow Diagram

```
┌─────────┐          ┌──────────┐          ┌─────────┐          ┌──────────┐
│  User   │          │   iOS    │          │ Backend │          │ Database │
└────┬────┘          └────┬─────┘          └────┬────┘          └────┬─────┘
     │                    │                     │                     │
     │ Tap "Sign in with Apple"                │                     │
     ├───────────────────>│                     │                     │
     │                    │                     │                     │
     │   Show Apple Auth  │                     │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
     │  User Authenticates│                     │                     │
     ├───────────────────>│                     │                     │
     │                    │                     │                     │
     │   Return ID Token  │                     │                     │
     │<───────────────────┤                     │                     │
     │                    │                     │                     │
     │   POST /auth/apple/callback              │                     │
     │   { identityToken, user }                │                     │
     ├─────────────────────────────────────────>│                     │
     │                    │                     │                     │
     │                    │    Verify ID Token  │                     │
     │                    │    (Apple Public Key)                     │
     │                    │                     │                     │
     │                    │    Find/Create User │                     │
     │                    │                     ├────────────────────>│
     │                    │                     │<────────────────────┤
     │                    │                     │                     │
     │                    │    Generate JWT     │                     │
     │                    │                     │                     │
     │   { token, user }  │                     │                     │
     │<─────────────────────────────────────────┤                     │
     │                    │                     │                     │
     │   Store Token & Navigate to Main App    │                     │
     │                    │                     │                     │
```

---

## Troubleshooting

### Issue: "Sign in with Apple" button doesn't appear

**Solution**: Ensure iOS version is 13+ and capability is enabled in Xcode

### Issue: Authentication fails with "invalid_client"

**Solution**: Verify bundle ID matches Apple Developer configuration

### Issue: Email is null in response

**Solution**: Apple only provides email on first sign in. Store it properly.

### Issue: Backend token verification fails

**Solution**: Ensure you're using Apple's public keys for verification

---

## References

- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [@invertase/react-native-apple-authentication](https://github.com/invertase/react-native-apple-authentication)
- [Apple ID Token Verification](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user)
