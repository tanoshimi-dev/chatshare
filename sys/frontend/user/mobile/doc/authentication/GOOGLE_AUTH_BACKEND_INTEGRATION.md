# Google Authentication - Backend Integration Guide

This document explains the complete Google authentication flow with backend JWT token generation for both iOS and Android.

## Overview

The mobile app uses the Google Sign-In SDK to obtain a `serverAuthCode`, which is then exchanged by the backend for a real JWT token. This approach works for both iOS and Android platforms.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Mobile    │         │   Backend    │         │   Google    │
│     App     │         │    Server    │         │   OAuth     │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │ 1. GoogleSignin.      │                        │
       │    signIn()           │                        │
       ├──────────────────────────────────────────────>│
       │                       │                        │
       │ 2. Returns:           │                        │
       │    - idToken          │                        │
       │    - serverAuthCode   │                        │
       │<──────────────────────────────────────────────┤
       │                       │                        │
       │ 3. POST /auth/google/ │                        │
       │    callback           │                        │
       │    { code, state="" } │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │ 4. Exchange code       │
       │                       │    for access token    │
       │                       ├───────────────────────>│
       │                       │                        │
       │                       │ 5. Access token        │
       │                       │<───────────────────────┤
       │                       │                        │
       │                       │ 6. Get user info       │
       │                       ├───────────────────────>│
       │                       │                        │
       │                       │ 7. User profile        │
       │                       │<───────────────────────┤
       │                       │                        │
       │ 8. Returns:           │                        │
       │    - JWT token        │                        │
       │    - User object      │                        │
       │<──────────────────────┤                        │
       │                       │                        │
```

## Key Concepts

### Client IDs

Your Google Cloud project needs **THREE** OAuth 2.0 client IDs:

1. **Web Client ID** (`684998272240-blbifvj5l31r56e04gificvlk70h31ek`)
   - Type: OAuth 2.0 Web Application
   - Used in: Mobile app's `GoogleSignin.configure({ webClientId })`
   - Used in: Backend for token exchange
   - Purpose: The `serverAuthCode` is issued for this client

2. **iOS Client ID** (`684998272240-qlleg3j5n7ng8arucbt6h7a9bnse76bk`)
   - Type: OAuth 2.0 iOS Application
   - Used in: `ios/chatshare/Info.plist` as `GIDClientID`
   - Purpose: Enables Google Sign-In SDK on iOS

3. **Android Client ID** (`684998272240-57hb1lmt95rifslmgui1bqiupp4astqg`)
   - Type: OAuth 2.0 Android Application
   - Used in: Matched automatically via SHA-1 + package name
   - Purpose: Enables Google Sign-In SDK on Android

### Why Different Client IDs?

- **Platform clients (iOS/Android)**: Enable the native Google Sign-In UI
- **Web client**: Used for backend authentication and token exchange
- The `serverAuthCode` is always issued for the **Web Client**, regardless of platform

## Frontend Implementation

### 1. Configure Google Sign-In

**File**: `src/services/authService.ts`

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';

export const configureGoogleSignIn = () => {
  const webClientId = Config.GOOGLE_WEB_CLIENT_ID;
  
  if (!webClientId) {
    throw new Error('GOOGLE_WEB_CLIENT_ID is not configured');
  }
  
  GoogleSignin.configure({
    webClientId, // Web Client ID - REQUIRED for serverAuthCode
    offlineAccess: true, // Required to get serverAuthCode
    forceCodeForRefreshToken: true,
  });
};
```

### 2. Sign In and Get Server Auth Code

