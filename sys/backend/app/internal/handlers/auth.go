package handlers

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"sync"
	"time"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/firebase"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

// Apple JWKS cache
var (
	appleJWKSCache     *AppleJWKS
	appleJWKSCacheMu   sync.RWMutex
	appleJWKSCacheTime time.Time
)

// AppleJWKS represents Apple's JSON Web Key Set
type AppleJWKS struct {
	Keys []AppleJWK `json:"keys"`
}

// AppleJWK represents a single JSON Web Key from Apple
type AppleJWK struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	N   string `json:"n"`
	E   string `json:"e"`
}

// AppleClaims represents the claims in an Apple ID token
type AppleClaims struct {
	jwt.RegisteredClaims
	Email         string `json:"email,omitempty"`
	EmailVerified any    `json:"email_verified,omitempty"` // Can be bool or string
	IsPrivateEmail any   `json:"is_private_email,omitempty"`
	AuthTime      int64  `json:"auth_time,omitempty"`
	NonceSupported bool  `json:"nonce_supported,omitempty"`
}

type AuthHandler struct {
	db            *gorm.DB
	cfg           *config.Config
	googleConfig  *oauth2.Config
	lineConfig    *oauth2.Config
	sessionStore  *utils.SessionStore
	firebaseService *firebase.FirebaseService
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config, redisClient *redis.Client, firebaseService *firebase.FirebaseService) *AuthHandler {
	googleConfig := &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	lineConfig := &oauth2.Config{
		ClientID:     cfg.LINEChannelID,
		ClientSecret: cfg.LINEChannelSecret,
		RedirectURL:  cfg.LINERedirectURL,
		Scopes:       []string{"profile", "openid", "email"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://access.line.me/oauth2/v2.1/authorize",
			TokenURL: "https://api.line.me/oauth2/v2.1/token",
		},
	}

	return &AuthHandler{
		db:            db,
		cfg:           cfg,
		googleConfig:  googleConfig,
		lineConfig:    lineConfig,
		sessionStore:  utils.NewSessionStore(redisClient),
		firebaseService: firebaseService,
	}
}

// GoogleLogin generates OAuth URL with state token and redirects to Google
// GET /api/v1/auth/google/redirect
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	// Generate state token
	state, err := utils.GenerateRandomString(32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate state token")
		return
	}

	// Store state in Redis with expiration
	ctx := context.Background()
	if err := h.sessionStore.StoreState(ctx, state); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to store state")
		return
	}

	// Generate OAuth URL
	url := h.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)

	// Perform HTTP 302 redirect to Google OAuth
	c.Redirect(http.StatusFound, url)
}

// GoogleCallback handles the OAuth callback with state validation
// POST /api/v1/auth/google/callback
// Supports both web OAuth flow (with state) and mobile SDK flow (without state)
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

	// If state is provided (web flow), validate it
	// If state is not provided (mobile SDK flow), skip validation
	if req.State != "" {
		// Validate state token for web OAuth flow
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

	// Create or update user in database and Firebase
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

	// Set session cookie
	isProduction := h.cfg.Environment == "production"
	utils.SetAuthCookie(c, jwtToken, isProduction)

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"token": jwtToken,
		"user":  user,
	})
}

// LINE OAuth - Get OAuth URL
// GET /api/v1/auth/line/url
func (h *AuthHandler) GetLINEOAuthURL(c *gin.Context) {
	// Debug: Log the LINE configuration
	fmt.Printf("DEBUG: LINE Config - ClientID: %s\n", h.lineConfig.ClientID)
	fmt.Printf("DEBUG: LINE Config - RedirectURL: %s\n", h.lineConfig.RedirectURL)
	
	// Generate state token
	state, err := utils.GenerateRandomString(32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate state token")
		return
	}

	// Store state in Redis
	ctx := context.Background()
	if err := h.sessionStore.StoreState(ctx, state); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to store state")
		return
	}

	// Generate OAuth URL
	url := h.lineConfig.AuthCodeURL(state)
	
	// Debug: Log the generated URL
	fmt.Printf("DEBUG: Generated LINE OAuth URL: %s\n", url)
	fmt.Printf("DEBUG: State token: %s\n", state)

	// Return format matching the guide
	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"url":   url,
		"state": state,
	})
}

