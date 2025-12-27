# Mobile Authentication Quick Start Guide

**Google OAuth + Firebase Admin SDK for React Native**

This is a focused, step-by-step guide to implement mobile authentication for ChatShare. Follow these steps in order.

---

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Google account
- [ ] Node.js and npm installed
- [ ] React Native development environment set up
- [ ] Android Studio (for Android) or Xcode (for iOS)
- [ ] Your mobile app package name ready (e.g., `com.chatshare`)

---

## Step 1: Google Cloud Console Setup (15 minutes)

### 1.1 Create Project and OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select existing project
   - Project name: `ChatShare`
3. Navigate to **"APIs & Services"** → **"Credentials"**
4. Click **"Configure Consent Screen"**
   - User Type: **External**
   - App name: `ChatShare`
   - User support email: your email
   - Developer contact: your email
   - Click **"Save and Continue"**
5. On Scopes page, click **"Add or Remove Scopes"**
   - Select: `userinfo.email` and `userinfo.profile`
   - Click **"Update"** → **"Save and Continue"**
6. Add test users (your email) → **"Save and Continue"**

### 1.2 Create Web OAuth Client ID

1. Go back to **"Credentials"** tab
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `ChatShare Backend`
5. Authorized redirect URIs:
   ```
   http://localhost:8080/api/v1/auth/google/callback
   ```
6. Click **"Create"**
7. **IMPORTANT**: Copy and save:
   - ✅ Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - ✅ Client Secret

### 1.3 Create Android OAuth Client ID

1. Click **"Create Credentials"** → **"OAuth client ID"** again
2. Application type: **"Android"**
3. Name: `ChatShare Android`
4. Package name: `com.chatshare` (use your actual package name)
5. For SHA-1 certificate fingerprint:
   ```bash
   # In your React Native project
   cd android
   ./gradlew signingReport
   
   # Copy the SHA1 from "Variant: debug" section
   # Example: 1A:2B:3C:4D:5E:6F:...
   ```
6. Paste the SHA-1 fingerprint
7. Click **"Create"**

### 1.4 Create iOS OAuth Client ID (if building for iOS)

1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Application type: **"iOS"**
3. Name: `ChatShare iOS`
4. Bundle ID: `com.chatshare` (use your actual bundle ID from Xcode)
5. Click **"Create"**

**Save these credentials - you'll need them later!**

---

## Step 2: Firebase Console Setup (10 minutes)

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. **IMPORTANT**: Select **"ChatShare"** (the Google Cloud project you just created)
   - This links Firebase with your Google Cloud project
4. Disable Google Analytics (optional for now)
5. Click **"Create project"**

### 2.2 Enable Google Authentication

1. In Firebase Console, click **"Authentication"** in left menu
2. Click **"Get started"**
3. Click **"Sign-in method"** tab
4. Click **"Google"**
5. Toggle **"Enable"**
6. Project support email: your email
7. Click **"Save"**

### 2.3 Download Firebase Admin SDK Key

1. Click the **gear icon** (⚙️) → **"Project settings"**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** in the dialog
5. A JSON file will download (e.g., `chatshare-xxxxx-firebase-adminsdk-xxxxx.json`)
6. **Rename it to**: `firebase-adminsdk.json`
7. **Move it to**: `/mnt/e/wsl_dev/101/chatshare/sys/backend/app/firebase-adminsdk.json`

**SECURITY**: Never commit this file to git!

---

## Step 3: Backend Setup (15 minutes)

### 3.1 Start Required Services (PostgreSQL & Redis)

```bash
# Start PostgreSQL
docker run -d \
  --name chatshare-postgres \
  -e POSTGRES_USER=chatshare \
  -e POSTGRES_PASSWORD=chatshare_password \
  -e POSTGRES_DB=chatshare_db \
  -p 5432:5432 \
  postgres:15

# Start Redis
docker run -d \
  --name chatshare-redis \
  -p 6379:6379 \
  redis:7-alpine

# Verify they're running
docker ps
```

### 3.2 Configure Backend Environment

