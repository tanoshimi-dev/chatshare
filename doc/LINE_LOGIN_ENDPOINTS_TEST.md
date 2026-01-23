# LINE Login Endpoints - Testing Guide

## Changes Made

Updated LINE login endpoints to match the mobile app guide specification:

### ✅ Endpoint Changes

| Old Endpoint | New Endpoint | Status |
|-------------|--------------|--------|
| `GET /api/v1/auth/line/redirect` | `GET /api/v1/auth/line/url` | ✅ Updated |
| `POST /api/v1/auth/line/callback` | `POST /api/v1/auth/line/callback` | ✅ No change |

### ✅ Response Format Changes

**Old format:**
```json
{
  "success": true,
  "data": {
    "redirect_url": "https://access.line.me/oauth2/v2.1/authorize?...",
    "state": "..."
  }
}
```

**New format (matches guide):**
```json
{
  "success": true,
  "data": {
    "url": "https://access.line.me/oauth2/v2.1/authorize?...",
    "state": "..."
  }
}
```

---

## Code Changes

### 1. Handler Function Renamed (internal/handlers/auth.go:175)

```go
// Old:
func (h *AuthHandler) LINELogin(c *gin.Context)

// New:
func (h *AuthHandler) GetLINEOAuthURL(c *gin.Context)
```

### 2. Response Field Updated (internal/handlers/auth.go:196-199)

```go
// Old:
utils.SuccessResponse(c, http.StatusOK, gin.H{
    "redirect_url": url,
    "state":        state,
})

// New:
utils.SuccessResponse(c, http.StatusOK, gin.H{
    "url":   url,
    "state": state,
})
```

### 3. Router Registration Updated (internal/router/router.go:44)

```go
// Old:
auth.GET("/line/redirect", authHandler.LINELogin)

// New:
auth.GET("/line/url", authHandler.GetLINEOAuthURL)
```

---

## Testing the Endpoints

### Prerequisites

1. **Redis running** (required for state storage)
```bash
docker run -d -p 6379:6379 redis:latest
# or
redis-server
```

2. **PostgreSQL running** (required for user storage)
```bash
docker run -d -p 5432:5432 \
  -e POSTGRES_DB=chatshare_db \
  -e POSTGRES_USER=chatshare \
  -e POSTGRES_PASSWORD=chatshare_password \
  postgres:latest
```

3. **Environment variables configured** (.env)
```bash
LINE_CHANNEL_ID=your-channel-id
LINE_CHANNEL_SECRET=your-channel-secret
LINE_REDIRECT_URL=http://localhost:8080/api/v1/auth/line/callback

REDIS_HOST=localhost
REDIS_PORT=6379

DB_HOST=localhost
DB_PORT=5432
DB_USER=chatshare
DB_PASSWORD=chatshare_password
DB_NAME=chatshare_db
```

### Start the Server

```bash
cd /mnt/e/wsl_dev/101/chatshare/sys/backend/app
go run main.go
```

### Test 1: Get LINE OAuth URL

```bash
curl http://localhost:8080/api/v1/auth/line/url
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://access.line.me/oauth2/v2.1/authorize?client_id=YOUR_CHANNEL_ID&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fv1%2Fauth%2Fline%2Fcallback&response_type=code&scope=profile+openid+email&state=RANDOM_STATE_TOKEN",
    "state": "RANDOM_STATE_TOKEN"
  }
}
```

### Test 2: LINE Callback (Manual Flow)

1. Copy the `url` from the response above
2. Open it in a browser
3. Login with LINE account and authorize
4. You'll be redirected to: `http://localhost:8080/api/v1/auth/line/callback?code=AUTHORIZATION_CODE&state=STATE_TOKEN`
5. Extract the `code` parameter
6. Call the callback endpoint:

```bash
curl -X POST http://localhost:8080/api/v1/auth/line/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "AUTHORIZATION_CODE_FROM_REDIRECT",
    "state": "STATE_TOKEN_FROM_STEP_1"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "U1234567890@line.user",
      "email_verified": false,
      "name": "LINE User Name",
      "avatar": "https://profile.line-scdn.net/...",
      "provider": "line",
      "provider_id": "U1234567890",
      "role": "user",
      "status": "active",
      "last_login_at": "2025-12-27T10:00:00Z",
      "created_at": "2025-12-27T10:00:00Z",
      "updated_at": "2025-12-27T10:00:00Z"
    }
  }
}
```

---

## Integration with Mobile App

The mobile app should now use these endpoints:

### Step 1: Get OAuth URL

```typescript
const urlResponse = await fetch(`${API_BASE_URL}/auth/line/url`, {
  method: "GET",
  headers: {
    Accept: "application/json",
  },
});

const urlData = await urlResponse.json();
const { url, state } = urlData.data;  // Note: "url" not "redirect_url"
```

### Step 2: Open WebView

```typescript
// Open WebView with the OAuth URL
navigation.navigate("LineLoginWebView", {
  url,
  onSuccess: (code) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  }
});
```

### Step 3: Exchange Code for Token

```typescript
const callbackResponse = await fetch(`${API_BASE_URL}/auth/line/callback`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    code,
    state,
  }),
});

const callbackData = await callbackResponse.json();
const { token, user } = callbackData.data;
```

---

## Error Handling

### Invalid State Token

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/line/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "some_code",
    "state": "invalid_state"
  }'
```

**Response:**
```json
{
  "success": false,
  "error": "Invalid or expired state token"
}
```

### Invalid Authorization Code

**Response:**
```json
{
  "success": false,
  "error": "Failed to exchange token"
}
```

### Missing Required Fields

**Response:**
```json
{
  "success": false,
  "error": "Invalid request body"
}
```

---

## Security Features

✅ **CSRF Protection**: State token validated and deleted after use (one-time use)
✅ **Token Expiration**: State tokens expire after 10 minutes
✅ **Redis Storage**: State tokens stored securely in Redis
✅ **HTTPS Ready**: Configure LINE_REDIRECT_URL with HTTPS in production
✅ **JWT Authentication**: Secure token-based authentication

---

## Production Checklist

- [ ] Update `LINE_REDIRECT_URL` to use HTTPS
- [ ] Configure LINE Developer Console with production callback URL
- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Enable `GIN_MODE=release`
- [ ] Configure `ENVIRONMENT=production`
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Configure CORS for production frontend URL
- [ ] Set up monitoring and logging
- [ ] Test with real LINE accounts

---

## Troubleshooting

### "Failed to store state"
- Check if Redis is running
- Verify REDIS_HOST and REDIS_PORT in .env

### "Invalid or expired state token"
- State tokens expire after 10 minutes
- State tokens are one-time use only
- Don't reuse the same state token

### "Failed to exchange token"
- Verify LINE_CHANNEL_ID and LINE_CHANNEL_SECRET
- Check if authorization code is valid
- Authorization codes expire quickly (use immediately)

### "Failed to get user info"
- Check LINE API status
- Verify access token is valid
- Ensure LINE channel has correct permissions

---

## Next Steps

1. ✅ Endpoints updated to match guide specification
2. ✅ Response format matches mobile app requirements
3. 🔄 Test with mobile app
4. 🔄 Configure LINE Developer Console
5. 🔄 Deploy to production

The backend is now ready for mobile app integration!