// LINECallbackGET handles LINE OAuth callback via GET request (from LIFF redirects)
// GET /api/v1/auth/line/callback?code=xxx&state=xxx
func (h *AuthHandler) LINECallbackGET(c *gin.Context) {
	// Get query parameters
	code := c.Query("code")
	state := c.Query("state")
	errorParam := c.Query("error")
	errorDescription := c.Query("error_description")

	// Debug: Log the User-Agent and request details
	userAgent := c.GetHeader("User-Agent")
	fmt.Printf("DEBUG: LINE Callback - User-Agent: %s\n", userAgent)
	fmt.Printf("DEBUG: LINE Callback - All Headers: %v\n", c.Request.Header)
	
	// Check for OAuth errors
	if errorParam != "" {
		fmt.Printf("DEBUG: OAuth error received: %s - %s\n", errorParam, errorDescription)
		// Return a simple HTML page that closes the window or shows error
		errorMsg := errorDescription
		if errorMsg == "" {
			errorMsg = errorParam
		}
		c.Header("Content-Type", "text/html")
		c.String(http.StatusOK, `
			<!DOCTYPE html>
			<html><head><meta charset="utf-8"><title>Login Failed</title></head>
			<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
				<h2>Login Failed</h2>
				<p>%s</p>
				<script>setTimeout(() => { window.close(); }, 3000);</script>
			</body></html>`, errorMsg)
		return
	}

	if code == "" || state == "" {
		fmt.Printf("DEBUG: Missing code or state parameter\n")
		c.Header("Content-Type", "text/html")
		c.String(http.StatusBadRequest, `
			<!DOCTYPE html>
			<html><head><meta charset="utf-8"><title>Login Failed</title></head>
			<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
				<h2>Login Failed</h2>
				<p>Missing required parameters</p>
				<script>setTimeout(() => { window.close(); }, 3000);</script>
			</body></html>`)
		return
	}

	// Process the callback directly
	h.processLINECallback(c, code, state)
}

