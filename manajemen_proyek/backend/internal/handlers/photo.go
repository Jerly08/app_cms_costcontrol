package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/models"
	"gorm.io/gorm"
)

type PhotoHandler struct {
	db         *gorm.DB
	uploadPath string
}

func NewPhotoHandler(db *gorm.DB) *PhotoHandler {
	// Create uploads directory if it doesn't exist
	uploadPath := "./uploads/photos"
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		fmt.Printf("Warning: Could not create upload directory: %v\n", err)
	}

	return &PhotoHandler{
		db:         db,
		uploadPath: uploadPath,
	}
}

// UploadPhotos handles multiple photo uploads for a daily report
func (h *PhotoHandler) UploadPhotos(c *gin.Context) {
	reportID := c.Param("id")
	userID, _ := c.Get("userID")

	// Verify daily report exists
	var report models.DailyReport
	if err := h.db.First(&report, reportID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Daily report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch daily report"})
		return
	}

	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	files := form.File["photos"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No photos provided"})
		return
	}

	// Limit to 10 photos
	if len(files) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 10 photos allowed per upload"})
		return
	}

	// Get captions from form
	captions := make(map[int]string)
	for key, values := range form.Value {
		var captionIndex int
		if n, _ := fmt.Sscanf(key, "caption_%d", &captionIndex); n == 1 && len(values) > 0 {
			captions[captionIndex] = values[0]
		}
	}

	var uploadedPhotos []models.Photo

	// Process each file
	for index, file := range files {
		// Validate file type (images only)
		contentType := file.Header.Get("Content-Type")
		if !isImageType(contentType) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("File %s is not an image", file.Filename),
			})
			return
		}

		// Validate file size (max 10MB)
		if file.Size > 10*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("File %s exceeds 10MB limit", file.Filename),
			})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d_%d_%s%s", report.ID, time.Now().UnixNano(), sanitizeFilename(file.Filename), ext)
		filePath := filepath.Join(h.uploadPath, filename)

		// Save file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": fmt.Sprintf("Failed to save file %s", file.Filename),
			})
			return
		}

		// Create photo record
		photo := models.Photo{
			DailyReportID: report.ID,
			Filename:      file.Filename,
			FilePath:      "/uploads/photos/" + filename, // Relative path for serving
			FileSize:      file.Size,
			MimeType:      contentType,
			Caption:       captions[index],
			UploadedBy:    userID.(uint),
		}

		if err := h.db.Create(&photo).Error; err != nil {
			// Cleanup uploaded file if DB insert fails
			os.Remove(filePath)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save photo record"})
			return
		}

		// Load uploader relation
		h.db.Preload("Uploader").First(&photo, photo.ID)
		uploadedPhotos = append(uploadedPhotos, photo)
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    uploadedPhotos,
		"message": fmt.Sprintf("Successfully uploaded %d photo(s)", len(uploadedPhotos)),
	})
}

// GetPhotosByReport returns all photos for a specific daily report
func (h *PhotoHandler) GetPhotosByReport(c *gin.Context) {
	reportID := c.Param("id")

	var photos []models.Photo
	if err := h.db.Preload("Uploader").Where("daily_report_id = ?", reportID).Find(&photos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch photos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": photos})
}

// DeletePhoto deletes a photo
func (h *PhotoHandler) DeletePhoto(c *gin.Context) {
	photoID := c.Param("id")
	userID, _ := c.Get("userID")

	var photo models.Photo
	if err := h.db.First(&photo, photoID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Photo not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch photo"})
		return
	}

	// Check if user is the uploader
	if photo.UploadedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own photos"})
		return
	}

	// Delete file from filesystem
	fullPath := filepath.Join(".", photo.FilePath)
	if err := os.Remove(fullPath); err != nil {
		fmt.Printf("Warning: Could not delete file %s: %v\n", fullPath, err)
		// Continue with DB deletion even if file deletion fails
	}

	// Delete from database
	if err := h.db.Delete(&photo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete photo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Photo deleted successfully"})
}

// Helper functions

func isImageType(contentType string) bool {
	imageTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	}

	for _, t := range imageTypes {
		if t == contentType {
			return true
		}
	}
	return false
}

func sanitizeFilename(filename string) string {
	// Remove extension
	ext := filepath.Ext(filename)
	name := filename[:len(filename)-len(ext)]

	// Keep only alphanumeric and basic characters
	sanitized := ""
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			sanitized += string(r)
		} else {
			sanitized += "_"
		}
	}

	// Limit length
	if len(sanitized) > 50 {
		sanitized = sanitized[:50]
	}

	return sanitized
}

