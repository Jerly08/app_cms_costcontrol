package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/models"
	"github.com/unipro/project-management/pkg/database"
)

// GetBOMByProject returns all BOM items for a specific project
func GetBOMByProject(c *gin.Context) {
	projectID := c.Param("projectId")

	var boms []models.BOM
	if err := database.DB.Preload("Material").Preload("Project").
		Where("project_id = ?", projectID).
		Order("phase ASC, created_at ASC").
		Find(&boms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch BOM"})
		return
	}

	// Calculate remaining qty and update if needed
	for i := range boms {
		boms[i].UpdateRemainingQty()
	}

	c.JSON(http.StatusOK, gin.H{"data": boms})
}

// GetBOMByID returns a single BOM item by ID
func GetBOMByID(c *gin.Context) {
	id := c.Param("id")

	var bom models.BOM
	if err := database.DB.Preload("Material").Preload("Project").First(&bom, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "BOM item not found"})
		return
	}

	bom.UpdateRemainingQty()

	c.JSON(http.StatusOK, gin.H{"data": bom})
}

// CreateBOM creates a new BOM item for a project
func CreateBOM(c *gin.Context) {
	var input struct {
		ProjectID     uint    `json:"project_id" binding:"required"`
		MaterialID    uint    `json:"material_id" binding:"required"`
		PlannedQty    float64 `json:"planned_qty" binding:"required"`
		Phase         string  `json:"phase"`
		Notes         string  `json:"notes"`
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

	// Verify material exists
	var material models.Material
	if err := database.DB.First(&material, input.MaterialID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
		return
	}

	// Check if BOM item already exists for this project and material
	var existing models.BOM
	if err := database.DB.Where("project_id = ? AND material_id = ?", input.ProjectID, input.MaterialID).
		First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "BOM item for this material already exists in this project",
		})
		return
	}

	// Calculate estimated cost
	estimatedCost := input.PlannedQty * material.UnitPrice

	bom := models.BOM{
		ProjectID:     input.ProjectID,
		MaterialID:    input.MaterialID,
		PlannedQty:    input.PlannedQty,
		UsedQty:       0,
		RemainingQty:  input.PlannedQty,
		EstimatedCost: estimatedCost,
		ActualCost:    0,
		Phase:         input.Phase,
		Notes:         input.Notes,
	}

	if err := database.DB.Create(&bom).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create BOM item"})
		return
	}

	// Load relations
	database.DB.Preload("Material").Preload("Project").First(&bom, bom.ID)

	c.JSON(http.StatusCreated, gin.H{"data": bom})
}

// UpdateBOM updates an existing BOM item
func UpdateBOM(c *gin.Context) {
	id := c.Param("id")

	var bom models.BOM
	if err := database.DB.First(&bom, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "BOM item not found"})
		return
	}

	var input struct {
		PlannedQty float64 `json:"planned_qty"`
		Phase      string  `json:"phase"`
		Notes      string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if input.PlannedQty > 0 {
		bom.PlannedQty = input.PlannedQty
		bom.UpdateRemainingQty()

		// Recalculate estimated cost
		var material models.Material
		if err := database.DB.First(&material, bom.MaterialID).Error; err == nil {
			bom.EstimatedCost = bom.PlannedQty * material.UnitPrice
		}
	}

	bom.Phase = input.Phase
	bom.Notes = input.Notes

	if err := database.DB.Save(&bom).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update BOM item"})
		return
	}

	// Load relations
	database.DB.Preload("Material").Preload("Project").First(&bom, bom.ID)

	c.JSON(http.StatusOK, gin.H{"data": bom})
}

// DeleteBOM soft deletes a BOM item
func DeleteBOM(c *gin.Context) {
	id := c.Param("id")

	var bom models.BOM
	if err := database.DB.First(&bom, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "BOM item not found"})
		return
	}

	// Check if material has been used
	if bom.UsedQty > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete BOM item with recorded material usage",
		})
		return
	}

	// Soft delete
	if err := database.DB.Delete(&bom).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete BOM item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "BOM item deleted successfully"})
}

