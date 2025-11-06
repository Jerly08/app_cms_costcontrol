package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/models"
	"github.com/unipro/project-management/pkg/database"
)

// GetMaterialUsageByProject returns all material usage records for a project
func GetMaterialUsageByProject(c *gin.Context) {
	projectID := c.Param("projectId")

	var usages []models.MaterialUsage
	if err := database.DB.Preload("Material").Preload("Project").Preload("User").Preload("DailyReport").
		Where("project_id = ?", projectID).
		Order("usage_date DESC").
		Find(&usages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch material usage"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": usages})
}

// GetMaterialUsageByID returns a single material usage record by ID
func GetMaterialUsageByID(c *gin.Context) {
	id := c.Param("id")

	var usage models.MaterialUsage
	if err := database.DB.Preload("Material").Preload("Project").Preload("User").Preload("DailyReport").
		First(&usage, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material usage record not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": usage})
}

// CreateMaterialUsage records material usage
func CreateMaterialUsage(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input struct {
		ProjectID     uint       `json:"project_id" binding:"required"`
		MaterialID    uint       `json:"material_id" binding:"required"`
		Quantity      float64    `json:"quantity" binding:"required"`
		UsageDate     *time.Time `json:"usage_date"`
		DailyReportID *uint      `json:"daily_report_id"`
		Notes         string     `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify project exists
	var project models.Project
	if err := database.DB.First(&project, input.ProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Verify material exists and get its price
	var material models.Material
	if err := database.DB.First(&material, input.MaterialID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
		return
	}

	// Check if material has sufficient stock
	if material.Stock < input.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Insufficient material stock",
			"available": material.Stock,
			"requested": input.Quantity,
		})
		return
	}

	// Set usage date to now if not provided
	usageDate := time.Now()
	if input.UsageDate != nil {
		usageDate = *input.UsageDate
	}

	// Calculate cost
	cost := input.Quantity * material.UnitPrice

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create material usage record
	usage := models.MaterialUsage{
		ProjectID:     input.ProjectID,
		MaterialID:    input.MaterialID,
		DailyReportID: input.DailyReportID,
		Quantity:      input.Quantity,
		Cost:          cost,
		UsageDate:     usageDate,
		UsedBy:        userID.(uint),
		Notes:         input.Notes,
	}

	if err := tx.Create(&usage).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create material usage record"})
		return
	}

	// Deduct from material stock
	material.Stock -= input.Quantity
	if err := tx.Save(&material).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update material stock"})
		return
	}

	// Update BOM used quantity if exists
	var bom models.BOM
	if err := tx.Where("project_id = ? AND material_id = ?", input.ProjectID, input.MaterialID).
		First(&bom).Error; err == nil {
		bom.UsedQty += input.Quantity
		bom.ActualCost += cost
		bom.UpdateRemainingQty()
		tx.Save(&bom)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Check if material is now low stock
	if material.IsLowStock() {
		go createLowStockNotification(material.ID, material.Name, material.Stock, material.MinStock)
	}

	// Load relations
	database.DB.Preload("Material").Preload("Project").Preload("User").Preload("DailyReport").
		First(&usage, usage.ID)

	c.JSON(http.StatusCreated, gin.H{"data": usage})
}

// UpdateMaterialUsage updates a material usage record
func UpdateMaterialUsage(c *gin.Context) {
	id := c.Param("id")

	var usage models.MaterialUsage
	if err := database.DB.First(&usage, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material usage record not found"})
		return
	}

	var input struct {
		Quantity  float64    `json:"quantity"`
		UsageDate *time.Time `json:"usage_date"`
		Notes     string     `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// If quantity changed, adjust stock and costs
	if input.Quantity > 0 && input.Quantity != usage.Quantity {
		var material models.Material
		if err := tx.First(&material, usage.MaterialID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
			return
		}

		// Calculate difference
		diff := input.Quantity - usage.Quantity

		// Check if new quantity exceeds available stock
		if diff > 0 && material.Stock < diff {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Insufficient material stock for this adjustment",
				"available": material.Stock,
			})
			return
		}

		// Adjust material stock
		material.Stock -= diff
		if err := tx.Save(&material).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update material stock"})
			return
		}

		// Update BOM if exists
		var bom models.BOM
		if err := tx.Where("project_id = ? AND material_id = ?", usage.ProjectID, usage.MaterialID).
			First(&bom).Error; err == nil {
			bom.UsedQty += diff
			costDiff := diff * material.UnitPrice
			bom.ActualCost += costDiff
			bom.UpdateRemainingQty()
			tx.Save(&bom)
		}

		// Update usage record
		usage.Quantity = input.Quantity
		usage.Cost = input.Quantity * material.UnitPrice
	}

	if input.UsageDate != nil {
		usage.UsageDate = *input.UsageDate
	}

	usage.Notes = input.Notes

	if err := tx.Save(&usage).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update material usage"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Load relations
	database.DB.Preload("Material").Preload("Project").Preload("User").Preload("DailyReport").
		First(&usage, usage.ID)

	c.JSON(http.StatusOK, gin.H{"data": usage})
}

// DeleteMaterialUsage deletes a material usage record and returns material to stock
func DeleteMaterialUsage(c *gin.Context) {
	id := c.Param("id")

	var usage models.MaterialUsage
	if err := database.DB.First(&usage, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material usage record not found"})
		return
	}

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Return material to stock
	var material models.Material
	if err := tx.First(&material, usage.MaterialID).Error; err == nil {
		material.Stock += usage.Quantity
		tx.Save(&material)
	}

	// Update BOM if exists
	var bom models.BOM
	if err := tx.Where("project_id = ? AND material_id = ?", usage.ProjectID, usage.MaterialID).
		First(&bom).Error; err == nil {
		bom.UsedQty -= usage.Quantity
		bom.ActualCost -= usage.Cost
		bom.UpdateRemainingQty()
		tx.Save(&bom)
	}

	// Delete usage record
	if err := tx.Delete(&usage).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete material usage"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Material usage deleted and stock restored"})
}

// GetMaterialUsageStats returns material usage statistics for a project
func GetMaterialUsageStats(c *gin.Context) {
	projectID := c.Param("projectId")

	var usages []models.MaterialUsage
	if err := database.DB.Where("project_id = ?", projectID).Find(&usages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch material usage"})
		return
	}

	// Calculate statistics
	totalCost := 0.0
	materialCount := make(map[uint]bool)

	for _, usage := range usages {
		totalCost += usage.Cost
		materialCount[usage.MaterialID] = true
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": map[string]interface{}{
			"total_records":      len(usages),
			"unique_materials":   len(materialCount),
			"total_cost":         totalCost,
		},
	})
}

