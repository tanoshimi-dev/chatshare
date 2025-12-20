package handlers

import (
	"net/http"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewUserHandler(db *gorm.DB, cfg *config.Config) *UserHandler {
	return &UserHandler{db: db, cfg: cfg}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user database.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	var user database.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Avatar != "" {
		user.Avatar = req.Avatar
	}

	if err := h.db.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

func (h *UserHandler) GetUserByID(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var user database.User
	if err := h.db.Preload("Chats").First(&user, "id = ?", userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

func (h *UserHandler) ListFavoriteUsers(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var favorites []database.FavoriteUser
	if err := h.db.Preload("TargetUser").Where("user_id = ?", userID).Find(&favorites).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch favorite users")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, favorites)
}

func (h *UserHandler) AddFavoriteUser(c *gin.Context) {
	userID, _ := c.Get("user_id")
	targetUserIDStr := c.Param("id")

	targetUserID, err := uuid.Parse(targetUserIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Check if target user exists
	var targetUser database.User
	if err := h.db.First(&targetUser, "id = ?", targetUserID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Target user not found")
		return
	}

	// Check if already favorited
	var existing database.FavoriteUser
	if err := h.db.Where("user_id = ? AND target_user_id = ?", userID, targetUserID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "User already favorited")
		return
	}

	favorite := database.FavoriteUser{
		ID:           uuid.New(),
		UserID:       userID.(uuid.UUID),
		TargetUserID: targetUserID,
	}

	if err := h.db.Create(&favorite).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to add favorite user")
		return
	}

	utils.MessageResponse(c, http.StatusCreated, "User favorited successfully")
}

func (h *UserHandler) RemoveFavoriteUser(c *gin.Context) {
	userID, _ := c.Get("user_id")
	targetUserIDStr := c.Param("id")

	targetUserID, err := uuid.Parse(targetUserIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	result := h.db.Where("user_id = ? AND target_user_id = ?", userID, targetUserID).Delete(&database.FavoriteUser{})
	if result.Error != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to remove favorite user")
		return
	}

	if result.RowsAffected == 0 {
		utils.ErrorResponse(c, http.StatusNotFound, "Favorite not found")
		return
	}

	utils.MessageResponse(c, http.StatusOK, "Favorite removed successfully")
}
