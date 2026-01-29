package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ContentFilterHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewContentFilterHandler(db *gorm.DB, cfg *config.Config) *ContentFilterHandler {
	return &ContentFilterHandler{db: db, cfg: cfg}
}

// CreateContentFilterRequest represents the request body for creating a content filter
type CreateContentFilterRequest struct {
	Keyword  string `json:"keyword" binding:"required"`
	Category string `json:"category"` // profanity, hate, spam, etc.
}

// ListContentFilters lists all content filter keywords (admin only)
func (h *ContentFilterHandler) ListContentFilters(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(h.cfg.DefaultPageSize)))
	category := c.Query("category")
	activeOnly := c.DefaultQuery("active_only", "true") == "true"

	if pageSize > h.cfg.MaxPageSize {
		pageSize = h.cfg.MaxPageSize
	}

	query := h.db.Model(&database.ContentFilter{})

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	var total int64
	query.Count(&total)

	offset := (page - 1) * pageSize
	var filters []database.ContentFilter
	if err := query.Order("keyword ASC").
		Offset(offset).Limit(pageSize).
		Find(&filters).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch content filters")
		return
	}

	utils.PaginatedSuccessResponse(c, http.StatusOK, filters, page, pageSize, total)
}

// CreateContentFilter creates a new content filter keyword (admin only)
func (h *ContentFilterHandler) CreateContentFilter(c *gin.Context) {
	var req CreateContentFilterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// Normalize keyword to lowercase
	keyword := strings.ToLower(strings.TrimSpace(req.Keyword))
	if keyword == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Keyword cannot be empty")
		return
	}

	// Check if keyword already exists
	var existing database.ContentFilter
	if err := h.db.Where("keyword = ?", keyword).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Keyword already exists")
		return
	}

	filter := database.ContentFilter{
		ID:       uuid.New(),
		Keyword:  keyword,
		Category: req.Category,
		IsActive: true,
	}

	if err := h.db.Create(&filter).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create content filter")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, filter)
}

// DeleteContentFilter removes a content filter keyword (admin only)
func (h *ContentFilterHandler) DeleteContentFilter(c *gin.Context) {
	filterIDStr := c.Param("id")
	filterID, err := uuid.Parse(filterIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid filter ID")
		return
	}

	result := h.db.Delete(&database.ContentFilter{}, "id = ?", filterID)
	if result.Error != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete content filter")
		return
	}

	if result.RowsAffected == 0 {
		utils.ErrorResponse(c, http.StatusNotFound, "Content filter not found")
		return
	}

	utils.MessageResponse(c, http.StatusOK, "Content filter deleted successfully")
}

// ToggleContentFilter enables or disables a content filter (admin only)
func (h *ContentFilterHandler) ToggleContentFilter(c *gin.Context) {
	filterIDStr := c.Param("id")
	filterID, err := uuid.Parse(filterIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid filter ID")
		return
	}

	var filter database.ContentFilter
	if err := h.db.First(&filter, "id = ?", filterID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Content filter not found")
		return
	}

	filter.IsActive = !filter.IsActive
	if err := h.db.Save(&filter).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to toggle content filter")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, filter)
}

// CheckContent checks if content contains any filtered keywords
// Returns the matched keyword if found, empty string otherwise
func (h *ContentFilterHandler) CheckContent(content string) string {
	contentLower := strings.ToLower(content)

	var filters []database.ContentFilter
	h.db.Where("is_active = ?", true).Find(&filters)

	for _, filter := range filters {
		if strings.Contains(contentLower, filter.Keyword) {
			return filter.Keyword
		}
	}

	return ""
}

// ContentFilterService provides content filtering functionality for other handlers
type ContentFilterService struct {
	db *gorm.DB
}

func NewContentFilterService(db *gorm.DB) *ContentFilterService {
	return &ContentFilterService{db: db}
}

// CheckContent checks if content contains any filtered keywords
func (s *ContentFilterService) CheckContent(content string) string {
	contentLower := strings.ToLower(content)

	var filters []database.ContentFilter
	s.db.Where("is_active = ?", true).Find(&filters)

	for _, filter := range filters {
		if strings.Contains(contentLower, filter.Keyword) {
			return filter.Keyword
		}
	}

	return ""
}
