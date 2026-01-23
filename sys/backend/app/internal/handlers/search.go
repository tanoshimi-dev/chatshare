package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SearchHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewSearchHandler(db *gorm.DB, cfg *config.Config) *SearchHandler {
	return &SearchHandler{db: db, cfg: cfg}
}

func (h *SearchHandler) SearchChats(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Search query required")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(h.cfg.DefaultPageSize)))

	if pageSize > h.cfg.MaxPageSize {
		pageSize = h.cfg.MaxPageSize
	}

	dbQuery := h.db.Model(&database.Chat{}).
		Where("is_public = ? AND status = ?", true, "active").
		Where("title ILIKE ? OR description ILIKE ?", "%"+query+"%", "%"+query+"%")

	// Additional filters
	if categoryID := c.Query("category_id"); categoryID != "" {
		dbQuery = dbQuery.Where("category_id = ?", categoryID)
	}

	if userID := c.Query("user_id"); userID != "" {
		dbQuery = dbQuery.Where("user_id = ?", userID)
	}

	// Count total
	var total int64
	dbQuery.Count(&total)

	// Pagination
	offset := (page - 1) * pageSize
	var chats []database.Chat
	if err := dbQuery.Preload("User").Preload("Category").Preload("Keywords.Keyword").
		Offset(offset).Limit(pageSize).
		Order("view_count DESC, created_at DESC").
		Find(&chats).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to search chats")
		return
	}

	utils.PaginatedSuccessResponse(c, http.StatusOK, chats, page, pageSize, total)
}

func (h *SearchHandler) GetRankingByFavorites(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > h.cfg.MaxPageSize {
		limit = h.cfg.MaxPageSize
	}

	var chats []database.Chat
	if err := h.db.Preload("User").Preload("Category").
		Where("is_public = ? AND status = ?", true, "active").
		Order("favorite_count DESC, created_at DESC").
		Limit(limit).
		Find(&chats).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch ranking")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, chats)
}

func (h *SearchHandler) GetRankingByShares(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > h.cfg.MaxPageSize {
		limit = h.cfg.MaxPageSize
	}

	var chats []database.Chat
	if err := h.db.Preload("User").Preload("Category").
		Where("is_public = ? AND status = ?", true, "active").
		Order("share_count DESC").
		Limit(limit).
		Find(&chats).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch ranking")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, chats)
}

func (h *SearchHandler) GetRankingByComments(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > h.cfg.MaxPageSize {
		limit = h.cfg.MaxPageSize
	}

	var chats []database.Chat
	if err := h.db.Preload("User").Preload("Category").
		Where("is_public = ? AND status = ?", true, "active").
		Order("comment_count DESC").
		Limit(limit).
		Find(&chats).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch ranking")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, chats)
}

func (h *SearchHandler) GetRankingByViews(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > h.cfg.MaxPageSize {
		limit = h.cfg.MaxPageSize
	}

	var chats []database.Chat
	if err := h.db.Preload("User").Preload("Category").
		Where("is_public = ? AND status = ?", true, "active").
		Order("view_count DESC").
		Limit(limit).
		Find(&chats).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch ranking")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, chats)
}

func (h *SearchHandler) GetPopularKeywords(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit > 100 {
		limit = 100
	}

	var keywords []database.Keyword
	if err := h.db.Order("usage_count DESC").Limit(limit).Find(&keywords).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch keywords")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, keywords)
}

// AdvancedSearchChats - Advanced search with multiple filters
// Supports: category, chat_type, date range (date_from, date_to), user_id
func (h *SearchHandler) AdvancedSearchChats(c *gin.Context) {
	// Get search query (optional for advanced search)
	query := c.Query("q")
	
	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(h.cfg.DefaultPageSize)))

	if pageSize > h.cfg.MaxPageSize {
		pageSize = h.cfg.MaxPageSize
	}

	// Base query
	dbQuery := h.db.Model(&database.Chat{}).
		Where("is_public = ? AND status = ?", true, "active")

	// Text search (optional)
	if query != "" {
		dbQuery = dbQuery.Where("title ILIKE ? OR description ILIKE ?", "%"+query+"%", "%"+query+"%")
	}

	// Filter by Category (カテゴリ)
	if categoryID := c.Query("category_id"); categoryID != "" {
		if _, err := uuid.Parse(categoryID); err == nil {
			dbQuery = dbQuery.Where("category_id = ?", categoryID)
		}
	}

	// Filter by Chat Type (チャットタイプ)
	if chatType := c.Query("chat_type"); chatType != "" {
		validTypes := map[string]bool{
			"chatgpt": true,
			"claude":  true,
			"copilot": true,
			"gemini":  true,
		}
		if validTypes[chatType] {
			dbQuery = dbQuery.Where("chat_type = ?", chatType)
		}
	}

	// Filter by Date Range (日付範囲)
	if dateFrom := c.Query("date_from"); dateFrom != "" {
		if t, err := time.Parse("2006-01-02", dateFrom); err == nil {
			dbQuery = dbQuery.Where("created_at >= ?", t)
		}
	}
	if dateTo := c.Query("date_to"); dateTo != "" {
		if t, err := time.Parse("2006-01-02", dateTo); err == nil {
			// Add 1 day to include the entire day
			t = t.Add(24 * time.Hour)
			dbQuery = dbQuery.Where("created_at < ?", t)
		}
	}

	// Filter by User (ユーザー)
	if userID := c.Query("user_id"); userID != "" {
		if _, err := uuid.Parse(userID); err == nil {
			dbQuery = dbQuery.Where("user_id = ?", userID)
		}
	}

	// Sort options
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")
	
	var orderClause string
	switch sortBy {
	case "view_count":
		orderClause = "view_count"
	case "favorite_count":
		orderClause = "favorite_count"
	case "share_count":
		orderClause = "share_count"
	case "comment_count":
		orderClause = "comment_count"
	default:
		orderClause = "created_at"
	}

	if sortOrder == "asc" {
		orderClause += " ASC"
	} else {
		orderClause += " DESC"
	}

	// Count total
	var total int64
	dbQuery.Count(&total)

	// Pagination
	offset := (page - 1) * pageSize
	var chats []database.Chat
	if err := dbQuery.Preload("User").Preload("Category").Preload("Keywords.Keyword").
		Offset(offset).Limit(pageSize).
		Order(orderClause).
		Find(&chats).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to search chats")
		return
	}

	utils.PaginatedSuccessResponse(c, http.StatusOK, chats, page, pageSize, total)
}
