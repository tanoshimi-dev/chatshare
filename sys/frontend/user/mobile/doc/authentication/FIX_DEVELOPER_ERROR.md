# Fix DEVELOPER_ERROR - Step by Step

## The Problem

`DEVELOPER_ERROR` means Google doesn't recognize your app. This happens when SHA-1 isn't configured.

## Step 1: Get Your SHA-1 Fingerprint

Run this command:

```bash
cd android
./gradlew signingReport
```

Look for output like this under **Variant: debug**:

```
SHA1: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
```

**Copy this SHA-1 value!**

## Step 2: Go to Google Cloud Console

1. Open https://console.cloud.google.com/
2. Select project: **chatshare-482423**
3. Go to **APIs & Services > Credentials**

## Step 3: Create Android OAuth Client

You need to create an **Android** OAuth 2.0 Client ID:

### A. Click "Create Credentials" → "OAuth client ID"

### B. Fill in these values:

- **Application type**: Android
- **Name**: ChatShare Android Debug
- **Package name**: `app.dev.chatshare`
- **SHA-1 certificate fingerprint**: (paste the SHA-1 from Step 1)

### C. Click "Create"

## Step 4: Verify Your Web Client ID

Make sure you also have a **Web application** OAuth client:

1. In Credentials page, look for client type: **Web application**
2. The Client ID should be: `684998272240-blbifvj5l31r56e04gificvlk70h31ek.apps.googleusercontent.com`
3. If you don't have one, create it:
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Name: "ChatShare Web"
   - Click "Create"

## Step 5: Wait & Verify

- Changes can take **5-10 minutes** to propagate
- After waiting, try signing in again

## Step 6: Test Again

```bash
npm run android
```

Then click "Sign in with Google"

---

## Common Issues

### Wrong Package Name

- Must be exactly: `app.dev.chatshare`
- Check in `android/app/build.gradle` under `applicationId`

### Wrong SHA-1

- Make sure you copied the SHA-1 from the **debug** variant
- Make sure there are no extra spaces

### Multiple SHA-1s

- If you rebuild or use different machines, you may need to add multiple SHA-1 fingerprints
- You can add multiple SHA-1s to the same Android OAuth client

### Still Not Working?

1. Clean and rebuild:

   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

2. Check OAuth Consent Screen:

   - Go to **APIs & Services > OAuth consent screen**
   - Status should be "Testing" or "Published"
   - Add your email to "Test users" if in Testing mode

3. Verify APIs (Optional):
   - You don't need to enable any special APIs
   - OAuth 2.0 works automatically with just the credentials
   - Google+ API is deprecated and not needed

---

## Current Configuration Summary

- **Package Name**: `app.dev.chatshare`
- **Web Client ID**: `684998272240-blbifvj5l31r56e04gificvlk70h31ek.apps.googleusercontent.com`
- **Project ID**: `chatshare-482423`
- **You Need To Add**: Android OAuth Client with your SHA-1

Once you add the Android client with SHA-1, it should work! 🎉
