package handlers

import (
	"net/http"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CategoryHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewCategoryHandler(db *gorm.DB, cfg *config.Config) *CategoryHandler {
	return &CategoryHandler{db: db, cfg: cfg}
}

func (h *CategoryHandler) ListCategories(c *gin.Context) {
	var categories []database.Category
	if err := h.db.Where("is_active = ?", true).Order("sort_order ASC").Find(&categories).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch categories")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, categories)
}