```typescript
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    console.log('Starting Google Sign-In...');
    
    // Sign in with Google SDK
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    // Extract serverAuthCode (might be in data property in newer versions)
    const serverAuthCode = userInfo.serverAuthCode || userInfo.data?.serverAuthCode;
    
    if (!serverAuthCode) {
      console.error('userInfo structure:', JSON.stringify(userInfo, null, 2));
      throw new Error('Failed to get server auth code from Google');
    }

    // Send auth code to backend
    const callbackResponse = await fetch(
      `${API_BASE_URL}/auth/google/callback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: serverAuthCode,
          // state: empty for mobile SDK flow
        }),
      }
    );

    if (!callbackResponse.ok) {
      const errorText = await callbackResponse.text();
      throw new Error(`Failed to authenticate with backend: ${callbackResponse.status}`);
    }

    const callbackData = await callbackResponse.json();
    
    if (!callbackData.success) {
      throw new Error(callbackData.message || 'Authentication failed');
    }

    const authResponse: AuthResponse = callbackData.data;

    // Store JWT token and user data
    await AsyncStorage.setItem('auth_token', authResponse.token);
    await AsyncStorage.setItem('user', JSON.stringify(authResponse.user));

    return authResponse;
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
};
```

### 3. Environment Configuration

**File**: `.env`

```env
# Google OAuth Configuration
# Web Client ID - used for serverAuthCode and backend authentication
GOOGLE_WEB_CLIENT_ID=684998272240-blbifvj5l31r56e04gificvlk70h31ek.apps.googleusercontent.com

# Backend API
API_BASE_URL=http://localhost:8080/api/v1
```

### 4. Platform-Specific Configuration

#### iOS: Info.plist

**File**: `ios/chatshare/Info.plist`

```xml
<key>GIDClientID</key>
<string>684998272240-qlleg3j5n7ng8arucbt6h7a9bnse76bk.apps.googleusercontent.com</string>

<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.684998272240-qlleg3j5n7ng8arucbt6h7a9bnse76bk</string>
    </array>
  </dict>
