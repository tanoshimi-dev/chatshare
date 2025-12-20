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

type CommentHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewCommentHandler(db *gorm.DB, cfg *config.Config) *CommentHandler {
	return &CommentHandler{db: db, cfg: cfg}
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	userID, _ := c.Get("user_id")
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// Check if chat exists
	var chat database.Chat
	if err := h.db.First(&chat, "id = ?", chatID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
		return
	}

	comment := database.Comment{
		ID:      uuid.New(),
		ChatID:  chatID,
		UserID:  userID.(uuid.UUID),
		Content: req.Content,
		Status:  "active",
	}

	if err := h.db.Create(&comment).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create comment")
		return
	}

	// Update comment count
	chat.CommentCount++
	h.db.Save(&chat)

	utils.SuccessResponse(c, http.StatusCreated, comment)
}

func (h *CommentHandler) ListComments(c *gin.Context) {
	chatIDStr := c.Param("id")
	chatID, err := uuid.Parse(chatIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var comments []database.Comment
	if err := h.db.Preload("User").Where("chat_id = ? AND status = ?", chatID, "active").
		Order("created_at DESC").Find(&comments).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch comments")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, comments)
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
	userID, _ := c.Get("user_id")
	commentIDStr := c.Param("commentId")
	commentID, err := uuid.Parse(commentIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	var comment database.Comment
	if err := h.db.First(&comment, "id = ?", commentID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Comment not found")
		return
	}

	if comment.UserID != userID.(uuid.UUID) {
		utils.ErrorResponse(c, http.StatusForbidden, "Not authorized to delete this comment")
		return
	}

	if err := h.db.Delete(&comment).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete comment")
		return
	}

	// Update comment count
	var chat database.Chat
	if err := h.db.First(&chat, "id = ?", comment.ChatID).Error; err == nil {
		if chat.CommentCount > 0 {
			chat.CommentCount--
			h.db.Save(&chat)
		}
	}

	utils.MessageResponse(c, http.StatusOK, "Comment deleted successfully")
}
