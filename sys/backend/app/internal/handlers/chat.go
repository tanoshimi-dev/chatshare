
package handlers

import (
	"net/http"
	"net/url"
	"strconv"
	"strings"
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

// syncChatCounts updates the favorite_count for a chat based on actual records
func (h *ChatHandler) syncChatCounts(chat *database.Chat) {
	var favoriteCount int64
	h.db.Model(&database.Favorite{}).Where("chat_id = ?", chat.ID).Count(&favoriteCount)
	
	if chat.FavoriteCount != int(favoriteCount) {
		h.db.Model(&database.Chat{}).Where("id = ?", chat.ID).Updates(map[string]interface{}{
			"favorite_count": favoriteCount,
		})
		chat.FavoriteCount = int(favoriteCount)
	}
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

	// Validation 1 ChatType
	validTypes := map[string]bool{
		"chatgpt": true,
		"claude": true,
		"copilot": true,
		// "gemini": true, // Disable Gemini for now
	}
	if !validTypes[chatType] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Unknown chat type")
		return
	}

	// Validation 2 URL format
	parsedURL, err := url.ParseRequestURI(req.PublicLink)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat link URL format")
		return
	}

	// Validation 3 not localhost
	// Exclude vulnerable link registration (localhost, private IPs, file URLs)
	host := parsedURL.Hostname()
	if host == "localhost" || host == "127.0.0.1" || host == "::1" || strings.HasPrefix(host, "192.168.") || strings.HasPrefix(host, "10.") || strings.HasPrefix(host, "172.") || parsedURL.Scheme == "file" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Vulnerable or local links are not allowed")
		return
	}

	// Validation 4 accessible
	// Whitelist: skip accessibility check for trusted share URLs
	whitelistPatterns := []string{
		"https://claude.ai/share/",
		"https://copilot.microsoft.com/shares/",
		"https://chatgpt.com/share/",
		"https://gemini.google.com/share/",
	}
	skipAccessibility := false
	for _, pattern := range whitelistPatterns {
		if strings.HasPrefix(req.PublicLink, pattern) {
			skipAccessibility = true
			break
		}
	}
	if !skipAccessibility {
		client := &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 10 {
					return http.ErrUseLastResponse
				}
				req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
				req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
				req.Header.Set("Accept-Language", "en-US,en;q=0.5")
				return nil
			},
		}
		reqCheck, err := http.NewRequest("GET", req.PublicLink, nil)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Chat link is not accessible")
			return
		}
		reqCheck.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		reqCheck.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
		reqCheck.Header.Set("Accept-Language", "en-US,en;q=0.5")
		resp, err := client.Do(reqCheck)
		if err != nil || resp.StatusCode < 200 || resp.StatusCode >= 300 {
			var bodyPreview string
			if resp != nil && resp.Body != nil {
				buf := make([]byte, 1024)
				n, _ := resp.Body.Read(buf)
				bodyPreview = string(buf[:n])
			}
			msg := "Chat link is not accessible.\nURL: " + req.PublicLink + "\nStatus: "
			if resp != nil {
				msg += http.StatusText(resp.StatusCode) + " (" + strconv.Itoa(resp.StatusCode) + ")"
			} else {
				msg += "No response received"
			}
			if bodyPreview != "" {
				msg += "\nResponse preview: " + bodyPreview
			}
			utils.ErrorResponse(c, http.StatusBadRequest, msg)
			return
		}
		if resp != nil {
			resp.Body.Close()
		}
	}

	// Validation 5 protocol is https
	if parsedURL.Scheme != "https" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Only HTTPS links are allowed")
		return
	}

	// Validation 6 top-level service URLs
	// Block top-level service URLs (not user-created public links)
	topLevelInvalid := map[string]struct{}{
		"https://copilot.microsoft.com/": {},
		"https://gemini.google.com/app": {},
		"https://chatgpt.com/": {},
		"https://claude.ai/new": {},
	}
	// Normalize input URL for comparison (strip trailing slash)
	normalized := req.PublicLink
	if strings.HasSuffix(normalized, "/") {
		normalized = normalized[:len(normalized)-1]
	}
	for k := range topLevelInvalid {
		kNorm := k
		if strings.HasSuffix(kNorm, "/") {
			kNorm = kNorm[:len(kNorm)-1]
		}
		if normalized == kNorm {
			utils.ErrorResponse(c, http.StatusBadRequest, "Top-level service URLs are not allowed. Please provide a user-created public link.")
			return
		}
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

	// Sync counts to ensure accuracy
	h.syncChatCounts(&chat)

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
		query = query.Where("id IN (?)", 
			h.db.Table("chat_keywords").
				Select("chat_keywords.chat_id").
				Joins("JOIN keywords ON keywords.id = chat_keywords.keyword_id").
				Where("keywords.name ILIKE ?", "%"+keyword+"%"))
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
		query = query.Where("id IN (?)",
			h.db.Table("favorites").
				Select("chat_id").
				Where("user_id = ?", userID))
	}

	// Filter by goods (requires authentication)
	if good := c.Query("good"); good == "true" {
		userID, exists := c.Get("user_id")
		if !exists {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Authentication required")
			return
		}
		query = query.Where("id IN (?)",
			h.db.Table("goods").
				Select("chat_id").
				Where("user_id = ?", userID))
	}

	// Count total
	var total int64
	query.Count(&total)

	// Pagination
	offset := (page - 1) * pageSize
	var chats []database.Chat
	if err := query.Select("chats.*").Preload("User").Preload("Category").Offset(offset).Limit(pageSize).
		Order("created_at DESC").Find(&chats).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch chats")
		return
	}

	// Mark chats as favorited if user is logged in
	userID, exists := c.Get("user_id")
	var favoriteUsers []database.FavoriteUser
	h.db.Where("user_id = ?", userID).Find(&favoriteUsers)

	favoriteUserMap := make(map[uuid.UUID]bool)
	for _, fav := range favoriteUsers {
		favoriteUserMap[fav.TargetUserID] = true
	}


	if exists {
		chatIDs := make([]uuid.UUID, len(chats))
		for i, chat := range chats {
			chatIDs[i] = chat.ID
		}

		var goods []database.Good
		h.db.Where("user_id = ? AND chat_id IN ?", userID, chatIDs).Find(&goods)

		goodMap := make(map[uuid.UUID]bool)
		for _, good := range goods {
			goodMap[good.ChatID] = true
		}

		for i := range chats {
			if goodMap[chats[i].ID] {
				chats[i].IsGooded = true
			}
		}


		for i := range chats {
			if favoriteUserMap[chats[i].UserID] {
				chats[i].IsFavorited = true
			}
		}

	}

	// Fetch FavoritedCount for all users in a single query
	userIDs := make([]uuid.UUID, 0, len(chats))
	userIDSet := make(map[uuid.UUID]bool)
	for _, chat := range chats {
		if !userIDSet[chat.UserID] {
			userIDs = append(userIDs, chat.UserID)
			userIDSet[chat.UserID] = true
		}
	}

	if len(userIDs) > 0 {
		type UserFavCount struct {
			TargetUserID uuid.UUID
			Count        int64
		}
		var userFavCounts []UserFavCount
		h.db.Model(&database.FavoriteUser{}).
			Select("target_user_id, COUNT(*) as count").
			Where("target_user_id IN ?", userIDs).
			Group("target_user_id").
			Scan(&userFavCounts)

		favCountMap := make(map[uuid.UUID]int)
		for _, ufc := range userFavCounts {
			favCountMap[ufc.TargetUserID] = int(ufc.Count)
		}

		for i := range chats {
			chats[i].User.FavoritedCount = favCountMap[chats[i].UserID]
		}
	}

	// Mark chats as favorited if user is logged in
	// if exists {
	// 	chatIDs := make([]uuid.UUID, len(chats))
	// 	for i, chat := range chats {
	// 		chatIDs[i] = chat.ID
	// 	}

	// 	var favorites []database.Favorite
	// 	h.db.Where("user_id = ? AND chat_id IN ?", userID, chatIDs).Find(&favorites)

	// 	favoriteMap := make(map[uuid.UUID]bool)
	// 	for _, fav := range favorites {
	// 		favoriteMap[fav.ChatID] = true
	// 	}

	// 	for i := range chats {
	// 		if favoriteMap[chats[i].ID] {
	// 			chats[i].IsFavorited = true
	// 		}
	// 	}
	// }

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

	       // Delete related favorites (not logical delete)
		       if err := h.db.Where("chat_id = ?", chatID).Delete(&database.Favorite{}).Error; err != nil {
			       utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete related favorites")
			       return
		       }

		       // Hard delete (physical delete) the chat record
		       if err := h.db.Unscoped().Delete(&chat).Error; err != nil {
			       utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete chat")
			       return
		       }

		       utils.MessageResponse(c, http.StatusOK, "Chat and related favorites deleted successfully")
}

