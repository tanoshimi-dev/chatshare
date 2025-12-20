package utils

import "github.com/gin-gonic/gin"

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Data       interface{} `json:"data"`
	Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

func SuccessResponse(c *gin.Context, statusCode int, data interface{}) {
	c.JSON(statusCode, Response{
		Success: true,
		Data:    data,
	})
}

func ErrorResponse(c *gin.Context, statusCode int, err string) {
	c.JSON(statusCode, Response{
		Success: false,
		Error:   err,
	})
}

func MessageResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, Response{
		Success: true,
		Message: message,
	})
}

func PaginatedSuccessResponse(c *gin.Context, statusCode int, data interface{}, page, pageSize int, total int64) {
	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	c.JSON(statusCode, PaginatedResponse{
		Success: true,
		Data:    data,
		Pagination: Pagination{
			Page:       page,
			PageSize:   pageSize,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}
