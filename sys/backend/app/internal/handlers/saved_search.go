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

type SavedSearchHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewSavedSearchHandler(db *gorm.DB, cfg *config.Config) *SavedSearchHandler {
	return &SavedSearchHandler{db: db, cfg: cfg}
}

// CreateSavedSearch saves a new search setting
func (h *SavedSearchHandler) CreateSavedSearch(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		Name       string     `json:"name" binding:"required"`
		CategoryID *uuid.UUID `json:"category_id"`
		ChatType   string     `json:"chat_type"`
		DateFrom   *string    `json:"date_from"` // ISO date string
		DateTo     *string    `json:"date_to"`   // ISO date string
		SortBy     string     `json:"sort_by"`
		SortOrder  string     `json:"sort_order"`
		IsDefault  bool       `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// Parse dates if provided
	var dateFrom, dateTo *time.Time
	if req.DateFrom != nil && *req.DateFrom != "" {
		if t, err := time.Parse("2006-01-02", *req.DateFrom); err == nil {
			dateFrom = &t
		}
	}
	if req.DateTo != nil && *req.DateTo != "" {
		if t, err := time.Parse("2006-01-02", *req.DateTo); err == nil {
			dateTo = &t
		}
	}

	// If setting as default, unset all other defaults for this user
	if req.IsDefault {
		h.db.Model(&database.SavedSearchSetting{}).
			Where("user_id = ? AND is_default = ?", userID, true).
			Update("is_default", false)
	}

	savedSearch := database.SavedSearchSetting{
		UserID:     userID.(uuid.UUID),
		Name:       req.Name,
		CategoryID: req.CategoryID,
		ChatType:   req.ChatType,
		DateFrom:   dateFrom,
		DateTo:     dateTo,
		SortBy:     req.SortBy,
		SortOrder:  req.SortOrder,
		IsDefault:  req.IsDefault,
	}

	if err := h.db.Create(&savedSearch).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save search setting")
		return
	}

	// Load relationships
	h.db.Preload("Category").First(&savedSearch, savedSearch.ID)

	utils.SuccessResponse(c, http.StatusCreated, savedSearch)
}

// ListSavedSearches returns all saved searches for the current user
func (h *SavedSearchHandler) ListSavedSearches(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var savedSearches []database.SavedSearchSetting
	if err := h.db.Preload("Category").
		Where("user_id = ?", userID).
		Order("is_default DESC, created_at DESC").
		Find(&savedSearches).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch saved searches")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, savedSearches)
}

// GetSavedSearch returns a specific saved search
func (h *SavedSearchHandler) GetSavedSearch(c *gin.Context) {
	userID, _ := c.Get("user_id")
	searchID := c.Param("id")

	var savedSearch database.SavedSearchSetting
	if err := h.db.Preload("Category").
		Where("id = ? AND user_id = ?", searchID, userID).
		First(&savedSearch).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.ErrorResponse(c, http.StatusNotFound, "Saved search not found")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch saved search")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, savedSearch)
}

// UpdateSavedSearch updates an existing saved search
func (h *SavedSearchHandler) UpdateSavedSearch(c *gin.Context) {
	userID, _ := c.Get("user_id")
	searchID := c.Param("id")

	var savedSearch database.SavedSearchSetting
	if err := h.db.Where("id = ? AND user_id = ?", searchID, userID).
		First(&savedSearch).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.ErrorResponse(c, http.StatusNotFound, "Saved search not found")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch saved search")
		return
	}

	var req struct {
		Name       *string    `json:"name"`
		CategoryID *uuid.UUID `json:"category_id"`
		ChatType   *string    `json:"chat_type"`
		DateFrom   *string    `json:"date_from"`
		DateTo     *string    `json:"date_to"`
		SortBy     *string    `json:"sort_by"`
		SortOrder  *string    `json:"sort_order"`
		IsDefault  *bool      `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// If setting as default, unset all other defaults for this user
	if req.IsDefault != nil && *req.IsDefault {
		h.db.Model(&database.SavedSearchSetting{}).
			Where("user_id = ? AND id != ? AND is_default = ?", userID, searchID, true).
			Update("is_default", false)
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.CategoryID != nil {
		updates["category_id"] = *req.CategoryID
	}
	if req.ChatType != nil {
		updates["chat_type"] = *req.ChatType
	}
	if req.DateFrom != nil {
		if *req.DateFrom == "" {
			updates["date_from"] = nil
		} else if t, err := time.Parse("2006-01-02", *req.DateFrom); err == nil {
			updates["date_from"] = t
		}
	}
	if req.DateTo != nil {
		if *req.DateTo == "" {
			updates["date_to"] = nil
		} else if t, err := time.Parse("2006-01-02", *req.DateTo); err == nil {
			updates["date_to"] = t
		}
	}
	if req.SortBy != nil {
		updates["sort_by"] = *req.SortBy
	}
	if req.SortOrder != nil {
		updates["sort_order"] = *req.SortOrder
	}
	if req.IsDefault != nil {
		updates["is_default"] = *req.IsDefault
	}

	if err := h.db.Model(&savedSearch).Updates(updates).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update saved search")
		return
	}

	// Reload with relationships
	h.db.Preload("Category").First(&savedSearch, savedSearch.ID)

	utils.SuccessResponse(c, http.StatusOK, savedSearch)
}

// DeleteSavedSearch deletes a saved search
func (h *SavedSearchHandler) DeleteSavedSearch(c *gin.Context) {
	userID, _ := c.Get("user_id")
	searchID := c.Param("id")

	result := h.db.Where("id = ? AND user_id = ?", searchID, userID).
		Delete(&database.SavedSearchSetting{})

	if result.Error != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete saved search")
		return
	}

	if result.RowsAffected == 0 {
		utils.ErrorResponse(c, http.StatusNotFound, "Saved search not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "Saved search deleted successfully"})
}

// GetDefaultSearch returns the user's default saved search
func (h *SavedSearchHandler) GetDefaultSearch(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var savedSearch database.SavedSearchSetting
	if err := h.db.Preload("Category").
		Where("user_id = ? AND is_default = ?", userID, true).
		First(&savedSearch).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.ErrorResponse(c, http.StatusNotFound, "No default search setting found")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch default search")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, savedSearch)
}
