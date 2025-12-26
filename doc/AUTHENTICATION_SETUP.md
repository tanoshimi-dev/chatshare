# Google OAuth Authentication Setup with Firebase Admin

This document provides step-by-step instructions for setting up Google OAuth authentication with Firebase Admin SDK integration for the ChatShare application.

## Architecture Overview

The authentication flow follows this sequence:

```
User → Frontend → Backend → OAuth Provider
                ↓
           State Validation
                ↓
         User Creation/Update
                ↓
    Database + Firebase Admin
                ↓
        JWT Token + Cookie
```

## Prerequisites

- Google Cloud Console account
- Firebase Console account
- PostgreSQL database
- Redis server
- React Native development environment

---

## Part 1: Google Cloud Console Setup

### 1.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure the OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - App name: ChatShare
   - User support email: your email
   - Developer contact: your email
   - Add scopes: `userinfo.email`, `userinfo.profile`

### 1.2 Create OAuth Client IDs

You need **TWO** OAuth client IDs:

#### Web Client ID (for backend):
1. Application type: **Web application**
2. Name: ChatShare Backend
3. Authorized redirect URIs:
   ```
   http://localhost:8080/api/v1/auth/google/callback
   https://yourdomain.com/api/v1/auth/google/callback
   ```
4. Save and copy the **Client ID** and **Client Secret**

#### Android/iOS Client ID (for mobile app):
1. Application type: **Android** or **iOS**
2. For Android:
   - Package name: `com.chatshare` (or your package name)
   - SHA-1 certificate fingerprint (get from your development keystore)
3. For iOS:
   - Bundle ID: `com.chatshare` (or your bundle ID)
4. Save and copy the **Client ID**

---

## Part 2: Firebase Console Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Use the same Google Cloud project you created earlier
4. Enable Google Analytics (optional)

### 2.2 Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Enable **Google** sign-in provider
4. Use the Web Client ID from Google Cloud Console

### 2.3 Download Service Account Key

1. Go to **Project Settings** (gear icon)
2. Navigate to **Service accounts** tab
3. Click **Generate new private key**
4. Download the JSON file
5. Save it as `firebase-adminsdk.json` in your backend directory
6. **IMPORTANT**: Add this file to `.gitignore` to keep it secure

---

## Part 3: Backend Setup

### 3.1 Install Dependencies

```bash
cd sys/backend/app
go mod download
```

The following packages are already included:
- `firebase.google.com/go/v4` - Firebase Admin SDK
- `google.golang.org/api` - Google API client
- `golang.org/x/oauth2` - OAuth2 client
- `github.com/redis/go-redis/v9` - Redis client

### 3.2 Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your credentials:
   ```env
   # Google OAuth (Web Client ID from Google Cloud Console)
   GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_WEB_CLIENT_SECRET
   GOOGLE_REDIRECT_URL=http://localhost:8080/api/v1/auth/google/callback

   # Firebase Admin SDK
   FIREBASE_CREDENTIALS_PATH=./firebase-adminsdk.json

   # JWT Secret (generate a strong random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Other configurations...
   ```

### 3.3 Start Required Services

**PostgreSQL:**
```bash
# Using Docker
docker run -d \
  --name chatshare-postgres \
  -e POSTGRES_USER=chatshare \
  -e POSTGRES_PASSWORD=chatshare_password \
  -e POSTGRES_DB=chatshare_db \
  -p 5432:5432 \
  postgres:15
```

**Redis:**
```bash
# Using Docker
docker run -d \
  --name chatshare-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 3.4 Run Database Migrations

The application will automatically run migrations on startup. Verify by checking the logs.

### 3.5 Start Backend Server

```bash
go run main.go
```

The server should start on `http://localhost:8080`

---

## Part 4: React Native Frontend Setup

### 4.1 Install Dependencies

```bash
cd sys/frontend/user/mobile/chatshare
npm install
```

New packages added:
- `@react-native-google-signin/google-signin` - Google Sign-In for React Native
- `@react-native-async-storage/async-storage` - Persistent storage
- `@react-native-community/netinfo` - Network status

### 4.2 Configure Google Sign-In

#### For Android:

1. **Update `android/app/build.gradle`:**
   ```gradle
   dependencies {
       // Add this line
       implementation 'com.google.android.gms:play-services-auth:20.7.0'
   }
   ```

2. **Get SHA-1 fingerprint:**
   ```bash
   cd android
   ./gradlew signingReport
   ```
   Copy the SHA-1 fingerprint and add it to your Android OAuth client in Google Cloud Console.

3. **No additional configuration needed** - the library handles everything else.

#### For iOS:

1. **Install pods:**
   ```bash
   cd ios
   pod install
   ```

2. **Update `ios/Info.plist`:**
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleTypeRole</key>
       <string>Editor</string>
       <key>CFBundleURLSchemes</key>
       <array>
         <!-- Reversed client ID from GoogleService-Info.plist -->
         <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
       </array>
     </dict>
   </array>
   ```

### 4.3 Configure Auth Service

Update `src/services/authService.ts`:

```typescript
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Google Cloud Console
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};
```

**IMPORTANT:** Use the **Web Client ID** (not Android/iOS Client ID) for the `webClientId` parameter.

### 4.4 Update API Base URL

In `src/services/authService.ts` and `src/services/api.ts`, update the API URL:

```typescript
// For physical device on same network
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8080/api/v1';