</array>
```

#### Android: SHA-1 Configuration

Add your SHA-1 certificate to the Android OAuth client in Google Cloud Console. Get it with:

```bash
cd android
./gradlew signingReport
```

## Backend Implementation

### 1. Environment Configuration

**File**: `sys/backend/.env`

```env
# OAuth Google Configuration
# Use the Web Client ID (OAuth 2.0 Web Application)
# Mobile apps configure webClientId in GoogleSignin.configure()
# The serverAuthCode is issued for the Web Client, so backend uses Web credentials
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URL=http://localhost:8080/api/v1/auth/google/callback
```

### 2. Auth Handler Implementation

**File**: `sys/backend/app/internal/handlers/auth.go`

```go
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
    // Parse request body
    var req struct {
        Code  string `json:"code" binding:"required"`
        State string `json:"state"` // Optional for mobile apps
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
        return
    }

    ctx := context.Background()

    // Validate state if provided (web flow only)
    if req.State != "" {
        valid, err := h.sessionStore.ValidateAndDeleteState(ctx, req.State)
        if err != nil {
            utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to validate state")
            return
        }
        if !valid {
            utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired state token")
            return
        }
    }

    // Exchange authorization code for token
    var token *oauth2.Token
    var err error
    
    // Mobile SDK flow (no state): use empty redirect URI
    // Web OAuth flow (with state): use configured redirect URI
    if req.State == "" {
        // Mobile SDK flow: Create config with empty redirect URI
        mobileConfig := &oauth2.Config{
            ClientID:     h.googleConfig.ClientID,
            ClientSecret: h.googleConfig.ClientSecret,
            RedirectURL:  "", // Empty for mobile SDK
            Scopes:       h.googleConfig.Scopes,
            Endpoint:     h.googleConfig.Endpoint,
        }
        token, err = mobileConfig.Exchange(ctx, req.Code)
    } else {
        // Web OAuth flow: use configured redirect URI
        token, err = h.googleConfig.Exchange(ctx, req.Code)
    }
    
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Failed to exchange token: %v", err))
        return
    }

    // Get user info from Google
    client := h.googleConfig.Client(ctx, token)
    resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
    if err != nil {
        utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get user info")
        return
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to read user info")
        return
    }

    var googleUser struct {
        ID            string `json:"id"`
        Email         string `json:"email"`
        VerifiedEmail bool   `json:"verified_email"`
        Name          string `json:"name"`
        Picture       string `json:"picture"`
    }

    if err := json.Unmarshal(body, &googleUser); err != nil {
        utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to parse user info")
        return
    }

    // Create or update user in database
    user, jwtToken, err := h.findOrCreateUser(
        ctx,
        googleUser.Email,
        googleUser.Name,
        googleUser.Picture,
        "google",
        googleUser.ID,
        googleUser.VerifiedEmail,
    )
    if err != nil {
        utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to process user")
        return
    }

    // Return JWT token and user data
    utils.SuccessResponse(c, http.StatusOK, gin.H{
        "token": jwtToken,
        "user":  user,
    })
}
```

### Key Backend Implementation Details

1. **State parameter is optional**: Mobile SDK doesn't provide state token
2. **Empty redirect URI for mobile**: When no state is provided, use empty `RedirectURL`
3. **Configured redirect URI for web**: When state is provided, use the redirect URI from config
4. **JWT token generation**: Backend creates its own JWT after validating with Google

## Security Considerations

### CSRF Protection

- **Web flow**: Uses state token for CSRF protection
- **Mobile flow**: No state token needed (SDK handles security)
- Backend validates state only when provided

### Token Security

- `serverAuthCode` is single-use only
- Backend never exposes Google access tokens to frontend
- Frontend only receives backend-issued JWT tokens
- JWT tokens include user ID, email, and role

### Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Store JWT tokens securely (AsyncStorage for mobile)
3. ✅ Set appropriate JWT expiration times
4. ✅ Validate tokens on every backend request
5. ✅ Use different Client IDs for development and production

## Troubleshooting

### Common Errors

#### 1. `invalid_grant` Error

**Cause**: Wrong redirect URI or client credentials

**Solutions**:
- ✅ Backend uses Web Client ID and Secret
- ✅ Mobile flow uses empty redirect URI (`RedirectURL: ""`)
- ✅ Web flow uses configured redirect URI

#### 2. `DEVELOPER_ERROR` on Android

**Cause**: SHA-1 not configured or package name mismatch

**Solutions**:
- Add SHA-1 to Android OAuth client in Google Cloud Console
- Verify package name matches `com.chatshare`

#### 3. `serverAuthCode` is undefined

**Cause**: `offlineAccess` not configured or wrong SDK version

**Solutions**:
- Add `offlineAccess: true` to `GoogleSignin.configure()`
- Check response structure: `userInfo.serverAuthCode` vs `userInfo.data?.serverAuthCode`

#### 4. Backend authentication fails with 400

**Cause**: Using platform client credentials instead of web client

**Solutions**:
- Backend must use **Web Client ID and Secret**
- Mobile app configures **Web Client ID** as `webClientId`
- Platform clients (iOS/Android) are used only for SDK authentication

## Testing

### 1. Test Mobile Sign-In

```typescript
// In mobile app
const handleGoogleSignIn = async () => {
  try {
    const authResponse = await signInWithGoogle();
    console.log('JWT Token:', authResponse.token);
    console.log('User:', authResponse.user);
  } catch (error) {
    console.error('Sign in failed:', error);
  }
};
```

### 2. Verify JWT Token

```bash
# Decode JWT token (base64)
echo "YOUR_JWT_TOKEN_HERE" | cut -d. -f2 | base64 -d | jq
```

### 3. Test Protected Endpoint

```typescript
// Use JWT token for API requests
const response = await fetch(`${API_BASE_URL}/chats`, {
  headers: {
    'Authorization': `Bearer ${authToken}`,
  },
});
```

## Migration from Mock Tokens

If you're migrating from mock tokens to real authentication:

1. **Clear old tokens**: Users need to log out and log in again
2. **Update API calls**: Ensure all API calls include `Authorization` header
3. **Test thoroughly**: Verify both iOS and Android platforms
4. **Update error handling**: Handle token expiration and refresh

## Summary

✅ **Frontend**: Uses Web Client ID in `GoogleSignin.configure()`  
✅ **Backend**: Uses Web Client ID + Secret for token exchange  
✅ **iOS**: Platform client in Info.plist for SDK authentication  
✅ **Android**: Platform client matched via SHA-1  
✅ **Security**: State validation for web, empty redirect for mobile  
✅ **Result**: Real JWT tokens that work with protected backend endpoints
