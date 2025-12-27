# LINE Login Production Implementation Guide

## Overview

This guide shows how to implement **production-ready LINE Login** using OAuth 2.0 web flow with backend validation.

## Architecture

```
Mobile App → WebView → LINE OAuth → Authorization Code → Backend API → Validate Token → User Profile → JWT Token → App
```

## Step 1: Backend Implementation (Required)

### 1.1 Create LINE OAuth Endpoints

Your backend needs these endpoints:

```javascript
// Backend: /api/v1/auth/line/url
// Returns LINE OAuth URL for the app to open
GET /api/v1/auth/line/url
Response: {
  "success": true,
  "data": {
    "url": "https://access.line.me/oauth2/v2.1/authorize?...",
    "state": "random_state_token"
  }
}

// Backend: /api/v1/auth/line/callback
// Exchange authorization code for user profile
POST /api/v1/auth/line/callback
Body: {
  "code": "authorization_code",
  "state": "state_token"
}
Response: {
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "U1234567890abcdef",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://...",
      "provider": "line"
    }
  }
}
```

### 1.2 Backend Code Example (Go/Golang)

```go
package auth

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var (
	LineChannelID     = os.Getenv("LINE_CHANNEL_ID")
	LineChannelSecret = os.Getenv("LINE_CHANNEL_SECRET")
	LineCallbackURL   = os.Getenv("LINE_CALLBACK_URL")
	JWTSecret         = os.Getenv("JWT_SECRET")
)

type OAuthURLResponse struct {
	Success bool `json:"success"`
	Data    struct {
		URL   string `json:"url"`
		State string `json:"state"`
	} `json:"data"`
}

type CallbackRequest struct {
	Code  string `json:"code" binding:"required"`
	State string `json:"state" binding:"required"`
}

type LineTokenResponse struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	IDToken      string `json:"id_token"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	TokenType    string `json:"token_type"`
}

type LineProfile struct {
	UserID      string `json:"userId"`
	DisplayName string `json:"displayName"`
	PictureURL  string `json:"pictureUrl"`
	StatusMessage string `json:"statusMessage"`
}

type User struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	Avatar        string    `json:"avatar"`
	Provider      string    `json:"provider"`
	Role          string    `json:"role"`
	Status        string    `json:"status"`
	EmailVerified bool      `json:"email_verified"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type AuthResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Token string `json:"token"`
		User  User   `json:"user"`
	} `json:"data"`
	Message string `json:"message,omitempty"`
}

// Generate random state token
func generateState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// GetLineOAuthURL generates LINE OAuth authorization URL
func GetLineOAuthURL(c *gin.Context) {
	state, err := generateState()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate state token",
		})
		return
	}

	// Store state in session/Redis for validation
	// For demo, we'll store in cookie (use Redis in production)
	c.SetCookie("line_oauth_state", state, 600, "/", "", false, true)

	params := url.Values{}
	params.Set("response_type", "code")
	params.Set("client_id", LineChannelID)
	params.Set("redirect_uri", LineCallbackURL)
	params.Set("state", state)
	params.Set("scope", "profile openid email")

	authURL := fmt.Sprintf("https://access.line.me/oauth2/v2.1/authorize?%s", params.Encode())

	c.JSON(http.StatusOK, OAuthURLResponse{
		Success: true,
		Data: struct {
			URL   string `json:"url"`
			State string `json:"state"`
		}{
			URL:   authURL,
			State: state,
		},
	})
}

// HandleLineCallback exchanges authorization code for access token
func HandleLineCallback(c *gin.Context) {
	var req CallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	// Validate state parameter
	storedState, err := c.Cookie("line_oauth_state")
	if err != nil || storedState != req.State {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid state parameter",
		})
		return
	}

	// Exchange authorization code for access token
	tokenResp, err := exchangeCodeForToken(req.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("Failed to exchange code: %v", err),
		})
		return
	}

	// Get user profile from LINE
	profile, err := getLineProfile(tokenResp.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("Failed to get profile: %v", err),
		})
		return
	}

	// Decode ID token to get email
	claims, err := decodeIDToken(tokenResp.IDToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("Failed to decode ID token: %v", err),
		})
		return
	}

	email, _ := claims["email"].(string)
	if email == "" {
		email = fmt.Sprintf("%s@line.user", profile.UserID)
	}

	// Create or update user in database
	user, err := createOrUpdateUser(User{
		Email:         email,
		Name:          profile.DisplayName,
		Avatar:        profile.PictureURL,
		Provider:      "line",
		EmailVerified: email != fmt.Sprintf("%s@line.user", profile.UserID),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create user",
		})
		return
	}

	// Generate JWT token
	token, err := generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate token",
		})
		return
	}

	// Clear state cookie
	c.SetCookie("line_oauth_state", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Data: struct {
			Token string `json:"token"`
			User  User   `json:"user"`
		}{
			Token: token,
			User:  user,
		},
	})
}

// exchangeCodeForToken exchanges authorization code for access token
func exchangeCodeForToken(code string) (*LineTokenResponse, error) {
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("redirect_uri", LineCallbackURL)
	data.Set("client_id", LineChannelID)
	data.Set("client_secret", LineChannelSecret)

	resp, err := http.Post(
		"https://api.line.me/oauth2/v2.1/token",
		"application/x-www-form-urlencoded",
		strings.NewReader(data.Encode()),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("LINE API error: %s", string(body))
	}

	var tokenResp LineTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}

// getLineProfile fetches user profile from LINE
func getLineProfile(accessToken string) (*LineProfile, error) {
	req, err := http.NewRequest("GET", "https://api.line.me/v2/profile", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("LINE API error: %s", string(body))
	}

	var profile LineProfile
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return nil, err
	}

	return &profile, nil
}

// decodeIDToken decodes LINE ID token (simplified - use proper JWT library)
func decodeIDToken(idToken string) (jwt.MapClaims, error) {
	token, _, err := new(jwt.Parser).ParseUnverified(idToken, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token claims")
}

// generateJWT generates JWT token for authenticated user
func generateJWT(user User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(JWTSecret))
}

// createOrUpdateUser creates or updates user in database
func createOrUpdateUser(userData User) (User, error) {
	// TODO: Implement database logic
	// This is a placeholder - replace with your actual DB implementation

	user := User{
		ID:            fmt.Sprintf("user_%d", time.Now().Unix()),
		Email:         userData.Email,
		Name:          userData.Name,
		Avatar:        userData.Avatar,
		Provider:      userData.Provider,
		Role:          "user",
		Status:        "active",
		EmailVerified: userData.EmailVerified,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Example: Save to database
	// db.Save(&user)

	return user, nil
}

// Register routes
func RegisterLineAuthRoutes(router *gin.Engine) {
	auth := router.Group("/api/v1/auth")
	{
		auth.GET("/line/url", GetLineOAuthURL)
		auth.POST("/line/callback", HandleLineCallback)
	}
}
```

