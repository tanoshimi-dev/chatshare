package handlers

import (
	"net/http"
	"strconv"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAdminHandler(db *gorm.DB, cfg *config.Config) *AdminHandler {
	return &AdminHandler{db: db, cfg: cfg}
}

// User management
func (h *AdminHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(h.cfg.DefaultPageSize)))

	if pageSize > h.cfg.MaxPageSize {
		pageSize = h.cfg.MaxPageSize
	}

	query := h.db.Model(&database.User{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}

	var total int64
	query.Count(&total)

	offset := (page - 1) * pageSize
	var users []database.User
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&users).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	utils.PaginatedSuccessResponse(c, http.StatusOK, users, page, pageSize, total)
}

func (h *AdminHandler) UpdateUserStatus(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
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

	user.Status = req.Status
	if err := h.db.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update user status")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
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

	user.Role = req.Role
	if err := h.db.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update user role")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

// Chat management
func (h *AdminHandler) ListAllChats(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(h.cfg.DefaultPageSize)))

	if pageSize > h.cfg.MaxPageSize {
		pageSize = h.cfg.MaxPageSize
	}

	query := h.db.Model(&database.Chat{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	offset := (page - 1) * pageSize
	var chats []database.Chat
	if err := query.Preload("User").Preload("Category").Offset(offset).Limit(pageSize).
		Order("created_at DESC").Find(&chats).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch chats")
		return
	}

	utils.PaginatedSuccessResponse(c, http.StatusOK, chats, page, pageSize, total)
}

func (h *AdminHandler) UpdateChatStatus(c *gin.Context) {
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
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

	chat.Status = req.Status
	if err := h.db.Save(&chat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update chat status")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, chat)
}

func (h *AdminHandler) DeleteChatByAdmin(c *gin.Context) {
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

	if err := h.db.Delete(&chat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete chat")
		return
	}

	utils.MessageResponse(c, http.StatusOK, "Chat deleted successfully")
}

// Category management
func (h *AdminHandler) CreateCategory(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Slug        string `json:"slug" binding:"required"`
		Description string `json:"description"`
		Icon        string `json:"icon"`
		Color       string `json:"color"`
		SortOrder   int    `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	category := database.Category{
		ID:          uuid.New(),
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		Icon:        req.Icon,
		Color:       req.Color,
		SortOrder:   req.SortOrder,
		IsActive:    true,
	}

	if err := h.db.Create(&category).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create category")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, category)
}

func (h *AdminHandler) UpdateCategory(c *gin.Context) {
	categoryIDStr := c.Param("id")
	categoryID, err := uuid.Parse(categoryIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var req struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
		Icon        string `json:"icon"`
		Color       string `json:"color"`
		SortOrder   int    `json:"sort_order"`
		IsActive    bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	var category database.Category
	if err := h.db.First(&category, "id = ?", categoryID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Category not found")
		return
	}

	if req.Name != "" {
		category.Name = req.Name
	}
	if req.Slug != "" {
		category.Slug = req.Slug
	}
	category.Description = req.Description
	category.Icon = req.Icon
	category.Color = req.Color
	category.SortOrder = req.SortOrder
	category.IsActive = req.IsActive

	if err := h.db.Save(&category).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update category")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, category)
}

func (h *AdminHandler) DeleteCategory(c *gin.Context) {
	categoryIDStr := c.Param("id")
	categoryID, err := uuid.Parse(categoryIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid category ID")
		return
	}

	if err := h.db.Delete(&database.Category{}, "id = ?", categoryID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete category")
		return
	}

	utils.MessageResponse(c, http.StatusOK, "Category deleted successfully")
}

// Activity monitoring
func (h *AdminHandler) GetUserActivity(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var user database.User
	if err := h.db.Preload("Chats").Preload("Favorites").Preload("Comments").
		First(&user, "id = ?", userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	var views []database.View
	h.db.Where("user_id = ?", userID).Order("created_at DESC").Limit(50).Find(&views)

	var shares []database.Share
	h.db.Where("user_id = ?", userID).Order("created_at DESC").Limit(50).Find(&shares)

	activityData := gin.H{
		"user":           user,
		"recent_views":   views,
		"recent_shares":  shares,
		"total_chats":    len(user.Chats),
		"total_favorites": len(user.Favorites),
		"total_comments": len(user.Comments),
	}

	utils.SuccessResponse(c, http.StatusOK, activityData)
}

// Statistics
func (h *AdminHandler) GetStatistics(c *gin.Context) {
	var totalUsers int64
	h.db.Model(&database.User{}).Count(&totalUsers)

	var activeUsers int64
	h.db.Model(&database.User{}).Where("status = ?", "active").Count(&activeUsers)

	var totalChats int64
	h.db.Model(&database.Chat{}).Count(&totalChats)

	var publicChats int64
	h.db.Model(&database.Chat{}).Where("is_public = ?", true).Count(&publicChats)

	var totalViews int64
	h.db.Model(&database.View{}).Count(&totalViews)

	var totalComments int64
	h.db.Model(&database.Comment{}).Count(&totalComments)

	stats := gin.H{
		"total_users":    totalUsers,
		"active_users":   activeUsers,
		"total_chats":    totalChats,
		"public_chats":   publicChats,
		"total_views":    totalViews,
		"total_comments": totalComments,
	}

	utils.SuccessResponse(c, http.StatusOK, stats)
}
