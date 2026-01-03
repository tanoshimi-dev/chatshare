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

type ChatHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewChatHandler(db *gorm.DB, cfg *config.Config) *ChatHandler {
	return &ChatHandler{db: db, cfg: cfg}
}

func (h *ChatHandler) CreateChat(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		Title       string    `json:"title" binding:"required"`
		Description string    `json:"description"`
		PublicLink  string    `json:"public_link" binding:"required"`
		CategoryID  uuid.UUID `json:"category_id"`
		Keywords    []string  `json:"keywords"`
		IsPublic    bool      `json:"is_public"`
		ChatType    string    `json:"chat_type"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// Check if public link already exists
	var existing database.Chat
	if err := h.db.Where("public_link = ?", req.PublicLink).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Public link already exists")
		return
	}

	// Auto-detect chat type from URL if not provided
	chatType := req.ChatType
	if chatType == "" {
		chatType = utils.DetectChatTypeFromURL(req.PublicLink)
	}

	chat := database.Chat{
		ID:          uuid.New(),
		UserID:      userID.(uuid.UUID),
		CategoryID:  req.CategoryID,
		Title:       req.Title,
		Description: req.Description,
		PublicLink:  req.PublicLink,
		ChatType:    chatType,
		IsPublic:    req.IsPublic,
		IsLinkValid: true,
		Status:      "active",
	}

	if err := h.db.Create(&chat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create chat")
		return
	}

	// Add keywords
	if len(req.Keywords) > 0 {
		for _, keywordName := range req.Keywords {
			var keyword database.Keyword
			err := h.db.Where("name = ?", keywordName).First(&keyword).Error
			if err == gorm.ErrRecordNotFound {
				keyword = database.Keyword{
					ID:   uuid.New(),
					Name: keywordName,
					Slug: keywordName,
				}
				h.db.Create(&keyword)
			}

			chatKeyword := database.ChatKeyword{
				ID:        uuid.New(),
				ChatID:    chat.ID,
				KeywordID: keyword.ID,
			}
			h.db.Create(&chatKeyword)

			keyword.UsageCount++
			h.db.Save(&keyword)
		}
	}

	utils.SuccessResponse(c, http.StatusCreated, chat)
}

func (h *ChatHandler) GetChat(c *gin.Context) {
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var chat database.Chat
	if err := h.db.Preload("User").Preload("Category").Preload("Keywords.Keyword").First(&chat, "id = ?", chatID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
		return
	}

	// Record view
	userID, exists := c.Get("user_id")
	view := database.View{
		ID:        uuid.New(),
		ChatID:    chatID,
		IPAddress: c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
	}
	if exists {
		view.UserID = userID.(uuid.UUID)
	}
	h.db.Create(&view)

	// Update view count and last viewed
	now := time.Now()
	chat.ViewCount++
	chat.LastViewedAt = &now
	h.db.Save(&chat)

	utils.SuccessResponse(c, http.StatusOK, chat)
}

func (h *ChatHandler) ListChats(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(h.cfg.DefaultPageSize)))

	if pageSize > h.cfg.MaxPageSize {
		pageSize = h.cfg.MaxPageSize
	}

	query := h.db.Model(&database.Chat{}).Where("is_public = ? AND status = ?", true, "active")

	// Filters
	if categoryID := c.Query("category_id"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if userID := c.Query("user_id"); userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if keyword := c.Query("keyword"); keyword != "" {
		query = query.Joins("JOIN chat_keywords ON chat_keywords.chat_id = chats.id").
			Joins("JOIN keywords ON keywords.id = chat_keywords.keyword_id").
			Where("keywords.name ILIKE ?", "%"+keyword+"%")
	}

	if search := c.Query("search"); search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Filter by favorites (requires authentication)
	if favorite := c.Query("favorite"); favorite == "true" {
		userID, exists := c.Get("user_id")
		if !exists {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Authentication required")
			return
		}
		query = query.Joins("JOIN favorites ON favorites.chat_id = chats.id").
			Where("favorites.user_id = ?", userID)
	}

	// Count total
	var total int64
	query.Count(&total)

	// Pagination
	offset := (page - 1) * pageSize
	var chats []database.Chat
	if err := query.Preload("User").Preload("Category").Offset(offset).Limit(pageSize).
		Order("created_at DESC").Find(&chats).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch chats")
		return
	}

	// Mark chats as favorited if user is logged in
	userID, exists := c.Get("user_id")
	if exists {
		chatIDs := make([]uuid.UUID, len(chats))
		for i, chat := range chats {
			chatIDs[i] = chat.ID
		}

		var favorites []database.Favorite
		h.db.Where("user_id = ? AND chat_id IN ?", userID, chatIDs).Find(&favorites)

		favoriteMap := make(map[uuid.UUID]bool)
		for _, fav := range favorites {
			favoriteMap[fav.ChatID] = true
		}

		for i := range chats {
			if favoriteMap[chats[i].ID] {
				chats[i].IsFavorited = true
			}
		}
	}

	utils.PaginatedSuccessResponse(c, http.StatusOK, chats, page, pageSize, total)
}

func (h *ChatHandler) UpdateChat(c *gin.Context) {
	userID, _ := c.Get("user_id")
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var chat database.Chat
	if err := h.db.First(&chat, "id = ?", chatID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
		return
	}

	if chat.UserID != userID.(uuid.UUID) {
		utils.ErrorResponse(c, http.StatusForbidden, "Not authorized to update this chat")
		return
	}

	var req struct {
		Title       string     `json:"title"`
		Description string     `json:"description"`
		CategoryID  *uuid.UUID `json:"category_id"`
		IsPublic    *bool      `json:"is_public"`
		PublicLink  string     `json:"public_link"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	if req.Title != "" {
		chat.Title = req.Title
	}
	chat.Description = req.Description
	if req.CategoryID != nil && *req.CategoryID != uuid.Nil {
		chat.CategoryID = *req.CategoryID
	}
	// Only update IsPublic if explicitly provided
	if req.IsPublic != nil {
		chat.IsPublic = *req.IsPublic
	}
	if req.PublicLink != "" {
		chat.PublicLink = req.PublicLink
	}

	if err := h.db.Save(&chat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update chat")
		return
	}

	// Preload user and category for response
	h.db.Preload("User").Preload("Category").First(&chat, "id = ?", chat.ID)

	utils.SuccessResponse(c, http.StatusOK, chat)
}