### 1.3 Go Dependencies

Add to `go.mod`:

```go
require (
	github.com/gin-gonic/gin v1.10.0
	github.com/golang-jwt/jwt/v5 v5.2.0
)
```

Install:

```bash
go get github.com/gin-gonic/gin
go get github.com/golang-jwt/jwt/v5
```

### 1.4 Main Server Setup

```go
// main.go
package main

import (
	"log"
	"your-app/auth"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// Enable CORS for mobile app
	router.Use(corsMiddleware())

	// Register LINE auth routes
	auth.RegisterLineAuthRoutes(router)

	// Start server
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
```

### 1.5 Environment Variables

```bash
# .env
LINE_CHANNEL_ID=your-channel-id
LINE_CHANNEL_SECRET=your-channel-secret
LINE_CALLBACK_URL=https://api.yourdomain.com/api/v1/auth/line/callback
JWT_SECRET=your-jwt-secret-key-min-32-chars
```

## Step 2: Mobile App Implementation

### 2.1 Update authService.ts

Replace the mock LINE implementation:

```typescript
import { Linking } from "react-native";
import { WebView } from "react-native-webview";

// LINE Sign-In Flow (Production)
export const signInWithLine = async (): Promise<AuthResponse> => {
  try {
    console.log("Starting LINE Sign-In...");

    // Step 1: Get OAuth URL from backend
    const urlResponse = await fetch(`${API_BASE_URL}/auth/line/url`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!urlResponse.ok) {
      throw new Error("Failed to get LINE OAuth URL");
    }

    const urlData = await urlResponse.json();
    if (!urlData.success) {
      throw new Error(urlData.message || "Failed to get OAuth URL");
    }

    const { url, state } = urlData.data;

    // Store state for validation
    await AsyncStorage.setItem("line_oauth_state", state);

    // Step 2: Open LINE OAuth in browser/WebView
    // This will be handled by LineLoginWebView component
    return new Promise((resolve, reject) => {
      // WebView will call this callback with the code
      global.lineLoginCallback = async (code: string) => {
        try {
          // Step 3: Send code to backend
          const callbackResponse = await fetch(
            `${API_BASE_URL}/auth/line/callback`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code,
                state,
              }),
            }
          );

          if (!callbackResponse.ok) {
            throw new Error("Failed to authenticate with backend");
          }

          const callbackData = await callbackResponse.json();
          if (!callbackData.success) {
            throw new Error(callbackData.message || "Authentication failed");
          }

          const authResponse: AuthResponse = callbackData.data;

          // Step 4: Store token and user
          await AsyncStorage.setItem("auth_token", authResponse.token);
          await AsyncStorage.setItem("user", JSON.stringify(authResponse.user));
          await AsyncStorage.removeItem("line_oauth_state");

          resolve(authResponse);
        } catch (error) {
          reject(error);
        }
      };

      // Open LINE login (will be handled by navigation)
      global.lineOAuthUrl = url;
    });
  } catch (error: any) {
    console.error("LINE Sign-In error:", error);
    throw new Error(error.message || "LINE sign-in failed");
  }
};

// Helper to check if LINE login is available
export const isLineLoginAvailable = (): boolean => {
  const channelId = Config.LINE_CHANNEL_ID;
  return !!channelId && API_BASE_URL !== "http://localhost:8080/api/v1";
};
```

