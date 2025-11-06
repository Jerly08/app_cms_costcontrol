package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/models"
	"github.com/unipro/project-management/pkg/pdf"
	"gorm.io/gorm"
)

type ReportHandler struct {
	db           *gorm.DB
	pdfGenerator *pdf.WeeklyReportPDFGenerator
}

func NewReportHandler(db *gorm.DB) *ReportHandler {
	return &ReportHandler{
		db:           db,
		pdfGenerator: pdf.NewWeeklyReportPDFGenerator(db),
	}
}

// ===== DAILY REPORTS =====

// CreateDailyReport creates a new daily report
func (h *ReportHandler) CreateDailyReport(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		ProjectID  uint                      `json:"project_id" binding:"required"`
		Date       string                    `json:"date" binding:"required"`
		Activities string                    `json:"activities" binding:"required"`
		Progress   float64                   `json:"progress"`
		Weather    models.WeatherCondition   `json:"weather"`
		Workers    int                       `json:"workers"`
		Notes      string                    `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse date
	date, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	report := models.DailyReport{
		ProjectID:  input.ProjectID,
		Date:       date,
		Activities: input.Activities,
		Progress:   input.Progress,
		Weather:    input.Weather,
		Workers:    input.Workers,
		Notes:      input.Notes,
		ReportedBy: userID.(uint),
	}

	if err := h.db.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create daily report"})
		return
	}

	// Load relations
	h.db.Preload("Project").Preload("Reporter").Preload("Photos").First(&report, report.ID)

	c.JSON(http.StatusCreated, gin.H{"data": report})
}

// GetDailyReports returns all daily reports with optional filters
func (h *ReportHandler) GetDailyReports(c *gin.Context) {
	projectID := c.Query("project_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := h.db.Preload("Project").Preload("Reporter").Preload("Photos")

	// Filter by project
	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}

	// Filter by date range
	if startDate != "" {
		query = query.Where("date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("date <= ?", endDate)
	}

	var reports []models.DailyReport
	if err := query.Order("date DESC").Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch daily reports"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// GetDailyReportByID returns a single daily report
func (h *ReportHandler) GetDailyReportByID(c *gin.Context) {
	id := c.Param("id")

	var report models.DailyReport
	if err := h.db.Preload("Project").Preload("Reporter").Preload("Photos").First(&report, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Daily report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch daily report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

// UpdateDailyReport updates an existing daily report
func (h *ReportHandler) UpdateDailyReport(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var report models.DailyReport
	if err := h.db.First(&report, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Daily report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch daily report"})
		return
	}

	// Check if user is the reporter
	if report.ReportedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own reports"})
		return
	}

	var input struct {
		Activities string                    `json:"activities"`
		Progress   float64                   `json:"progress"`
		Weather    models.WeatherCondition   `json:"weather"`
		Workers    int                       `json:"workers"`
		Notes      string                    `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	report.Activities = input.Activities
	report.Progress = input.Progress
	report.Weather = input.Weather
	report.Workers = input.Workers
	report.Notes = input.Notes

	if err := h.db.Save(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update daily report"})
		return
	}

	// Load relations
	h.db.Preload("Project").Preload("Reporter").Preload("Photos").First(&report, report.ID)

	c.JSON(http.StatusOK, gin.H{"data": report})
}

// DeleteDailyReport deletes a daily report
func (h *ReportHandler) DeleteDailyReport(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var report models.DailyReport
	if err := h.db.First(&report, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Daily report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch daily report"})
		return
	}

	// Check if user is the reporter
	if report.ReportedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own reports"})
		return
	}

	if err := h.db.Delete(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete daily report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Daily report deleted successfully"})
}

// ===== PHOTO UPLOAD =====

// UploadDailyReportPhotos handles photo upload for daily reports
func (h *ReportHandler) UploadDailyReportPhotos(c *gin.Context) {
	reportID := c.Param("id")
	userID, _ := c.Get("user_id")

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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form"})
		return
	}

	files := form.File["photos"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No photos provided"})
		return
	}

	// Limit number of photos per upload
	if len(files) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 10 photos per upload"})
		return
	}

	// Get optional captions
	captions := form.Value["captions"]

	var uploadedPhotos []models.Photo
	uploadDir := fmt.Sprintf("./uploads/reports/%s", reportID)

	// Create upload directory if not exists
	if err := ensureDir(uploadDir); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	for i, file := range files {
		// Validate file type
		if !isValidImageType(file.Header.Get("Content-Type")) {
			continue // Skip non-image files
		}

		// Validate file size (max 5MB)
		if file.Size > 5*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("File %s exceeds 5MB limit", file.Filename)})
			return
		}

		// Generate unique filename
		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename)
		filePath := fmt.Sprintf("%s/%s", uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save file %s", file.Filename)})
			return
		}

		// Get caption if provided
		caption := ""
		if i < len(captions) {
			caption = captions[i]
		}

		// Create photo record
		photo := models.Photo{
			DailyReportID: report.ID,
			Filename:      file.Filename,
			FilePath:      filePath,
			FileSize:      file.Size,
			MimeType:      file.Header.Get("Content-Type"),
			Caption:       caption,
			UploadedBy:    userID.(uint),
		}

		if err := h.db.Create(&photo).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save photo record"})
			return
		}

		uploadedPhotos = append(uploadedPhotos, photo)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Photos uploaded successfully",
		"data":    uploadedPhotos,
		"count":   len(uploadedPhotos),
	})
}