// Good operations
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

	// Check if already gooded
	var existing database.Good
	if err := h.db.Where("user_id = ? AND chat_id = ?", userID, chatID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Chat already gooded")
		return
	}

	good := database.Good{
		ID:     uuid.New(),
		UserID: userID.(uuid.UUID),
		ChatID: chatID,
	}

	if err := h.db.Create(&good).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to add good")
		return
	}

	// Update good count by counting actual records
	var count int64
	h.db.Model(&database.Good{}).Where("chat_id = ?", chatID).Count(&count)
	h.db.Model(&database.Chat{}).Where("id = ?", chatID).Updates(map[string]interface{}{
		"good_count": count,
	})

	utils.MessageResponse(c, http.StatusCreated, "Chat gooded successfully")
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
		// Update good count by counting actual records
		var count int64
		h.db.Model(&database.Good{}).Where("chat_id = ?", chatID).Count(&count)
		h.db.Model(&database.Chat{}).Where("id = ?", chatID).Updates(map[string]interface{}{
			"good_count": count,
		})
	}

	utils.MessageResponse(c, http.StatusOK, "Good removed successfully")
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

	// Update favorite count by counting actual records
	var count int64
	h.db.Model(&database.Favorite{}).Where("chat_id = ?", chatID).Count(&count)
	h.db.Model(&database.Chat{}).Where("id = ?", chatID).Updates(map[string]interface{}{
		"favorite_count": count,
	})

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
		// Update favorite count by counting actual records
		var count int64
		h.db.Model(&database.Favorite{}).Where("chat_id = ?", chatID).Count(&count)
		h.db.Model(&database.Chat{}).Where("id = ?", chatID).Updates(map[string]interface{}{
			"favorite_count": count,
		})
	}

	utils.MessageResponse(c, http.StatusOK, "Favorite removed successfully")
}

