package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/models"
	"github.com/unipro/project-management/pkg/database"
)

// CreateApproval creates a new approval request
func CreateApproval(c *gin.Context) {
	var input struct {
		Title       string               `json:"title" binding:"required"`
		Description string               `json:"description"`
		Type        models.ApprovalType  `json:"type" binding:"required"`
		Amount      *float64             `json:"amount"`
		ProjectID   *uint                `json:"project_id"`
		ApproverID  uint                 `json:"approver_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get requester ID from context (set by auth middleware)
	requesterID, _ := c.Get("userID")

	approval := models.Approval{
		Title:       input.Title,
		Description: input.Description,
		Type:        input.Type,
		Status:      models.ApprovalStatusPending,
		Amount:      input.Amount,
		ProjectID:   input.ProjectID,
		RequesterID: requesterID.(uint),
		ApproverID:  input.ApproverID,
	}

	if err := database.DB.Create(&approval).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create approval"})
		return
	}

	// Load relations
	database.DB.Preload("Requester").Preload("Approver").Preload("Project").First(&approval, approval.ID)

	// Create notification for approver
	go createApprovalNotification(approval.ID, approval.ApproverID, approval.Title, approval.RequesterID)

	c.JSON(http.StatusCreated, approval)
}

// GetApprovals returns all approvals (with filters)
func GetApprovals(c *gin.Context) {
	userID, _ := c.Get("userID")
	filter := c.Query("filter") // "pending", "approved", "rejected", "my_requests", "my_approvals"

	query := database.DB.Preload("Requester").Preload("Approver").Preload("Project")

	switch filter {
	case "my_requests":
		query = query.Where("requester_id = ?", userID)
	case "my_approvals":
		query = query.Where("approver_id = ?", userID)
	case "pending":
		query = query.Where("status = ?", models.ApprovalStatusPending)
	case "approved":
		query = query.Where("status = ?", models.ApprovalStatusApproved)
	case "rejected":
		query = query.Where("status = ?", models.ApprovalStatusRejected)
	}

	var approvals []models.Approval
	if err := query.Order("created_at DESC").Find(&approvals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch approvals"})
		return
	}

	c.JSON(http.StatusOK, approvals)
}

// GetApprovalByID returns a single approval by ID
func GetApprovalByID(c *gin.Context) {
	id := c.Param("id")

	var approval models.Approval
	if err := database.DB.Preload("Requester").Preload("Approver").Preload("Project").First(&approval, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Approval not found"})
		return
	}

	c.JSON(http.StatusOK, approval)
}

// UpdateApprovalStatus updates approval status (approve/reject)
func UpdateApprovalStatus(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")

	var input struct {
		Status        models.ApprovalStatus `json:"status" binding:"required"`
		ApprovalNotes string                `json:"approval_notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var approval models.Approval
	if err := database.DB.First(&approval, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Approval not found"})
		return
	}

	// Check if user is the approver
	if approval.ApproverID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to approve this request"})
		return
	}

	// Check if already processed
	if approval.Status != models.ApprovalStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Approval already processed"})
		return
	}

	now := time.Now()
	approval.Status = input.Status
	approval.ApprovalNotes = input.ApprovalNotes
	approval.ApprovedAt = &now

	if err := database.DB.Save(&approval).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update approval"})
		return
	}

	// Load relations
	database.DB.Preload("Requester").Preload("Approver").Preload("Project").First(&approval, approval.ID)

	// Create notification for requester
	var notifType models.NotificationType
	var notifTitle string
	if approval.Status == models.ApprovalStatusApproved {
		notifType = models.NotificationTypeApprovalApproved
		notifTitle = "Approval Disetujui: " + approval.Title
	} else {
		notifType = models.NotificationTypeApprovalRejected
		notifTitle = "Approval Ditolak: " + approval.Title
	}

	go func() {
		notification := models.Notification{
			UserID:    approval.RequesterID,
			Title:     notifTitle,
			Message:   "Status: " + string(approval.Status) + ". " + approval.ApprovalNotes,
			Type:      notifType,
			RelatedID: &approval.ID,
			IsRead:    false,
		}
		database.DB.Create(&notification)
	}()

	c.JSON(http.StatusOK, approval)
}

// createApprovalNotification creates a notification for a new approval request
func createApprovalNotification(approvalID, approverID uint, title string, requesterID uint) {
	// Get requester name
	var requester models.User
	if err := database.DB.First(&requester, requesterID).Error; err != nil {
		return
	}

	notification := models.Notification{
		UserID:    approverID,
		Title:     "Permintaan Approval Baru: " + title,
		Message:   "Dari: " + requester.Name + ". Menunggu persetujuan Anda.",
		Type:      models.NotificationTypeApprovalRequest,
		RelatedID: &approvalID,
		IsRead:    false,
	}

	database.DB.Create(&notification)
}

