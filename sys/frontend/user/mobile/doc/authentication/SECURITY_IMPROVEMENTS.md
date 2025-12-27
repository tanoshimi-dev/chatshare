# Security Improvements - Environment Variables

## What Changed

Moved sensitive configuration (API keys, OAuth credentials) from hardcoded values to environment variables using `react-native-config`.

### Before (❌ Insecure)

```typescript
const API_BASE_URL = 'http://192.168.0.241:8080/api/v1';
GoogleSignin.configure({
  webClientId:
    '684998272240-blbifvj5l31r56e04gificvlk70h31ek.apps.googleusercontent.com',
  // ...
});
```

### After (✅ Secure)

```typescript
import Config from 'react-native-config';

const API_BASE_URL = Config.API_BASE_URL || 'http://localhost:8080/api/v1';
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  // ...
});
```

## Files Modified

### New Files

- `.env` - Local environment variables (NOT committed to git)
- `.env.example` - Template for required variables (committed to git)
- `doc/authentication/environment-variables-guide.md` - Complete setup guide

### Modified Files

- `.gitignore` - Added `.env` files to prevent committing secrets
- `src/services/authService.ts` - Updated to use environment variables
- `android/app/build.gradle` - Added react-native-config plugin
- `package.json` - Added `react-native-config` dependency

## How to Use

### 1. Initial Setup (One-time)

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual credentials
# GOOGLE_WEB_CLIENT_ID=your-actual-client-id
# API_BASE_URL=http://your-ip:8080/api/v1
```

### 2. Rebuild App

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### 3. Commit Safely

```bash
git add .
git commit -m "feat: move secrets to environment variables"
git push
```

The `.env` file will be ignored by git, so your secrets stay local.

## Benefits

✅ **Security**

- Credentials never committed to git
- Each developer uses their own credentials
- Easy to rotate secrets without code changes

✅ **Flexibility**

- Different configs for dev/staging/production
- Easy to switch between environments
- No hardcoded values in source code

✅ **Collaboration**

- New developers just copy `.env.example`
- Clear documentation of required variables
- No accidental credential leaks in pull requests

## For New Team Members

See the complete guide: [Environment Variables Guide](./doc/authentication/environment-variables-guide.md)

Quick start:

```bash
cp .env.example .env
# Edit .env with your credentials
npm install
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## Production Deployment

For production builds, use a separate `.env.production` file:

```bash
# .env.production
GOOGLE_WEB_CLIENT_ID=your-production-client-id
API_BASE_URL=https://api.yourdomain.com/v1
```

Build with production env:

```bash
ENVFILE=.env.production npx react-native run-android --variant=release
```

## Related Documentation

- [Environment Variables Guide](./doc/authentication/environment-variables-guide.md) - Complete setup
- [Google Sign-In Setup](./chatshare/GOOGLE_SIGNIN_SETUP.md) - OAuth configuration
- [DEVELOPER_ERROR Fix](./doc/authentication/google-signin-developer-error-fix.md) - Troubleshooting