### 2.2 Create LineLoginWebView Component

```typescript
// src/screens/LineLoginWebView.tsx
import React, { useRef } from "react";
import { SafeAreaView, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      url: string;
      onSuccess: (code: string) => void;
      onError: (error: Error) => void;
    };
  };
};

export const LineLoginWebView: React.FC<Props> = ({ navigation, route }) => {
  const { url, onSuccess, onError } = route.params;
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;

    // Check if this is the callback URL
    if (currentUrl.includes("/auth/line/callback")) {
      // Extract authorization code from URL
      const urlObj = new URL(currentUrl);
      const code = urlObj.searchParams.get("code");
      const error = urlObj.searchParams.get("error");

      if (error) {
        navigation.goBack();
        onError(new Error(`LINE OAuth error: ${error}`));
        return;
      }

      if (code) {
        navigation.goBack();
        onSuccess(code);
        return;
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator
            style={styles.loading}
            size="large"
            color="#00B900"
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
```

### 2.3 Update LoginScreen.tsx

```typescript
const handleLineSignIn = async () => {
  setLineLoading(true);
  try {
    // Check if backend is available
    if (!isLineLoginAvailable()) {
      Alert.alert(
        "LINE Login Unavailable",
        "LINE login requires backend configuration. Please configure LINE_CHANNEL_ID and backend URL."
      );
      return;
    }

    // Get OAuth URL from backend
    const urlResponse = await fetch(`${API_BASE_URL}/auth/line/url`);
    const urlData = await urlResponse.json();

    if (!urlData.success) {
      throw new Error("Failed to get LINE OAuth URL");
    }

    const { url, state } = urlData.data;
    await AsyncStorage.setItem("line_oauth_state", state);

    // Navigate to WebView
    navigation.navigate("LineLoginWebView", {
      url,
      onSuccess: async (code: string) => {
        try {
          // Exchange code for token
          const callbackResponse = await fetch(
            `${API_BASE_URL}/auth/line/callback`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code, state }),
            }
          );

          const callbackData = await callbackResponse.json();

          if (!callbackData.success) {
            throw new Error(callbackData.message);
          }

          const authResponse = callbackData.data;

          // Store auth data
          await AsyncStorage.setItem("auth_token", authResponse.token);
          await AsyncStorage.setItem("user", JSON.stringify(authResponse.user));

          Alert.alert("Success", `Welcome ${authResponse.user.name}!`, [
            {
              text: "OK",
              onPress: () => {
                if (onLoginSuccess) {
                  onLoginSuccess();
                } else {
                  navigation.navigate("Home");
                }
              },
            },
          ]);
        } catch (error: any) {
          Alert.alert("Login Failed", error.message);
        } finally {
          setLineLoading(false);
        }
      },
      onError: (error: Error) => {
        Alert.alert("Login Failed", error.message);
        setLineLoading(false);
      },
    });
  } catch (error: any) {
    console.error("LINE sign in error:", error);
    Alert.alert("Sign In Failed", error.message || "An error occurred");
    setLineLoading(false);
  }
};
```

## Step 3: LINE Developers Console Setup

### 3.1 Create LINE Login Channel

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Create a new Channel → **LINE Login**
3. Fill in:
   - **App name**: ChatShare
   - **App description**: Share conversations app
   - **Callback URL**: `https://api.yourdomain.com/api/v1/auth/line/callback`

### 3.2 Get Credentials

From Basic settings tab:

- **Channel ID**: `1234567890` (example)
- **Channel Secret**: `abc123def456...` (keep secret!)

### 3.3 Configure Scopes

