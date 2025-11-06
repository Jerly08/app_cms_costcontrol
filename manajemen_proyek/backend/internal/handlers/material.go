package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/models"
	"github.com/unipro/project-management/pkg/database"
)

// GetAllMaterials returns all materials with optional filters
func GetAllMaterials(c *gin.Context) {
	category := c.Query("category")
	search := c.Query("search")

	query := database.DB.Model(&models.Material{})

	// Apply filters
	if category != "" {
		query = query.Where("category = ?", category)
	}

	if search != "" {
		query = query.Where("name LIKE ? OR code LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var materials []models.Material
	if err := query.Order("name ASC").Find(&materials).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch materials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": materials})
}

// GetMaterialByID returns a single material by ID
func GetMaterialByID(c *gin.Context) {
	id := c.Param("id")

	var material models.Material
	if err := database.DB.First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": material})
}

// CreateMaterial creates a new material
func CreateMaterial(c *gin.Context) {
	var input struct {
		Name        string  `json:"name" binding:"required"`
		Code        string  `json:"code" binding:"required"`
		Category    string  `json:"category" binding:"required"`
		Unit        string  `json:"unit" binding:"required"`
		UnitPrice   float64 `json:"unit_price" binding:"required"`
		Stock       float64 `json:"stock"`
		MinStock    float64 `json:"min_stock"`
		Supplier    string  `json:"supplier"`
		Description string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if code already exists
	var existing models.Material
	if err := database.DB.Where("code = ?", input.Code).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Material code already exists"})
		return
	}

	material := models.Material{
		Name:        input.Name,
		Code:        input.Code,
		Category:    models.MaterialCategory(input.Category),
		Unit:        input.Unit,
		UnitPrice:   input.UnitPrice,
		Stock:       input.Stock,
		MinStock:    input.MinStock,
		Supplier:    input.Supplier,
		Description: input.Description,
	}

	if err := database.DB.Create(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create material"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": material})
}

// UpdateMaterial updates an existing material
func UpdateMaterial(c *gin.Context) {
	id := c.Param("id")

	var material models.Material
	if err := database.DB.First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
		return
	}

	var input struct {
		Name        string  `json:"name"`
		Code        string  `json:"code"`
		Category    string  `json:"category"`
		Unit        string  `json:"unit"`
		UnitPrice   float64 `json:"unit_price"`
		Stock       float64 `json:"stock"`
		MinStock    float64 `json:"min_stock"`
		Supplier    string  `json:"supplier"`
		Description string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if new code conflicts with existing material
	if input.Code != "" && input.Code != material.Code {
		var existing models.Material
		if err := database.DB.Where("code = ? AND id != ?", input.Code, id).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Material code already exists"})
			return
		}
	}

	// Update fields
	if input.Name != "" {
		material.Name = input.Name
	}
	if input.Code != "" {
		material.Code = input.Code
	}
	if input.Category != "" {
		material.Category = models.MaterialCategory(input.Category)
	}
	if input.Unit != "" {
		material.Unit = input.Unit
	}
	if input.UnitPrice > 0 {
		material.UnitPrice = input.UnitPrice
	}
	if input.Stock >= 0 {
		material.Stock = input.Stock
	}
	if input.MinStock >= 0 {
		material.MinStock = input.MinStock
	}
	material.Supplier = input.Supplier
	material.Description = input.Description

	if err := database.DB.Save(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update material"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": material})
}

// DeleteMaterial soft deletes a material
func DeleteMaterial(c *gin.Context) {
	id := c.Param("id")

	var material models.Material
	if err := database.DB.First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
		return
	}

	// Check if material is used in BOM
	var bomCount int64
	database.DB.Model(&models.BOM{}).Where("material_id = ?", id).Count(&bomCount)
	if bomCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete material that is used in project BOMs",
		})
		return
	}

	// Soft delete
	if err := database.DB.Delete(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete material"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Material deleted successfully"})
}

// GetLowStockMaterials returns materials with stock below minimum threshold
func GetLowStockMaterials(c *gin.Context) {
	var materials []models.Material
	if err := database.DB.Where("stock <= min_stock").Order("stock ASC").Find(&materials).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch low stock materials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": materials})
}

// UpdateMaterialStock updates material stock (for stock adjustments)
func UpdateMaterialStock(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Adjustment float64 `json:"adjustment" binding:"required"` // Positive for increase, negative for decrease
		Reason     string  `json:"reason"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var material models.Material
	if err := database.DB.First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
		return
	}

	// Update stock
	newStock := material.Stock + input.Adjustment
	if newStock < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock"})
		return
	}

	material.Stock = newStock

	if err := database.DB.Save(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
		return
	}

	// Create notification if stock is low
	if material.IsLowStock() {
		go createLowStockNotification(material.ID, material.Name, material.Stock, material.MinStock)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    material,
		"message": "Stock updated successfully",
	})
}

// Helper function to create low stock notification
func createLowStockNotification(materialID uint, materialName string, currentStock, minStock float64) {
	// Get all users with roles that should be notified (director, manager, purchasing, cost_control)
	var users []models.User
	database.DB.Joins("JOIN roles ON users.role_id = roles.id").
		Where("roles.name IN ?", []string{"director", "manager", "purchasing", "cost_control", "ceo", "project_director"}).
		Find(&users)

	for _, user := range users {
		notification := models.Notification{
			UserID:  user.ID,
			Title:   "Low Stock Alert",
			Message: "Material '" + materialName + "' is low on stock. Current: " + 
				     floatToString(currentStock) + ", Minimum: " + floatToString(minStock),
			Type:    models.NotificationTypeSystem,
			IsRead:  false,
		}
		database.DB.Create(&notification)
	}
}

// Helper function to convert float to string
func floatToString(val float64) string {
	return string(rune(int(val))) // Simple conversion for notification
}

