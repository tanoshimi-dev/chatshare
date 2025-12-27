package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/firebase"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

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
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	// Parse request body
	var req struct {
		Code  string `json:"code" binding:"required"`
		State string `json:"state" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate state token
	ctx := context.Background()
	valid, err := h.sessionStore.ValidateAndDeleteState(ctx, req.State)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to validate state")
		return
	}
	if !valid {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired state token")
		return
	}

	// Exchange authorization code for token
	token, err := h.googleConfig.Exchange(ctx, req.Code)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Failed to exchange token")
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

	// Return format matching the guide
	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"url":   url,
		"state": state,
	})
}

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

	// Validate state token
	ctx := context.Background()
	valid, err := h.sessionStore.ValidateAndDeleteState(ctx, req.State)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to validate state")
		return
	}
	if !valid {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired state token")
		return
	}

	// Exchange code for token
	token, err := h.lineConfig.Exchange(ctx, req.Code)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Failed to exchange token")
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

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"token": jwtToken,
		"user":  user,
	})
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