```bash
cd /mnt/e/wsl_dev/101/chatshare/sys/backend/app

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Update these values in `.env`:

```env
# Google OAuth (use the Web Client ID and Secret from Step 1.2)
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_WEB_CLIENT_SECRET
GOOGLE_REDIRECT_URL=http://localhost:8080/api/v1/auth/google/callback

# Firebase Admin SDK
FIREBASE_CREDENTIALS_PATH=./firebase-adminsdk.json

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database
DATABASE_URL=postgres://chatshare:chatshare_password@localhost:5432/chatshare_db?sslmode=disable

# Redis
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Server
PORT=8080
FRONTEND_URL=http://localhost:3000
```

### 3.3 Install Backend Dependencies

```bash
cd /mnt/e/wsl_dev/101/chatshare/sys/backend/app
go mod download
```

### 3.4 Start Backend Server

```bash
go run main.go
```

**Expected output**:
```
✅ Connected to PostgreSQL
✅ Redis connected
✅ Firebase Admin initialized
🚀 Server running on :8080
```

**Keep this terminal open!**

---

## Step 4: Mobile App Setup (20 minutes)

### 4.1 Install Frontend Dependencies

Open a **new terminal**:

```bash
cd /mnt/e/wsl_dev/101/chatshare/sys/frontend/user/mobile/chatshare
npm install
```

### 4.2 Configure Google Sign-In

#### For Android:

1. **Get your computer's IP address** (for API calls):
   ```bash
   # Windows WSL
   ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1
   
   # Or use: hostname -I
   ```
   Save this IP (e.g., `192.168.1.100`)

2. **Update `android/app/build.gradle`**:
   ```bash
   nano android/app/build.gradle
   ```
   
   Add this to the `dependencies` section:
   ```gradle
   dependencies {
       // ... existing dependencies
       implementation 'com.google.android.gms:play-services-auth:20.7.0'
   }
   ```

#### For iOS (skip if Android-only):

1. **Install CocoaPods**:
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Update Info.plist** (if needed - check the existing implementation)

### 4.3 Configure Auth Service

Edit the auth service configuration:

```bash
nano src/services/authService.ts
```

Find and update these values:

```typescript
// Update the API_BASE_URL
// For Android emulator:
const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';

// For physical Android device (use your computer IP from step 4.2.1):
// const API_BASE_URL = 'http://192.168.1.100:8080/api/v1';

// For iOS simulator:
// const API_BASE_URL = 'http://localhost:8080/api/v1';

// Find the GoogleSignin.configure() function
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Step 1.2
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};
```

**Replace** `YOUR_WEB_CLIENT_ID` with the Web Client ID from Step 1.2.

### 4.4 Run the Mobile App

#### For Android:

```bash
# Make sure Android emulator is running or device is connected
npm run android
```

#### For iOS:

```bash
npm run ios
```

---

## Step 5: Test the Authentication Flow (5 minutes)

### 5.1 Backend Health Check

In a new terminal:

```bash
# Test redirect endpoint
curl http://localhost:8080/api/v1/auth/google/redirect
```

**Expected response**:
```json
{
  "success": true,
  "data": {
    "redirect_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "randomStateToken123"
  }
}
```

### 5.2 Mobile App Testing

1. **Launch the app** - you should see the Login screen
2. **Tap "Sign in with Google"**
3. **Select your Google account**
4. **Grant permissions** (if prompted)
5. **Success!** - You should be redirected to the home screen

### 5.3 Verify Firebase Integration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Authentication"** → **"Users"** tab
4. **Verify**: Your user appears with:
   - Email
   - Display name
   - Profile picture
   - UID starting with `google_`

---

## Step 6: Understanding the Flow

Here's what happens when you tap "Sign in with Google":

```
┌─────────────┐
│ Mobile App  │ 1. User taps "Sign in with Google"
└──────┬──────┘
       │
       │ 2. GET /api/v1/auth/google/redirect
       ▼
┌─────────────┐
│   Backend   │ 3. Generates state token, stores in Redis
└──────┬──────┘
       │
       │ 4. Returns Google OAuth URL + state
       ▼
┌─────────────┐
│ Mobile App  │ 5. Stores state in AsyncStorage
└──────┬──────┘    6. Opens Google sign-in
       │
       │ 7. User signs in with Google
       ▼