In LINE Login tab:

- Enable scopes:
  - ✅ `profile` - Get user profile
  - ✅ `openid` - Get ID token
  - ✅ `email` - Get email address (requires verification)

## Step 4: Environment Configuration

### 4.1 Backend .env (Go)

```bash
# LINE OAuth Configuration
LINE_CHANNEL_ID=your-channel-id
LINE_CHANNEL_SECRET=your-channel-secret
LINE_CALLBACK_URL=https://api.yourdomain.com/api/v1/auth/line/callback

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Server Configuration
PORT=8080
GIN_MODE=release  # Use 'debug' for development
```

Load environment variables in Go:

```go
// Use godotenv for local development
import "github.com/joho/godotenv"

func init() {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }
}
```

Install godotenv:

```bash
go get github.com/joho/godotenv
```

### 4.2 Mobile .env

```bash
LINE_CHANNEL_ID=your-channel-id
API_BASE_URL=https://api.yourdomain.com/api/v1
```

## Step 5: Testing

### 5.1 Run Go Backend

```bash
# Install dependencies
go mod download

# Run server
go run main.go

# Or build and run
go build -o server
./server
```

### 5.2 Test Backend Endpoints

```bash
# Test OAuth URL generation
curl http://localhost:8080/api/v1/auth/line/url

# Should return:
{
  "success": true,
  "data": {
    "url": "https://access.line.me/oauth2/v2.1/authorize?...",
    "state": "..."
  }
}

# Test callback (after getting code from LINE)
curl -X POST http://localhost:8080/api/v1/auth/line/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code_from_line",
    "state": "state_from_previous_response"
  }'
```

### 5.2 Test Mobile Flow

1. Rebuild app: `npx react-native run-android`
2. Tap "Sign in with LINE"
3. WebView opens with LINE login
4. Authorize the app
5. Redirected back with user profile
6. Check you're logged in

## Security Checklist

- [ ] **State parameter validation** - Prevent CSRF attacks
- [ ] **HTTPS only** - All callbacks must use HTTPS in production
- [ ] **Token expiration** - Set reasonable JWT expiration (7 days)
- [ ] **Refresh tokens** - Implement token refresh mechanism
- [ ] **Rate limiting** - Limit auth endpoint requests
- [ ] **Channel Secret** - NEVER expose in mobile app or frontend
- [ ] **Secure storage** - Store tokens securely (use Keychain/Keystore)
- [ ] **Error handling** - Don't expose sensitive error details to client

## Comparison: Mock vs Production

| Feature                | Mock (Current) | Production (OAuth)     |
| ---------------------- | -------------- | ---------------------- |
| **Setup complexity**   | None           | Backend + LINE Console |
| **Real user data**     | ❌ No          | ✅ Yes                 |
| **Requires backend**   | ❌ No          | ✅ Yes                 |
| **Security**           | Low            | High (OAuth 2.0)       |
| **Email verification** | ❌ No          | ✅ Optional            |
| **Production ready**   | ❌ No          | ✅ Yes                 |

## Migration Path

### Phase 1: Backend Setup (Current)

```bash
# Backend not ready, use mock
LINE_CHANNEL_ID=mock
```

### Phase 2: Backend Ready

```bash
# Update .env
LINE_CHANNEL_ID=actual-channel-id
API_BASE_URL=https://api.yourdomain.com/api/v1

# Update authService.ts with production code
# Add LineLoginWebView component
# Update navigation
```

### Phase 3: Production

```bash
# Use production credentials
# Enable HTTPS enforcement
# Add monitoring/analytics
```

## Additional Packages Needed

```bash
npm install react-native-webview --save
```

Then rebuild:

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Troubleshooting

### "Invalid redirect_uri"

- Verify callback URL matches exactly in LINE Console
- Must use HTTPS in production

### "Invalid state parameter"

- State validation failing
- Check session storage in backend

### WebView not opening

- Install react-native-webview
- Add to navigation stack

### Email not returned

- Enable email scope in LINE Console
- Request email verification from users

## Production Deployment Checklist

- [ ] Backend OAuth endpoints implemented
- [ ] LINE Channel created with production callback URL
- [ ] HTTPS configured for API
- [ ] Environment variables set correctly
- [ ] WebView component added
- [ ] Navigation updated
- [ ] Error handling implemented
- [ ] Security audit completed
- [ ] Testing with real LINE accounts
- [ ] Analytics/monitoring added

## Support

- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/)
- [LINE Login Integration Guide](https://developers.line.biz/en/docs/line-login/integrate-line-login/)
- [OAuth 2.0 Spec](https://oauth.net/2/)
