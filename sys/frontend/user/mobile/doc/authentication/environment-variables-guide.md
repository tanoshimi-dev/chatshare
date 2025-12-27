# Environment Variables Security Guide

## Overview

This project uses `react-native-config` to manage sensitive configuration like API keys and OAuth credentials. This prevents accidentally committing secrets to version control.

## Setup for New Developers

1. **Copy the example environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Fill in your credentials in `.env`:**

   ```bash
   # Get your Web Client ID from Google Cloud Console
   GOOGLE_WEB_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com

   # Set your backend API URL
   API_BASE_URL=http://your-ip:8080/api/v1
   ```

3. **Rebuild the app:**

   ```bash
   # Android
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android

   # iOS
   cd ios
   pod install
   cd ..
   npx react-native run-ios
   ```

## Environment Variables

### `GOOGLE_WEB_CLIENT_ID` (Required)

- **Description**: OAuth 2.0 Web Client ID from Google Cloud Console
- **Where to get it**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Select your project (ChatShare)
  3. Navigate to **APIs & Services > Credentials**
  4. Find your **Web application** OAuth client
  5. Copy the Client ID (ends with `.apps.googleusercontent.com`)
- **Type**: Web application (NOT Android client ID)
- **Example**: `684998272240-blbifvj5l31r56e04gificvlk70h31ek.apps.googleusercontent.com`

### `API_BASE_URL` (Optional)

- **Description**: Backend API base URL
- **Default**: `http://localhost:8080/api/v1`
- **Local Development**: Use your machine's IP address (e.g., `http://192.168.0.241:8080/api/v1`)
- **Production**: Use your production API URL

## Files

### `.env` (NEVER commit)

- Contains actual secrets and credentials
- Listed in `.gitignore`
- Each developer creates their own

### `.env.example` (Commit to git)

- Template showing required variables
- Does NOT contain actual secrets
- Safe to commit to version control

## Usage in Code

```typescript
import Config from "react-native-config";

// Access environment variables
const apiUrl = Config.API_BASE_URL;
const clientId = Config.GOOGLE_WEB_CLIENT_ID;
```

## Security Best Practices

✅ **DO:**

- Keep `.env` in `.gitignore`
- Use `.env.example` as a template
- Document all required variables
- Use different values for dev/staging/production

❌ **DON'T:**

- Commit `.env` file to git
- Hardcode secrets in source code
- Share `.env` file in public channels
- Use production credentials in development

## Troubleshooting

### "GOOGLE_WEB_CLIENT_ID is not configured" Error

**Solution:** Create a `.env` file with your Google Web Client ID:

```bash
cp .env.example .env
# Then edit .env with your actual credentials
```

### Changes to `.env` not reflected in app

**Solution:** Rebuild the app completely:

```bash
# Android
cd android && ./gradlew clean && cd ..
npx react-native run-android

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

### Different environments (dev/staging/prod)

Create multiple env files:

- `.env` - default
- `.env.development` - development
- `.env.staging` - staging
- `.env.production` - production

Then specify which to use:

```bash
ENVFILE=.env.production npx react-native run-android
```

## Related Documentation

- [react-native-config](https://github.com/luggit/react-native-config)
- [Google OAuth Setup](../chatshare/GOOGLE_SIGNIN_SETUP.md)
- [Security Fix Guide](./google-signin-developer-error-fix.md)
