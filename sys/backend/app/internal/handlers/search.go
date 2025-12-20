package handlers

import (
	"net/http"
	"strconv"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
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
		Order("favorite_count DESC").
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

func (h *SearchHandler) GetRankingByGoods(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > h.cfg.MaxPageSize {
		limit = h.cfg.MaxPageSize
	}

	var chats []database.Chat
	if err := h.db.Preload("User").Preload("Category").
		Where("is_public = ? AND status = ?", true, "active").
		Order("good_count DESC").
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