┌─────────────┐
│   Google    │ 8. Returns authorization code + state
└──────┬──────┘
       │
       │ 9. POST /api/v1/auth/google/callback
       ▼        (sends code + state)
┌─────────────┐
│   Backend   │ 10. Validates state token (Redis)
└──────┬──────┘ 11. Exchanges code for Google token
       │        12. Gets user info from Google
       │        13. Creates/updates user in PostgreSQL
       │        14. Creates/updates user in Firebase
       │        15. Generates JWT token
       │
       │ 16. Returns JWT + user data
       ▼
┌─────────────┐
│ Mobile App  │ 17. Stores JWT in AsyncStorage
└──────┬──────┘ 18. Navigates to home screen
       │
       │ For future API calls:
       │ Authorization: Bearer <JWT_TOKEN>
       ▼
```

---

## Troubleshooting

### "Failed to get redirect URL"
- ✅ Check if backend is running (`go run main.go`)
- ✅ Verify API_BASE_URL in `authService.ts`
- ✅ Test with curl: `curl http://10.0.2.2:8080/api/v1/auth/google/redirect`

### "Invalid or expired state token"
- ✅ Check Redis is running: `docker ps | grep redis`
- ✅ State tokens expire after 10 minutes
- ✅ Each state can only be used once

### "Play Services not available" (Android)
- ✅ Use a physical device or AVD with Google Play Services
- ✅ Update Google Play Services in emulator

### "Failed to authenticate with backend"
- ✅ Check backend logs for errors
- ✅ Verify Web Client ID in `authService.ts` matches Step 1.2
- ✅ Verify GOOGLE_CLIENT_ID in backend `.env`

### Backend crashes on startup
- ✅ Check `firebase-adminsdk.json` is in correct location
- ✅ Verify PostgreSQL is running
- ✅ Verify Redis is running

### Firebase user not created
- ✅ Check backend logs for Firebase errors
- ✅ Verify `firebase-adminsdk.json` is valid
- ✅ Note: App still works without Firebase (it's optional)

---

## What You Get

After completing these steps, you have:

✅ **Secure OAuth Flow** - State token validation prevents CSRF attacks  
✅ **JWT Authentication** - Mobile app uses JWT for API calls  
✅ **Firebase Integration** - Users synced to Firebase for future features  
✅ **Database Persistence** - User data stored in PostgreSQL  
✅ **Session Management** - Redis-based state token storage  
✅ **Production Ready** - Security best practices included  

---

## Next Steps

1. **Add protected routes** - Use JWT to protect API endpoints
2. **Implement user profile** - Display and edit user information
3. **Add logout functionality** - Clear token and redirect to login
4. **Implement LINE OAuth** - Add LINE as another login option
5. **Add push notifications** - Use Firebase Cloud Messaging
6. **Deploy to production** - Update URLs and use HTTPS

---

## Quick Reference

### Important Files

**Backend:**
- `/sys/backend/app/.env` - Environment configuration
- `/sys/backend/app/firebase-adminsdk.json` - Firebase credentials
- `/sys/backend/app/internal/handlers/auth.go` - Auth endpoints

**Mobile:**
- `/sys/frontend/user/mobile/chatshare/src/services/authService.ts` - Auth logic
- `/sys/frontend/user/mobile/chatshare/src/contexts/AuthContext.tsx` - Auth state
- `/sys/frontend/user/mobile/chatshare/src/screens/LoginScreen.tsx` - Login UI

### Important URLs

- Google Cloud Console: https://console.cloud.google.com/
- Firebase Console: https://console.firebase.google.com/
- Backend API: http://localhost:8080/api/v1

### Commands

```bash
# Start backend
cd /mnt/e/wsl_dev/101/chatshare/sys/backend/app && go run main.go

# Start mobile app (Android)
cd /mnt/e/wsl_dev/101/chatshare/sys/frontend/user/mobile/chatshare && npm run android

# View backend logs
tail -f /mnt/e/wsl_dev/101/chatshare/sys/backend/app/backend.log

# View mobile logs
npx react-native log-android
```

---

**Last Updated:** December 2024  
**Estimated Time:** ~60 minutes total