// LINECallback handles LINE OAuth callback via POST request (from mobile apps)
// POST /api/v1/auth/line/callback
func (h *AuthHandler) LINECallback(c *gin.Context) {
	// Parse request body
	var req struct {
		Code  string `json:"code" binding:"required"`
		State string `json:"state" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Process the callback using common logic
	h.processLINECallback(c, req.Code, req.State)
}

// processLINECallback contains the shared logic for both GET and POST callbacks
func (h *AuthHandler) processLINECallback(c *gin.Context, code, state string) {

	// Validate state token
	ctx := context.Background()
	valid, err := h.sessionStore.ValidateAndDeleteState(ctx, state)
	if err != nil {
		fmt.Printf("DEBUG: State validation error: %v\n", err)
		// Check if this is a mobile WebView request by looking at Accept header or User-Agent
		if isMobileWebView(c) {
			c.Header("Content-Type", "text/html")
			c.String(http.StatusInternalServerError, `
				<!DOCTYPE html>
				<html><head><meta charset="utf-8"><title>Login Failed</title></head>
				<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
					<h2>Login Failed</h2>
					<p>Failed to validate state</p>
					<script>setTimeout(() => { window.close(); }, 3000);</script>
				</body></html>`)
		} else {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to validate state")
		}
		return
	}
	if !valid {
		fmt.Printf("DEBUG: Invalid state token: %s\n", state)
		if isMobileWebView(c) {
			c.Header("Content-Type", "text/html")
			c.String(http.StatusBadRequest, `
				<!DOCTYPE html>
				<html><head><meta charset="utf-8"><title>Login Failed</title></head>
				<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
					<h2>Login Failed</h2>
					<p>Invalid or expired state token</p>
					<script>setTimeout(() => { window.close(); }, 3000);</script>
				</body></html>`)
		} else {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired state token")
		}
		return
	}

	fmt.Printf("DEBUG: State validation successful, proceeding with token exchange\n")

	// Exchange code for token
	token, err := h.lineConfig.Exchange(ctx, code)
	if err != nil {
		fmt.Printf("DEBUG: Token exchange error: %v\n", err)
		if isMobileWebView(c) {
			c.Header("Content-Type", "text/html")
			c.String(http.StatusInternalServerError, `
				<!DOCTYPE html>
				<html><head><meta charset="utf-8"><title>Login Failed</title></head>
				<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
					<h2>Login Failed</h2>
					<p>Failed to exchange authorization code</p>
					<script>setTimeout(() => { window.close(); }, 3000);</script>
				</body></html>`)
		} else {
			utils.ErrorResponse(c, http.StatusBadRequest, "Failed to exchange token")
		}
		return
	}

	client := h.lineConfig.Client(ctx, token)
	resp, err := client.Get("https://api.line.me/v2/profile")
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

	var lineUser struct {
		UserID        string `json:"userId"`
		DisplayName   string `json:"displayName"`
		PictureURL    string `json:"pictureUrl"`
		StatusMessage string `json:"statusMessage"`
	}

	if err := json.Unmarshal(body, &lineUser); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to parse user info")
		return
	}

	// LINE doesn't always provide email, use userID as email fallback
	email := fmt.Sprintf("%s@line.user", lineUser.UserID)

	user, jwtToken, err := h.findOrCreateUser(
		ctx,
		email,
		lineUser.DisplayName,
		lineUser.PictureURL,
		"line",
		lineUser.UserID,
		false, // LINE doesn't verify email by default
	)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to process user")
		return
	}

	// Set session cookie
	isProduction := h.cfg.Environment == "production"
	utils.SetAuthCookie(c, jwtToken, isProduction)

	// Check if this is a mobile WebView request
	if isMobileWebView(c) {
		// Return HTML success page for mobile WebView
		userJSON, _ := json.Marshal(user)
		c.Header("Content-Type", "text/html")
		c.String(http.StatusOK, `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Login Successful</title>
			</head>
			<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
				<h2>✅ Login Successful!</h2>
				<p>Welcome %s!</p>
				<p>Redirecting back to the app...</p>
				<script>
					// Store auth data for the app
					window.authData = {
						token: "%s",
						user: %s
					};
					
					// Try to communicate with React Native WebView first
					function tryWebViewMessage() {
						if (window.ReactNativeWebView) {
							console.log("Sending message via ReactNativeWebView");
							window.ReactNativeWebView.postMessage(JSON.stringify({
								type: "LOGIN_SUCCESS",
								data: window.authData
							}));
							return true;
						}
						return false;
					}
					
					// Fallback: Custom URL scheme redirect for LINE app flow
					function redirectToApp() {
						const customUrl = "chatshare://auth/success?token=" + encodeURIComponent(window.authData.token) + "&user=" + encodeURIComponent(JSON.stringify(window.authData.user));
						console.log("Redirecting to app:", customUrl);
						
						// Show manual instructions immediately alongside automatic redirect attempt
						document.body.innerHTML = '<div style="padding: 20px;"><h2>✅ Login Complete</h2><p>Opening ChatShare app...</p><button onclick="window.location.href=\'' + customUrl + '\'" style="background: #00B900; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; margin-top: 20px; cursor: pointer;">Open ChatShare App</button><p style="font-size: 14px; color: #666; margin-top: 20px;">If the app doesn\'t open automatically, please tap the button above.</p></div>';
						
						// Try to redirect immediately
						window.location.href = customUrl;
					}
					
					// Try WebView message first, then fallback to custom URL
					if (!tryWebViewMessage()) {
						// Not in WebView, use custom URL scheme
						console.log("Not in WebView, using custom URL redirect");
						redirectToApp();
					} else {
						// In WebView, but also try custom URL as fallback after delay
						setTimeout(() => {
							if (window.location.href.includes('backend.chatshare.dev')) {
								console.log("Still in browser, trying custom URL redirect");
								redirectToApp();
							}
						}, 2000);
					}
				</script>
			</body>
			</html>`, user.Name, jwtToken, string(userJSON))
	} else {
		// Return JSON response for API calls
		utils.SuccessResponse(c, http.StatusOK, gin.H{
			"token": jwtToken,
			"user":  user,
		})
	}
}

func (h *AuthHandler) findOrCreateUser(ctx context.Context, email, name, avatar, provider, providerID string, emailVerified bool) (*database.User, string, error) {
	var user database.User

	err := h.db.Where("provider = ? AND provider_id = ?", provider, providerID).First(&user).Error
	if err == gorm.ErrRecordNotFound {
		// Create new user
		user = database.User{
			ID:            uuid.New(),
			Email:         email,
			EmailVerified: emailVerified,
			Name:          name,
			Avatar:        avatar,
			Provider:      provider,
			ProviderID:    providerID,
			Role:          "user",
			Status:        "active",
			LastLoginAt:   timePtr(time.Now()),
		}

		if err := h.db.Create(&user).Error; err != nil {
			return nil, "", err
		}

		// Create user in Firebase Admin
		if h.firebaseService != nil {
			firebaseUID := fmt.Sprintf("%s_%s", provider, user.ID.String())
			if err := h.firebaseService.CreateOrUpdateUser(
				ctx,
				firebaseUID,
				email,
				name,
				avatar,
				emailVerified,
			); err != nil {
				// Log error but don't fail the request
				fmt.Printf("Warning: Failed to create Firebase user: %v\n", err)
			}
		}
	} else if err != nil {
		return nil, "", err
	} else {
		// Update existing user
		now := time.Now()
		user.LastLoginAt = &now
		user.Name = name
		user.Avatar = avatar
		user.EmailVerified = emailVerified
		h.db.Save(&user)

		// Update user in Firebase Admin
		if h.firebaseService != nil {
			firebaseUID := fmt.Sprintf("%s_%s", provider, user.ID.String())
			if err := h.firebaseService.CreateOrUpdateUser(
				ctx,
				firebaseUID,
				email,
				name,
				avatar,
				emailVerified,
			); err != nil {
				// Log error but don't fail the request
				fmt.Printf("Warning: Failed to update Firebase user: %v\n", err)
			}
		}
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Email, user.Role, h.cfg.JWTSecret, h.cfg.JWTExpiration)
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var user database.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

// Logout clears the session cookie
func (h *AuthHandler) Logout(c *gin.Context) {
	utils.ClearSessionCookie(c)
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func timePtr(t time.Time) *time.Time {
	return &t
}

// isMobileWebView checks if the request is coming from a mobile WebView
func isMobileWebView(c *gin.Context) bool {
	userAgent := c.GetHeader("User-Agent")
	accept := c.GetHeader("Accept")
	
	// Check for mobile WebView patterns
	return userAgent != "" && (
		// React Native WebView
		c.GetHeader("User-Agent") != "" && 
		// Accept HTML (indicates WebView vs API call)
		(accept == "" || accept != "application/json"))
}

// AppleCallback handles Apple Sign In authentication
// POST /api/v1/auth/apple/callback
func (h *AuthHandler) AppleCallback(c *gin.Context) {
	var req struct {
		IdentityToken string  `json:"identityToken" binding:"required"`
		User          string  `json:"user" binding:"required"`
		Email         *string `json:"email"`
		FullName      string  `json:"fullName"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx := context.Background()

	// Verify the identity token with Apple's public keys
	// For production, you should validate the JWT token signature using Apple's public keys
	// For now, we'll decode it without full verification (development only)
	claims, err := h.verifyAppleToken(req.IdentityToken)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, fmt.Sprintf("Invalid Apple token: %v", err))
		return
	}

	// Extract user info from claims
	appleUserID := req.User
	email := ""
	
	// Email might be in the claims or in the request
	if emailClaim, ok := claims["email"].(string); ok && emailClaim != "" {
		email = emailClaim
	} else if req.Email != nil && *req.Email != "" {
		email = *req.Email
	} else {
		// Apple may not provide email if user chose to hide it
		// Use a placeholder email with Apple ID
		email = fmt.Sprintf("%s@privaterelay.appleid.com", appleUserID)
	}

	// Use provided full name or default
	name := req.FullName
	if name == "" {
		name = "Apple User"
	}

	// Email is always considered verified for Apple Sign In
	emailVerified := true

	// Create or update user in database and Firebase
	user, jwtToken, err := h.findOrCreateUser(
		ctx,
		email,
		name,
		"", // Apple doesn't provide avatar by default
		"apple",
		appleUserID,
		emailVerified,
	)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to process user")
		return
	}

	// Set session cookie
	isProduction := h.cfg.Environment == "production"
	utils.SetAuthCookie(c, jwtToken, isProduction)

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"token": jwtToken,
		"user":  user,
	})
}

