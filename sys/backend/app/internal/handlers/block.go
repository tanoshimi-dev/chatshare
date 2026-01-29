package handlers

import (
	"net/http"
	"strconv"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/services"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BlockHandler struct {
	db           *gorm.DB
	cfg          *config.Config
	emailService *services.EmailService
}

func NewBlockHandler(db *gorm.DB, cfg *config.Config, emailService *services.EmailService) *BlockHandler {
	return &BlockHandler{db: db, cfg: cfg, emailService: emailService}
}

// BlockUserRequest represents the request body for blocking a user
type BlockUserRequest struct {
	Reason string `json:"reason"`
}

// BlockUser blocks a user
func (h *BlockHandler) BlockUser(c *gin.Context) {
	userID, _ := c.Get("user_id")
	blockedIDStr := c.Param("id")

	blockedID, err := uuid.Parse(blockedIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Prevent self-blocking
	if blockedID == userID.(uuid.UUID) {
		utils.ErrorResponse(c, http.StatusBadRequest, "You cannot block yourself")
		return
	}

	// Check if user exists
	var blockedUser database.User
	if err := h.db.First(&blockedUser, "id = ?", blockedID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	// Check if already blocked
	var existing database.BlockedUser
	if err := h.db.Where("blocker_id = ? AND blocked_id = ?", userID, blockedID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "User is already blocked")
		return
	}

	var req BlockUserRequest
	c.ShouldBindJSON(&req) // Optional reason

	// Get blocker info
	var blocker database.User
	h.db.First(&blocker, "id = ?", userID.(uuid.UUID))

	block := database.BlockedUser{
		ID:        uuid.New(),
		BlockerID: userID.(uuid.UUID),
		BlockedID: blockedID,
		Reason:    req.Reason,
	}

	if err := h.db.Create(&block).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to block user")
		return
	}

	// Send admin notification
	go h.emailService.SendBlockNotification(blocker.Email, blockedUser.Email, req.Reason)

	utils.MessageResponse(c, http.StatusCreated, "User blocked successfully")
}

// UnblockUser unblocks a user
func (h *BlockHandler) UnblockUser(c *gin.Context) {
	userID, _ := c.Get("user_id")
	blockedIDStr := c.Param("id")

	blockedID, err := uuid.Parse(blockedIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	result := h.db.Where("blocker_id = ? AND blocked_id = ?", userID, blockedID).Delete(&database.BlockedUser{})
	if result.Error != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to unblock user")
		return
	}

	if result.RowsAffected == 0 {
		utils.ErrorResponse(c, http.StatusNotFound, "User is not blocked")
		return
	}

	utils.MessageResponse(c, http.StatusOK, "User unblocked successfully")
}

// ListBlockedUsers lists all users blocked by the current user
func (h *BlockHandler) ListBlockedUsers(c *gin.Context) {
	userID, _ := c.Get("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(h.cfg.DefaultPageSize)))

	if pageSize > h.cfg.MaxPageSize {
		pageSize = h.cfg.MaxPageSize
	}

	query := h.db.Model(&database.BlockedUser{}).Where("blocker_id = ?", userID)

	var total int64
	query.Count(&total)

	offset := (page - 1) * pageSize
	var blockedUsers []database.BlockedUser
	if err := query.Preload("Blocked").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&blockedUsers).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch blocked users")
		return
	}

	utils.PaginatedSuccessResponse(c, http.StatusOK, blockedUsers, page, pageSize, total)
}

// GetBlockedUserIDs returns a list of blocked user IDs for the current user
// This is useful for client-side filtering
func (h *BlockHandler) GetBlockedUserIDs(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var blockedIDs []uuid.UUID
	if err := h.db.Model(&database.BlockedUser{}).
		Where("blocker_id = ?", userID).
		Pluck("blocked_id", &blockedIDs).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch blocked user IDs")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, blockedIDs)
}

// IsUserBlocked checks if a specific user is blocked by the current user
func (h *BlockHandler) IsUserBlocked(c *gin.Context) {
	userID, _ := c.Get("user_id")
	targetIDStr := c.Param("id")

	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var existing database.BlockedUser
	isBlocked := h.db.Where("blocker_id = ? AND blocked_id = ?", userID, targetID).First(&existing).Error == nil

	utils.SuccessResponse(c, http.StatusOK, gin.H{"blocked": isBlocked})
}