// For Android emulator
// const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';

// For iOS simulator  
// const API_BASE_URL = 'http://localhost:8080/api/v1';
```

### 4.5 Integrate AuthContext

Update `App.tsx`:

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
```

### 4.6 Update Navigation

Update your `RootNavigator` to include the LoginScreen and check authentication:

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
```

### 4.7 Run the App

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

---

## Part 5: Testing the Authentication Flow

### 5.1 Backend API Endpoints

Test the endpoints using curl or Postman:

**1. Get OAuth redirect URL:**
```bash
curl http://localhost:8080/api/v1/auth/google/redirect
```

Response:
```json
{
  "success": true,
  "data": {
    "redirect_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "randomStateToken123"
  }
}
```

**2. Exchange code for token:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/google/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code_from_google",
    "state": "randomStateToken123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://...",
      "provider": "google"
    }
  }
}
```

### 5.2 Mobile App Testing

1. Launch the app
2. You should see the LoginScreen
3. Tap "Sign in with Google"
4. Complete the Google sign-in flow
5. You should be redirected to the home screen
6. User data should be stored in AsyncStorage

### 5.3 Verify Firebase Integration

1. Go to Firebase Console → Authentication
2. Check the **Users** tab
3. You should see the user created with:
   - UID: `google_<user_uuid>`
   - Email: user's email
   - Display name: user's name
   - Photo URL: user's avatar

---

## Part 6: Security Best Practices

### 6.1 Production Checklist

- [ ] Use HTTPS in production (set `secure: true` for cookies)
- [ ] Update CORS settings to only allow your frontend domain
- [ ] Use strong JWT secret (minimum 256 bits)
- [ ] Set proper JWT expiration (24h recommended)
- [ ] Enable Firebase security rules
- [ ] Never commit `.env` or `firebase-adminsdk.json` to git
- [ ] Use environment variables in production (not .env files)
- [ ] Enable rate limiting (already configured)
- [ ] Set up proper logging and monitoring
- [ ] Use DATABASE_URL with connection pooling in production

### 6.2 State Token Security

The implementation includes:
- ✅ Cryptographically secure random state generation
- ✅ State stored in Redis with 10-minute expiration
- ✅ One-time use (state deleted after validation)
- ✅ State validation on callback

### 6.3 Cookie Security

Cookies are configured with:
- ✅ HttpOnly flag (prevents XSS)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite=Lax (CSRF protection)
- ✅ 7-day expiration

---

## Part 7: Troubleshooting

### Common Issues

**1. "Failed to get redirect URL"**
- Check if backend is running
- Verify API_BASE_URL in authService.ts
- Check network connectivity

**2. "Invalid or expired state token"**
- Redis might not be running
- State token expired (10 min limit)
- State was already used

**3. "Failed to authenticate with backend"**
- Check Google OAuth credentials
- Verify redirect URL matches exactly
- Check backend logs for detailed error

**4. "Play Services not available" (Android)**
- Install Google Play Services on emulator
- Use physical device with Google Play Services

**5. Firebase user not created**
- Check firebase-adminsdk.json path
- Verify Firebase credentials are valid
- Check backend logs for Firebase errors
- App will still work without Firebase (it's optional)

**6. CORS errors**
- Update FRONTEND_URL in backend .env
- Check CORS middleware configuration

---

## Part 8: API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/google/redirect` | Get OAuth redirect URL with state |
| POST | `/api/v1/auth/google/callback` | Exchange code for JWT token |
| GET | `/api/v1/auth/me` | Get current authenticated user |
| POST | `/api/v1/auth/logout` | Logout and clear session |

### Request/Response Examples

See Part 5.1 for detailed examples.

---

## Part 9: Database Schema

The User model includes:

```go
type User struct {
    ID            uuid.UUID  // Primary key
    Email         string     // User email
    EmailVerified bool       // Email verification status
    Name          string     // Display name
    Avatar        string     // Profile picture URL
    Provider      string     // "google" or "line"
    ProviderID    string     // OAuth provider user ID
    Role          string     // "user" or "admin"
    Status        string     // "active", "suspended", "deleted"
    LastLoginAt   *time.Time // Last login timestamp
    CreatedAt     time.Time  // Account creation
    UpdatedAt     time.Time  // Last update
}
```

---

## Part 10: Next Steps

1. **Implement LINE OAuth** (already scaffolded in the code)
2. **Add email/password authentication** (optional)
3. **Implement refresh tokens** for longer sessions
4. **Add two-factor authentication** for enhanced security
5. **Set up Firebase Cloud Messaging** for push notifications
6. **Implement user profile management**
7. **Add social features** (following, favorites, etc.)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `tail -f backend.log`
3. Check React Native logs: `npx react-native log-android` or `log-ios`
4. Review Firebase Console logs

---

## License

This authentication implementation is part of the ChatShare project.

---

**Last Updated:** December 2024