// verifyAppleToken verifies the Apple ID token using Apple's public keys
func (h *AuthHandler) verifyAppleToken(identityToken string) (map[string]interface{}, error) {
	// Fetch Apple's public keys
	jwks, err := fetchApplePublicKeys()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch Apple public keys: %v", err)
	}

	// Parse and verify the token
	token, err := jwt.ParseWithClaims(identityToken, &AppleClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify the signing method is RS256
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Get the key ID from the token header
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("missing kid in token header")
		}

		// Find the matching public key
		for _, key := range jwks.Keys {
			if key.Kid == kid {
				return key.ToRSAPublicKey()
			}
		}

		return nil, fmt.Errorf("no matching key found for kid: %s", kid)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %v", err)
	}

	claims, ok := token.Claims.(*AppleClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Verify issuer
	if claims.Issuer != "https://appleid.apple.com" {
		return nil, fmt.Errorf("invalid issuer: %s", claims.Issuer)
	}

	// Verify audience (should match app's bundle ID / client ID)
	// Support multiple valid audiences (app bundle ID and service ID)
	validAudiences := []string{h.cfg.AppleClientID}
	if h.cfg.AppleClientID == "" {
		// If not configured, skip audience validation but log warning
		fmt.Println("Warning: APPLE_CLIENT_ID not configured, skipping audience validation")
	} else {
		audienceValid := false
		for _, aud := range claims.Audience {
			for _, validAud := range validAudiences {
				if aud == validAud {
					audienceValid = true
					break
				}
			}
		}
		if !audienceValid {
			return nil, fmt.Errorf("invalid audience: %v, expected: %v", claims.Audience, validAudiences)
		}
	}

	// Verify expiration
	if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("token has expired")
	}

	// Convert claims to map for compatibility with existing code
	claimsMap := make(map[string]interface{})
	claimsMap["sub"] = claims.Subject
	claimsMap["iss"] = claims.Issuer
	claimsMap["aud"] = claims.Audience
	claimsMap["exp"] = claims.ExpiresAt
	claimsMap["iat"] = claims.IssuedAt
	if claims.Email != "" {
		claimsMap["email"] = claims.Email
	}
	if claims.EmailVerified != nil {
		claimsMap["email_verified"] = claims.EmailVerified
	}

	return claimsMap, nil
}

