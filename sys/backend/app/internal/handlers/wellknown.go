package handlers

import (
	"encoding/json"
	"io"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

type WellKnownHandler struct {
	staticDir string
}

func NewWellKnownHandler(staticDir string) *WellKnownHandler {
	return &WellKnownHandler{
		staticDir: staticDir,
	}
}

// AppleAppSiteAssociation handles the /.well-known/apple-app-site-association endpoint
// This serves the static JSON file from the static/.well-known directory
func (h *WellKnownHandler) AppleAppSiteAssociation(c *gin.Context) {
	filePath := h.staticDir + "/.well-known/apple-app-site-association"

	// Open the file
	file, err := os.Open(filePath)
	if err != nil {
		log.Printf("Error opening apple-app-site-association file: %v", err)
		c.JSON(500, gin.H{"error": "Failed to load apple-app-site-association file"})
		return
	}
	defer file.Close()

	// Read the file content
	content, err := io.ReadAll(file)
	if err != nil {
		log.Printf("Error reading apple-app-site-association file: %v", err)
		c.JSON(500, gin.H{"error": "Failed to read apple-app-site-association file"})
		return
	}

	// Validate JSON format
	var jsonData interface{}
	if err := json.Unmarshal(content, &jsonData); err != nil {
		log.Printf("Error: apple-app-site-association file contains invalid JSON: %v", err)
		c.JSON(500, gin.H{"error": "Invalid JSON in apple-app-site-association file"})
		return
	}

	// Set proper content type and return the JSON
	c.Data(200, "application/json", content)
}
