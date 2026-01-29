package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/services"
	"github.com/chatshare/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReportHandler struct {
	db           *gorm.DB
	cfg          *config.Config
	emailService *services.EmailService
}

func NewReportHandler(db *gorm.DB, cfg *config.Config, emailService *services.EmailService) *ReportHandler {
	return &ReportHandler{db: db, cfg: cfg, emailService: emailService}
}

// CreateReportRequest represents the request body for creating a report
type CreateReportRequest struct {
	ContentType string `json:"content_type" binding:"required"` // chat, comment
	ContentID   string `json:"content_id" binding:"required"`
	Reason      string `json:"reason" binding:"required"`
	Description string `json:"description"`
}

// CreateReport creates a new content report
func (h *ReportHandler) CreateReport(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req CreateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// Validate content type
	validContentTypes := map[string]bool{"chat": true, "comment": true}
	if !validContentTypes[req.ContentType] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid content type. Must be 'chat' or 'comment'")
		return
	}

	contentID, err := uuid.Parse(req.ContentID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid content ID")
		return
	}

	// Get the reported user ID based on content type
	var reportedUserID uuid.UUID
	var reportedEmail string

	if req.ContentType == "chat" {
		var chat database.Chat
		if err := h.db.Preload("User").First(&chat, "id = ?", contentID).Error; err != nil {
			utils.ErrorResponse(c, http.StatusNotFound, "Chat not found")
			return
		}
		reportedUserID = chat.UserID
		reportedEmail = chat.User.Email
	} else {
		var comment database.Comment
		if err := h.db.Preload("User").First(&comment, "id = ?", contentID).Error; err != nil {
			utils.ErrorResponse(c, http.StatusNotFound, "Comment not found")
			return
		}
		reportedUserID = comment.UserID
		reportedEmail = comment.User.Email
	}

	// Prevent self-reporting
	if reportedUserID == userID.(uuid.UUID) {
		utils.ErrorResponse(c, http.StatusBadRequest, "You cannot report your own content")
		return
	}

	// Check for duplicate reports
	var existing database.Report
	if err := h.db.Where("reporter_id = ? AND content_type = ? AND content_id = ? AND status = 'pending'",
		userID, req.ContentType, contentID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "You have already reported this content")
		return
	}

	// Get reporter info
	var reporter database.User
	h.db.First(&reporter, "id = ?", userID.(uuid.UUID))

	report := database.Report{
		ID:          uuid.New(),
		ReporterID:  userID.(uuid.UUID),
		ReportedID:  reportedUserID,
		ContentType: req.ContentType,
		ContentID:   contentID,
		Reason:      req.Reason,
		Description: req.Description,
		Status:      "pending",
	}

	if err := h.db.Create(&report).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create report")
		return
	}

	// Send admin notification
	go h.emailService.SendReportNotification(
		reporter.Email,
		reportedEmail,
		req.ContentType,
		req.Reason,
		req.Description,
	)

	utils.SuccessResponse(c, http.StatusCreated, report)
}

// ListReports lists all reports (admin only)
func (h *ReportHandler) ListReports(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(h.cfg.DefaultPageSize)))
	status := c.Query("status") // pending, resolved, dismissed

	if pageSize > h.cfg.MaxPageSize {
		pageSize = h.cfg.MaxPageSize
	}

	query := h.db.Model(&database.Report{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	offset := (page - 1) * pageSize
	var reports []database.Report
	if err := query.Preload("Reporter").Preload("Reported").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&reports).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch reports")
		return
	}

	utils.PaginatedSuccessResponse(c, http.StatusOK, reports, page, pageSize, total)
}

// GetReport gets a single report by ID (admin only)
func (h *ReportHandler) GetReport(c *gin.Context) {
	reportIDStr := c.Param("id")
	reportID, err := uuid.Parse(reportIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid report ID")
		return
	}

	var report database.Report
	if err := h.db.Preload("Reporter").Preload("Reported").
		First(&report, "id = ?", reportID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Report not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, report)
}

// UpdateReportRequest represents the request to update a report
type UpdateReportRequest struct {
	Status     string `json:"status" binding:"required"` // resolved, dismissed
	AdminNotes string `json:"admin_notes"`
}

// UpdateReport updates a report status (admin only)
func (h *ReportHandler) UpdateReport(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	reportIDStr := c.Param("id")
	reportID, err := uuid.Parse(reportIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid report ID")
		return
	}

	var req UpdateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// Validate status
	validStatuses := map[string]bool{"resolved": true, "dismissed": true}
	if !validStatuses[req.Status] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid status. Must be 'resolved' or 'dismissed'")
		return
	}

	var report database.Report
	if err := h.db.First(&report, "id = ?", reportID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Report not found")
		return
	}

	now := time.Now()
	adminUUID := adminID.(uuid.UUID)
	report.Status = req.Status
	report.AdminNotes = req.AdminNotes
	report.ResolvedBy = &adminUUID
	report.ResolvedAt = &now

	if err := h.db.Save(&report).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update report")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, report)
}