// FavoriteUsers operations
func (h *ChatHandler) AddFavoriteUser(c *gin.Context) {
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

	targetUserID := chat.UserID
	// Check if already favorited user
	var existing database.FavoriteUser
	if err := h.db.Where("user_id = ? AND target_user_id = ?", userID, targetUserID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Chat already favorited")
		return
	}

	favoriteUser := database.FavoriteUser{
		ID:           uuid.New(),
		UserID:       userID.(uuid.UUID),
		TargetUserID: targetUserID,
	}

	if err := h.db.Create(&favoriteUser).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to add favorite user")
		return
	}

	// Update favorite user count by counting actual records
	var count int64
	h.db.Model(&database.FavoriteUser{}).Where("target_user_id = ?", targetUserID).Count(&count)
	h.db.Model(&database.User{}).Where("id = ?", targetUserID).Updates(map[string]interface{}{
		"favorited_count": count,
	})

	utils.MessageResponse(c, http.StatusCreated, "User favorited successfully")
}

func (h *ChatHandler) RemoveFavoriteUser(c *gin.Context) {
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

	targetUserID := chat.UserID
	result := h.db.Where("user_id = ? AND target_user_id = ?", userID, targetUserID).Delete(&database.FavoriteUser{})
	if result.Error != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to remove favorite")
		return
	}

	if result.RowsAffected == 0 {
		utils.ErrorResponse(c, http.StatusNotFound, "Favorite not found")
		return
	}

	if err := h.db.First(&chat, "id = ?", chatID).Error; err == nil {
		// Update favorited_count on the target user by counting FavoriteUser records
		var count int64
		targetUserID := chat.UserID
		h.db.Model(&database.FavoriteUser{}).Where("target_user_id = ?", targetUserID).Count(&count)
		h.db.Model(&database.User{}).Where("id = ?", targetUserID).Updates(map[string]interface{}{
			"favorited_count": count,
		})
	}

	utils.MessageResponse(c, http.StatusOK, "Favorite removed successfully")
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
