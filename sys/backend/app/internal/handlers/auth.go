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
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db            *gorm.DB
	cfg           *config.Config
	googleConfig  *oauth2.Config
	lineConfig    *oauth2.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
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
		db:           db,
		cfg:          cfg,
		googleConfig: googleConfig,
		lineConfig:   lineConfig,
	}
}

// Google OAuth
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	state, _ := utils.GenerateRandomString(32)
	url := h.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	utils.SuccessResponse(c, http.StatusOK, gin.H{"url": url, "state": state})
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Authorization code not found")
		return
	}

	token, err := h.googleConfig.Exchange(context.Background(), code)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Failed to exchange token")
		return
	}

	client := h.googleConfig.Client(context.Background(), token)
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

	user, jwtToken, err := h.findOrCreateUser(
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

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"token": jwtToken,
		"user":  user,
	})
}

// LINE OAuth
func (h *AuthHandler) LINELogin(c *gin.Context) {
	state, _ := utils.GenerateRandomString(32)
	url := h.lineConfig.AuthCodeURL(state)
	utils.SuccessResponse(c, http.StatusOK, gin.H{"url": url, "state": state})
}

func (h *AuthHandler) LINECallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Authorization code not found")
		return
	}

	token, err := h.lineConfig.Exchange(context.Background(), code)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Failed to exchange token")
		return
	}

	client := h.lineConfig.Client(context.Background(), token)
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

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"token": jwtToken,
		"user":  user,
	})
}

func (h *AuthHandler) findOrCreateUser(email, name, avatar, provider, providerID string, emailVerified bool) (*database.User, string, error) {
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
	} else if err != nil {
		return nil, "", err
	} else {
		// Update last login
		now := time.Now()
		user.LastLoginAt = &now
		h.db.Save(&user)
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

func timePtr(t time.Time) *time.Time {
	return &t
}
