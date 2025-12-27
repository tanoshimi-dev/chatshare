# Verify Google Cloud Setup - Checklist

## App Configuration (Your Settings)

- ✅ **Package Name**: `app.dev.chatshare`
- ✅ **SHA-1**: `57:23:FC:5E:20:92:F5:61:1C:90:A5:38:E3:E3:3F:47:35:98:32:10`
- ✅ **Web Client ID**: `684998272240-57hb1lmt95rifslmgui1bqiupp4astqg.apps.googleusercontent.com`

## Google Cloud Console Verification

### Step 1: Verify Project

1. Go to https://console.cloud.google.com/
2. **Make sure the project selected is**: `chatshare-482423`
3. Look at the top left, it should show: **chatshare-482423**

### Step 2: Check OAuth Credentials

Go to: https://console.cloud.google.com/apis/credentials?project=chatshare-482423

You **MUST** have BOTH of these:

#### A. Android OAuth Client

Click on the Android client, verify these EXACT values:

- [ ] **Application type**: Android
- [ ] **Package name**: `app.dev.chatshare` (exact match)
- [ ] **SHA-1 certificate fingerprints**: Contains `57:23:FC:5E:20:92:F5:61:1C:90:A5:38:E3:E3:3F:47:35:98:32:10`

**If the SHA-1 is missing or wrong, click "ADD FINGERPRINT" and paste it**

#### B. Web Application OAuth Client

Look for a client with type "Web application":

- [ ] Find the one with Client ID: `684998272240-57hb1lmt95rifslmgui1bqiupp4astqg`
- [ ] If it doesn't exist, you need to create it (see Step 4)

### Step 3: Check OAuth Consent Screen

Go to: https://console.cloud.google.com/apis/credentials/consent?project=chatshare-482423

- [ ] **Publishing status**: Should be "Testing" or "In production"
- [ ] **User type**: External or Internal
- [ ] **Test users**: Your email `keijimitaki@gmail.com` must be in the list (if status is Testing)

### Step 4: Create Web Application Client (if missing)

If you don't have the Web client with ID `684998272240-57hb1lmt95rifslmgui1bqiupp4astqg`:

1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. **Application type**: Select **"Web application"**
3. **Name**: `ChatShare Web` (or any name)
4. **Authorized redirect URIs**: Leave empty or add your backend URLs
5. Click **"CREATE"**
6. **COPY the Client ID** and update your code

### Step 5: Update Code with Correct Client ID

After creating/finding the Web client, copy its **Client ID** (it ends with `.apps.googleusercontent.com`)

Then update `src/services/authService.ts`:

```typescript
webClientId: 'PASTE_YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
```

## Common Mistakes

### ❌ Using Android Client ID in code

- The Android client ID should NOT be used in the code
- Only use Web Application client ID in `webClientId` config

### ❌ Wrong Project

- Make sure you're configuring the project `chatshare-482423`
- Not a different project

### ❌ SHA-1 not added

- The Android client must have the SHA-1 fingerprint
- Click "EDIT" on the Android client and verify

### ❌ Package name typo

- Must be exactly: `app.dev.chatshare`
- No spaces, no typos

### ❌ Test user not added

- If OAuth consent screen is in "Testing" mode
- You must add your Google account to "Test users"

## Test After Verification

1. Close your app completely
2. Rebuild:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```
3. Try signing in

## Still Not Working?

### Get the actual Client ID from Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials?project=chatshare-482423
2. Find the **Web application** client (NOT Android)
3. Click on it to see details
4. Copy the **Client ID** (should end with `.apps.googleusercontent.com`)
5. **Send me this Client ID** and I'll update the code

### Check if the credentials file is correct

The file `doc/authentication/client_secret_684998272240-57hb1lmt95rifslmgui1bqiupp4astqg.apps.googleusercontent.com.json` says it's type "installed" which is unusual. This might be a different type of credential.

**For React Native, you need a Web Application OAuth client, not an "installed" application.**

You might need to create a new Web Application client in Google Cloud Console.