// GetDailyReportPhotos returns all photos for a daily report
func (h *ReportHandler) GetDailyReportPhotos(c *gin.Context) {
	reportID := c.Param("id")

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

	var photos []models.Photo
	if err := h.db.Preload("Uploader").Where("daily_report_id = ?", reportID).Find(&photos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch photos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": photos})
}

// DeletePhoto deletes a photo
func (h *ReportHandler) DeletePhoto(c *gin.Context) {
	photoID := c.Param("photoId")
	userID, _ := c.Get("user_id")

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

	// Delete photo record from database
	if err := h.db.Delete(&photo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete photo"})
		return
	}

	// TODO: Optionally delete physical file from filesystem
	// os.Remove(photo.FilePath)

	c.JSON(http.StatusOK, gin.H{"message": "Photo deleted successfully"})
}

// ===== WEEKLY REPORTS =====

// GetWeeklyReports returns all weekly reports with optional filters
func (h *ReportHandler) GetWeeklyReports(c *gin.Context) {
	projectID := c.Query("project_id")
	year := c.Query("year")

	query := h.db.Preload("Project").Preload("Generator")

	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}

	if year != "" {
		query = query.Where("year = ?", year)
	}

	var reports []models.WeeklyReport
	if err := query.Order("year DESC, week_number DESC").Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch weekly reports"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reports})
}

// GetWeeklyReportByID returns a single weekly report
func (h *ReportHandler) GetWeeklyReportByID(c *gin.Context) {
	id := c.Param("id")

	var report models.WeeklyReport
	if err := h.db.Preload("Project").Preload("Generator").First(&report, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Weekly report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch weekly report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

// GenerateWeeklyReport generates a weekly report from daily reports
func (h *ReportHandler) GenerateWeeklyReport(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		ProjectID    uint   `json:"project_id" binding:"required"`
		StartDate    string `json:"start_date" binding:"required"`
		EndDate      string `json:"end_date" binding:"required"`
		Summary      string `json:"summary"`
		Achievements string `json:"achievements"`
		Issues       string `json:"issues"`
		NextWeekPlan string `json:"next_week_plan"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse dates
	startDate, err := time.Parse("2006-01-02", input.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", input.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format"})
		return
	}

	// Get daily reports in the date range
	var dailyReports []models.DailyReport
	if err := h.db.Where("project_id = ? AND date >= ? AND date <= ?", 
		input.ProjectID, startDate, endDate).Find(&dailyReports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch daily reports"})
		return
	}

	// Calculate total progress (average)
	var totalProgress float64
	if len(dailyReports) > 0 {
		for _, report := range dailyReports {
			totalProgress += report.Progress
		}
		totalProgress = totalProgress / float64(len(dailyReports))
	}

	// Calculate week number
	_, weekNum := startDate.ISOWeek()

	// Create weekly report
	weeklyReport := models.WeeklyReport{
		ProjectID:     input.ProjectID,
		WeekNumber:    weekNum,
		Year:          startDate.Year(),
		StartDate:     startDate,
		EndDate:       endDate,
		Summary:       input.Summary,
		TotalProgress: totalProgress,
		Achievements:  input.Achievements,
		Issues:        input.Issues,
		NextWeekPlan:  input.NextWeekPlan,
		GeneratedBy:   userID.(uint),
	}

	if err := h.db.Create(&weeklyReport).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create weekly report"})
		return
	}

	// Load relations
	h.db.Preload("Project").Preload("Generator").First(&weeklyReport, weeklyReport.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data": weeklyReport,
		"daily_reports_count": len(dailyReports),
	})
}

// DownloadWeeklyReportPDF generates and downloads PDF for weekly report
func (h *ReportHandler) DownloadWeeklyReportPDF(c *gin.Context) {
	id := c.Param("id")

	var report models.WeeklyReport
	if err := h.db.Preload("Project").Preload("Generator").First(&report, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Weekly report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch weekly report"})
		return
	}

	// Check if PDF already exists
	if report.PDFPath != "" {
		// Serve existing PDF
		pdfFilePath := "." + report.PDFPath
		c.FileAttachment(pdfFilePath, fmt.Sprintf("weekly_report_week%d_%d.pdf", report.WeekNumber, report.Year))
		return
	}

	// Generate new PDF
	pdfPath, err := h.pdfGenerator.GenerateWeeklyReportPDF(&report)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate PDF",
			"details": err.Error(),
		})
		return
	}

	// Save PDF path to database
	report.PDFPath = pdfPath
	if err := h.db.Save(&report).Error; err != nil {
		// Continue even if DB update fails - PDF is already generated
		fmt.Printf("Warning: Failed to update PDF path in database: %v\n", err)
	}

	// Serve the PDF file
	pdfFilePath := "." + pdfPath
	c.FileAttachment(pdfFilePath, fmt.Sprintf("weekly_report_week%d_%d.pdf", report.WeekNumber, report.Year))
}

// ===== HELPER FUNCTIONS =====

// ensureDir creates directory if it doesn't exist
func ensureDir(dirPath string) error {
	return os.MkdirAll(dirPath, os.ModePerm)
}

// isValidImageType checks if the MIME type is a valid image format
func isValidImageType(mimeType string) bool {
	validTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	}
	
	for _, validType := range validTypes {
		if strings.EqualFold(mimeType, validType) {
			return true
		}
	}
	
	return false
}