// fetchApplePublicKeys fetches Apple's public keys from their JWKS endpoint
// Keys are cached for 24 hours to reduce API calls
func fetchApplePublicKeys() (*AppleJWKS, error) {
	appleJWKSCacheMu.RLock()
	if appleJWKSCache != nil && time.Since(appleJWKSCacheTime) < 24*time.Hour {
		defer appleJWKSCacheMu.RUnlock()
		return appleJWKSCache, nil
	}
	appleJWKSCacheMu.RUnlock()

	// Fetch fresh keys
	appleJWKSCacheMu.Lock()
	defer appleJWKSCacheMu.Unlock()

	// Double-check after acquiring write lock
	if appleJWKSCache != nil && time.Since(appleJWKSCacheTime) < 24*time.Hour {
		return appleJWKSCache, nil
	}

	resp, err := http.Get("https://appleid.apple.com/auth/keys")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch Apple JWKS: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Apple JWKS endpoint returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Apple JWKS response: %v", err)
	}

	var jwks AppleJWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("failed to parse Apple JWKS: %v", err)
	}

	// Cache the keys
	appleJWKSCache = &jwks
	appleJWKSCacheTime = time.Now()

	return &jwks, nil
}

// ToRSAPublicKey converts an AppleJWK to an RSA public key
func (k *AppleJWK) ToRSAPublicKey() (*rsa.PublicKey, error) {
	// Decode the modulus (n)
	nBytes, err := base64.RawURLEncoding.DecodeString(k.N)
	if err != nil {
		return nil, fmt.Errorf("failed to decode modulus: %v", err)
	}

	// Decode the exponent (e)
	eBytes, err := base64.RawURLEncoding.DecodeString(k.E)
	if err != nil {
		return nil, fmt.Errorf("failed to decode exponent: %v", err)
	}

	// Convert exponent bytes to int
	var e int
	for _, b := range eBytes {
		e = e<<8 + int(b)
	}

	// Create the RSA public key
	pubKey := &rsa.PublicKey{
		N: new(big.Int).SetBytes(nBytes),
		E: e,
	}

	return pubKey, nil
}

