package handlers

import (
	"net/http"
	"time"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ToSHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewToSHandler(db *gorm.DB, cfg *config.Config) *ToSHandler {
	return &ToSHandler{db: db, cfg: cfg}
}

// ToSStatusResponse represents the ToS acceptance status
type ToSStatusResponse struct {
	Accepted       bool       `json:"accepted"`
	CurrentVersion string     `json:"current_version"`
	AcceptedAt     *time.Time `json:"accepted_at,omitempty"`
	AcceptedVersion string    `json:"accepted_version,omitempty"`
}

// GetToSStatus checks if the user has accepted the current ToS version
func (h *ToSHandler) GetToSStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user database.User
	if err := h.db.First(&user, "id = ?", userID.(uuid.UUID)).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	currentVersion := h.cfg.ToSVersion
	accepted := user.ToSAcceptedAt != nil && user.ToSVersion == currentVersion

	response := ToSStatusResponse{
		Accepted:        accepted,
		CurrentVersion:  currentVersion,
		AcceptedAt:      user.ToSAcceptedAt,
		AcceptedVersion: user.ToSVersion,
	}

	utils.SuccessResponse(c, http.StatusOK, response)
}

// AcceptToS marks the current ToS as accepted by the user
func (h *ToSHandler) AcceptToS(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user database.User
	if err := h.db.First(&user, "id = ?", userID.(uuid.UUID)).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	now := time.Now()
	currentVersion := h.cfg.ToSVersion

	user.ToSAcceptedAt = &now
	user.ToSVersion = currentVersion

	if err := h.db.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save ToS acceptance")
		return
	}

	response := ToSStatusResponse{
		Accepted:        true,
		CurrentVersion:  currentVersion,
		AcceptedAt:      &now,
		AcceptedVersion: currentVersion,
	}

	utils.SuccessResponse(c, http.StatusOK, response)
}
