package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/models"
	"github.com/unipro/project-management/pkg/database"
)

// CreatePurchaseRequest creates a new purchase request
func CreatePurchaseRequest(c *gin.Context) {
	var input struct {
		ProjectID    uint       `json:"project_id" binding:"required"`
		Title        string     `json:"title" binding:"required"`
		Description  string     `json:"description"`
		Priority     string     `json:"priority"`
		RequiredDate *time.Time `json:"required_date"`
		TotalAmount  float64    `json:"total_amount" binding:"required"`
		Items        []struct {
			MaterialID     uint    `json:"material_id" binding:"required"`
			Quantity       float64 `json:"quantity" binding:"required"`
			Unit           string  `json:"unit" binding:"required"`
			EstimatedPrice float64 `json:"estimated_price" binding:"required"`
			Vendor         string  `json:"vendor"`
			Notes          string  `json:"notes"`
		} `json:"items" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get requester ID from context
	requesterID, _ := c.Get("user_id")

	// Generate PR number
	prNumber, err := generatePRNumber()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PR number"})
		return
	}

	// Set default priority
	priority := models.PRPriorityNormal
	if input.Priority != "" {
		priority = models.PRPriority(input.Priority)
	}

	// Create purchase request
	pr := models.PurchaseRequest{
		PRNumber:     prNumber,
		ProjectID:    input.ProjectID,
		RequesterID:  requesterID.(uint),
		Title:        input.Title,
		Description:  input.Description,
		Priority:     priority,
		Status:       models.PRStatusPending,
		TotalAmount:  input.TotalAmount,
		RequiredDate: input.RequiredDate,
		CurrentStage: models.StagePurchasing,
	}

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create PR
	if err := tx.Create(&pr).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create purchase request"})
		return
	}

	// Create PR items
	for _, itemInput := range input.Items {
		item := models.PRItem{
			PurchaseRequestID: pr.ID,
			MaterialID:        itemInput.MaterialID,
			Quantity:          itemInput.Quantity,
			Unit:              itemInput.Unit,
			EstimatedPrice:    itemInput.EstimatedPrice,
			Vendor:            itemInput.Vendor,
			Notes:             itemInput.Notes,
		}
		if err := tx.Create(&item).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create PR items"})
			return
		}
	}

	// Initialize approval history for all stages
	stages := []models.ApprovalStage{
		models.StagePurchasing,
		models.StageCostControl,
		models.StageGM,
	}

	for _, stage := range stages {
		history := models.ApprovalHistory{
			PurchaseRequestID: pr.ID,
			Stage:             stage,
			Status:            models.StageStatusPending,
		}
		if err := tx.Create(&history).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize approval history"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Load relations
	database.DB.Preload("Project").Preload("Requester").Preload("Items.Material").
		Preload("ApprovalHistory.Approver").Preload("Comments.User").First(&pr, pr.ID)

	// Create notification for Purchasing department
	go createPRNotification(pr.ID, models.StagePurchasing, pr.Title, requesterID.(uint))

	c.JSON(http.StatusCreated, gin.H{"data": pr})
}

// GetPurchaseRequests returns all purchase requests with optional filters
func GetPurchaseRequests(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("role")
	filter := c.Query("filter") // "all", "my_requests", "pending_approval", "approved", "rejected"

	query := database.DB.Preload("Project").Preload("Requester").Preload("Items.Material").
		Preload("ApprovalHistory.Approver").Preload("Comments.User")

	// Apply filters based on role and filter parameter
	switch filter {
	case "my_requests":
		query = query.Where("requester_id = ?", userID)
	case "pending_approval":
		// Show PRs pending at the user's role stage
		query = query.Where("current_stage = ? AND status = ?", userRole, models.PRStatusPending)
	case "approved":
		query = query.Where("status = ?", models.PRStatusApproved)
	case "rejected":
		query = query.Where("status = ?", models.PRStatusRejected)
	}

	var prs []models.PurchaseRequest
	if err := query.Order("created_at DESC").Find(&prs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch purchase requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": prs})
}

// GetPurchaseRequestByID returns a single purchase request by ID
func GetPurchaseRequestByID(c *gin.Context) {
	id := c.Param("id")

	var pr models.PurchaseRequest
	if err := database.DB.Preload("Project").Preload("Requester").Preload("Items.Material").
		Preload("ApprovalHistory.Approver").Preload("Comments.User").
		First(&pr, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Purchase request not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": pr})
}

// ApprovePurchaseRequest approves a purchase request at current stage
func ApprovePurchaseRequest(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("role")

	var input struct {
		Stage   string `json:"stage" binding:"required"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify user role matches the approval stage
	if input.Stage != userRole.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to approve at this stage"})
		return
	}

	var pr models.PurchaseRequest
	if err := database.DB.First(&pr, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Purchase request not found"})
		return
	}

	// Check if PR is pending and at the correct stage
	if pr.Status != models.PRStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase request already processed"})
		return
	}

	if string(pr.CurrentStage) != input.Stage {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase request not at this approval stage"})
		return
	}

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update approval history
	now := time.Now()
	approverIDVal := userID.(uint)
	if err := tx.Model(&models.ApprovalHistory{}).
		Where("purchase_request_id = ? AND stage = ?", pr.ID, input.Stage).
		Updates(map[string]interface{}{
			"status":      models.StageStatusApproved,
			"approver_id": approverIDVal,
			"comment":     input.Comment,
			"approved_at": now,
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update approval history"})
		return
	}

	// Move to next stage or mark as fully approved
	nextStage := pr.GetNextStage()
	if nextStage != nil {
		// Move to next stage
		pr.CurrentStage = *nextStage
		if err := tx.Save(&pr).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update PR stage"})
			return
		}

		// Notify next approver
		go createPRNotification(pr.ID, *nextStage, pr.Title, pr.RequesterID)
	} else {
		// Final approval - mark as approved
		pr.Status = models.PRStatusApproved
		if err := tx.Save(&pr).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve PR"})
			return
		}

		// Notify requester
		go notifyRequester(pr.ID, pr.RequesterID, pr.Title, "approved")
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Reload PR with relations
	database.DB.Preload("Project").Preload("Requester").Preload("Items.Material").
		Preload("ApprovalHistory.Approver").Preload("Comments.User").First(&pr, pr.ID)

	c.JSON(http.StatusOK, gin.H{"data": pr})
}