func (h *ChatHandler) DeleteChat(c *gin.Context) {
	userID, _ := c.Get("user_id")
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var chat database.Chat
	if err := h.db.First(&chat, "id = ?", chatID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
		return
	}

	if chat.UserID != userID.(uuid.UUID) {
		utils.ErrorResponse(c, http.StatusForbidden, "Not authorized to delete this chat")
		return
	}

	if err := h.db.Delete(&chat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete chat")
		return
	}

	utils.MessageResponse(c, http.StatusOK, "Chat deleted successfully")
}

// Favorite operations
func (h *ChatHandler) AddFavorite(c *gin.Context) {
	userID, _ := c.Get("user_id")
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var chat database.Chat
	if err := h.db.First(&chat, "id = ?", chatID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
		return
	}

	// Check if already favorited
	var existing database.Favorite
	if err := h.db.Where("user_id = ? AND chat_id = ?", userID, chatID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Chat already favorited")
		return
	}

	favorite := database.Favorite{
		ID:     uuid.New(),
		UserID: userID.(uuid.UUID),
		ChatID: chatID,
	}

	if err := h.db.Create(&favorite).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to add favorite")
		return
	}

	chat.FavoriteCount++
	h.db.Save(&chat)

	utils.MessageResponse(c, http.StatusCreated, "Chat favorited successfully")
}

func (h *ChatHandler) RemoveFavorite(c *gin.Context) {
	userID, _ := c.Get("user_id")
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	result := h.db.Where("user_id = ? AND chat_id = ?", userID, chatID).Delete(&database.Favorite{})
	if result.Error != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to remove favorite")
		return
	}

	if result.RowsAffected == 0 {
		utils.ErrorResponse(c, http.StatusNotFound, "Favorite not found")
		return
	}

	var chat database.Chat
	if err := h.db.First(&chat, "id = ?", chatID).Error; err == nil {
		if chat.FavoriteCount > 0 {
			chat.FavoriteCount--
			h.db.Save(&chat)
		}
	}

	utils.MessageResponse(c, http.StatusOK, "Favorite removed successfully")
}

// Good (Like) operations
func (h *ChatHandler) AddGood(c *gin.Context) {
	userID, _ := c.Get("user_id")
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var chat database.Chat
	if err := h.db.First(&chat, "id = ?", chatID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
		return
	}

	// Check if already marked good
	var existing database.Good
	if err := h.db.Where("user_id = ? AND chat_id = ?", userID, chatID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Already marked as good")
		return
	}

	good := database.Good{
		ID:     uuid.New(),
		UserID: userID.(uuid.UUID),
		ChatID: chatID,
	}

	if err := h.db.Create(&good).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to mark as good")
		return
	}

	chat.GoodCount++
	h.db.Save(&chat)

	utils.MessageResponse(c, http.StatusCreated, "Marked as good successfully")
}

func (h *ChatHandler) RemoveGood(c *gin.Context) {
	userID, _ := c.Get("user_id")
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	result := h.db.Where("user_id = ? AND chat_id = ?", userID, chatID).Delete(&database.Good{})
	if result.Error != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to remove good")
		return
	}

	if result.RowsAffected == 0 {
		utils.ErrorResponse(c, http.StatusNotFound, "Good not found")
		return
	}

	var chat database.Chat
	if err := h.db.First(&chat, "id = ?", chatID).Error; err == nil {
		if chat.GoodCount > 0 {
			chat.GoodCount--
			h.db.Save(&chat)
		}
	}

	utils.MessageResponse(c, http.StatusOK, "Good removed successfully")
}

// Share tracking
func (h *ChatHandler) RecordShare(c *gin.Context) {
	userID, _ := c.Get("user_id")
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var req struct {
		Platform string `json:"platform" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	var chat database.Chat
	if err := h.db.First(&chat, "id = ?", chatID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
		return
	}

	share := database.Share{
		ID:       uuid.New(),
		UserID:   userID.(uuid.UUID),
		ChatID:   chatID,
		Platform: req.Platform,
	}

	if err := h.db.Create(&share).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to record share")
		return
	}

	chat.ShareCount++
	h.db.Save(&chat)

	utils.MessageResponse(c, http.StatusCreated, "Share recorded successfully")
}