// CalculateBOMUsage calculates and updates usage statistics for project BOM
func CalculateBOMUsage(c *gin.Context) {
	projectID := c.Param("projectId")

	var boms []models.BOM
	if err := database.DB.Preload("Material").Where("project_id = ?", projectID).Find(&boms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch BOM"})
		return
	}

	if len(boms) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "No BOM items found for this project",
			"stats": map[string]interface{}{
				"total_items":       0,
				"total_estimated":   0,
				"total_actual":      0,
				"total_variance":    0,
				"usage_percentage":  0,
			},
		})
		return
	}

	// Recalculate usage for each BOM item
	totalEstimated := 0.0
	totalActual := 0.0
	totalUsagePercentage := 0.0

	for i := range boms {
		// Get material usages for this BOM item
		var usages []models.MaterialUsage
		database.DB.Where("project_id = ? AND material_id = ?", projectID, boms[i].MaterialID).Find(&usages)

		// Calculate total used quantity
		usedQty := 0.0
		actualCost := 0.0
		for _, usage := range usages {
			usedQty += usage.Quantity
			actualCost += usage.Cost
		}

		// Update BOM item
		boms[i].UsedQty = usedQty
		boms[i].ActualCost = actualCost
		boms[i].UpdateRemainingQty()

		database.DB.Save(&boms[i])

		// Accumulate totals
		totalEstimated += boms[i].EstimatedCost
		totalActual += boms[i].ActualCost
		totalUsagePercentage += boms[i].CalculateUsagePercentage()
	}

	avgUsagePercentage := totalUsagePercentage / float64(len(boms))
	variance := totalActual - totalEstimated

	c.JSON(http.StatusOK, gin.H{
		"message": "BOM usage calculated successfully",
		"stats": map[string]interface{}{
			"total_items":           len(boms),
			"total_estimated":       totalEstimated,
			"total_actual":          totalActual,
			"total_variance":        variance,
			"variance_percentage":   (variance / totalEstimated) * 100,
			"avg_usage_percentage":  avgUsagePercentage,
		},
		"data": boms,
	})
}

// ImportBOMFromTemplate creates multiple BOM items from a template
func ImportBOMFromTemplate(c *gin.Context) {
	var input struct {
		ProjectID uint `json:"project_id" binding:"required"`
		Items     []struct {
			MaterialID uint    `json:"material_id" binding:"required"`
			PlannedQty float64 `json:"planned_qty" binding:"required"`
			Phase      string  `json:"phase"`
			Notes      string  `json:"notes"`
		} `json:"items" binding:"required,min=1"`
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

	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var createdBOMs []models.BOM
	errors := []string{}

	for _, item := range input.Items {
		// Verify material exists
		var material models.Material
		if err := tx.First(&material, item.MaterialID).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Material ID %d not found", item.MaterialID))
			continue
		}

		// Check if already exists
		var existing models.BOM
		if err := tx.Where("project_id = ? AND material_id = ?", input.ProjectID, item.MaterialID).
			First(&existing).Error; err == nil {
			errors = append(errors, fmt.Sprintf("Material '%s' already exists in BOM", material.Name))
			continue
		}

		// Create BOM item
		estimatedCost := item.PlannedQty * material.UnitPrice
		bom := models.BOM{
			ProjectID:     input.ProjectID,
			MaterialID:    item.MaterialID,
			PlannedQty:    item.PlannedQty,
			UsedQty:       0,
			RemainingQty:  item.PlannedQty,
			EstimatedCost: estimatedCost,
			ActualCost:    0,
			Phase:         item.Phase,
			Notes:         item.Notes,
		}

		if err := tx.Create(&bom).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Failed to create BOM for material ID %d", item.MaterialID))
			continue
		}

		createdBOMs = append(createdBOMs, bom)
	}

	if len(createdBOMs) == 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "No BOM items were created",
			"errors": errors,
		})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Load relations for created BOMs
	for i := range createdBOMs {
		database.DB.Preload("Material").Preload("Project").First(&createdBOMs[i], createdBOMs[i].ID)
	}

	response := gin.H{
		"message": fmt.Sprintf("Successfully created %d BOM items", len(createdBOMs)),
		"data":    createdBOMs,
	}

	if len(errors) > 0 {
		response["warnings"] = errors
	}

	c.JSON(http.StatusCreated, response)
}