// RejectPurchaseRequest rejects a purchase request at current stage
func RejectPurchaseRequest(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("role")

	var input struct {
		Stage  string `json:"stage" binding:"required"`
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify user role matches the approval stage
	if input.Stage != userRole.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to reject at this stage"})
		return
	}

	var pr models.PurchaseRequest
	if err := database.DB.First(&pr, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Purchase request not found"})
		return
	}

	// Check if PR is pending and at the correct stage
	if pr.Status != models.PRStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase request already processed"})
		return
	}

	if string(pr.CurrentStage) != input.Stage {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase request not at this approval stage"})
		return
	}

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update approval history
	now := time.Now()
	approverIDVal := userID.(uint)
	if err := tx.Model(&models.ApprovalHistory{}).
		Where("purchase_request_id = ? AND stage = ?", pr.ID, input.Stage).
		Updates(map[string]interface{}{
			"status":      models.StageStatusRejected,
			"approver_id": approverIDVal,
			"comment":     input.Reason,
			"approved_at": now,
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update approval history"})
		return
	}

	// Mark PR as rejected
	pr.Status = models.PRStatusRejected
	if err := tx.Save(&pr).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject PR"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Notify requester
	go notifyRequester(pr.ID, pr.RequesterID, pr.Title, "rejected")

	// Reload PR with relations
	database.DB.Preload("Project").Preload("Requester").Preload("Items.Material").
		Preload("ApprovalHistory.Approver").Preload("Comments.User").First(&pr, pr.ID)

	c.JSON(http.StatusOK, gin.H{"data": pr})
}

// AddPRComment adds a comment to a purchase request
func AddPRComment(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var input struct {
		Comment string `json:"comment" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify PR exists
	var pr models.PurchaseRequest
	if err := database.DB.First(&pr, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Purchase request not found"})
		return
	}

	// Create comment
	comment := models.PRComment{
		PurchaseRequestID: pr.ID,
		UserID:            userID.(uint),
		Comment:           input.Comment,
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
		return
	}

	// Load user relation
	database.DB.Preload("User").First(&comment, comment.ID)

	c.JSON(http.StatusCreated, gin.H{"data": comment})
}

// Helper function to generate PR number
func generatePRNumber() (string, error) {
	year := time.Now().Year()
	var count int64

	// Count PRs created this year
	database.DB.Model(&models.PurchaseRequest{}).
		Where("YEAR(created_at) = ?", year).
		Count(&count)

	return fmt.Sprintf("PR-%d-%04d", year, count+1), nil
}

// Helper function to create PR notification
func createPRNotification(prID uint, stage models.ApprovalStage, title string, requesterID uint) {
	// Get users with the role matching the stage
	var users []models.User
	database.DB.Joins("JOIN roles ON users.role_id = roles.id").
		Where("roles.name = ?", stage).Find(&users)

	// Get requester name
	var requester models.User
	database.DB.First(&requester, requesterID)

	// Create notifications for all users in that role
	for _, user := range users {
		notification := models.Notification{
			UserID:    user.ID,
			Title:     fmt.Sprintf("Purchase Request Baru: %s", title),
			Message:   fmt.Sprintf("Dari: %s. Menunggu approval %s.", requester.Name, stage),
			Type:      models.NotificationTypeApprovalRequest,
			RelatedID: &prID,
			IsRead:    false,
		}
		database.DB.Create(&notification)
	}
}

// Helper function to notify requester
func notifyRequester(prID, requesterID uint, title, status string) {
	var message string
	var notifType models.NotificationType

	if status == "approved" {
		message = fmt.Sprintf("Purchase Request '%s' telah disetujui.", title)
		notifType = models.NotificationTypeApprovalApproved
	} else {
		message = fmt.Sprintf("Purchase Request '%s' telah ditolak.", title)
		notifType = models.NotificationTypeApprovalRejected
	}

	notification := models.Notification{
		UserID:    requesterID,
		Title:     "Status Purchase Request",
		Message:   message,
		Type:      notifType,
		RelatedID: &prID,
		IsRead:    false,
	}
	database.DB.Create(&notification)
}

