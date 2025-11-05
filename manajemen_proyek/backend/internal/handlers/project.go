package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/middleware"
	"github.com/unipro/project-management/internal/models"
	"gorm.io/gorm"
)

type ProjectHandler struct {
	DB *gorm.DB
}

// CreateProjectRequest represents project creation request
type CreateProjectRequest struct {
	Name          string                    `json:"name" binding:"required"`
	Description   string                    `json:"description"`
	Customer      string                    `json:"customer"`
	City          string                    `json:"city"`
	Address       string                    `json:"address"`
	ProjectType   models.ProjectType        `json:"project_type"`
	EstimatedCost float64                   `json:"estimated_cost" binding:"required"`
	StartDate     string                    `json:"start_date" binding:"required"`
	EndDate       string                    `json:"end_date" binding:"required"`
	Deadline      string                    `json:"deadline"`
	ManagerID     uint                      `json:"manager_id"`
}

// NewProjectHandler creates a new project handler
func NewProjectHandler(db *gorm.DB) *ProjectHandler {
	return &ProjectHandler{DB: db}
}

// GetAllProjects returns all projects (filtered by user role)
func (h *ProjectHandler) GetAllProjects(c *gin.Context) {
	userRole := middleware.GetUserRole(c)
	userID := middleware.GetUserID(c)

	var projects []models.Project
	query := h.DB.Preload("Manager").Preload("Manager.Role").Preload("ProgressBreakdown")

	// Filter based on role
	if userRole != "director" && userRole != "manager" {
		// Non-managers only see projects they're involved in
		query = query.Where("manager_id = ?", userID)
	}

	if err := query.Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch projects",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projects,
		"total":    len(projects),
	})
}

// GetProjectByID returns a single project
func (h *ProjectHandler) GetProjectByID(c *gin.Context) {
	id := c.Param("id")
	projectID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	var project models.Project
	if err := h.DB.Preload("Manager").Preload("Manager.Role").
		Preload("ProgressBreakdown").
		First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Project not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch project",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"project": project,
	})
}

// CreateProject creates a new project
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Parse dates (simplified - should use proper date parsing)
	project := models.Project{
		Name:          req.Name,
		Description:   req.Description,
		Customer:      req.Customer,
		City:          req.City,
		Address:       req.Address,
		ProjectType:   req.ProjectType,
		EstimatedCost: req.EstimatedCost,
		ActualCost:    0,
		Progress:      0,
		Status:        models.StatusOnTrack,
		ManagerID:     req.ManagerID,
	}

	// Start transaction
	tx := h.DB.Begin()
	if err := tx.Create(&project).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create project",
		})
		return
	}

	// Create progress breakdown
	progressBreakdown := models.ProgressBreakdown{
		ProjectID:  project.ID,
		Foundation: 0,
		Utilities:  0,
		Interior:   0,
		Equipment:  0,
	}

	if err := tx.Create(&progressBreakdown).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create progress breakdown",
		})
		return
	}

	tx.Commit()

	// Load relations
	h.DB.Preload("Manager").Preload("ProgressBreakdown").First(&project, project.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Project created successfully",
		"project": project,
	})
}

// UpdateProject updates an existing project
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	id := c.Param("id")
	projectID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	var project models.Project
	if err := h.DB.First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Project not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch project",
		})
		return
	}

	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Update fields
	project.Name = req.Name
	project.Description = req.Description
	project.Customer = req.Customer
	project.City = req.City
	project.Address = req.Address
	project.ProjectType = req.ProjectType
	project.EstimatedCost = req.EstimatedCost

	// Update status based on variance
	project.UpdateStatus()

	if err := h.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update project",
		})
		return
	}

	// Load relations
	h.DB.Preload("Manager").Preload("ProgressBreakdown").First(&project, project.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Project updated successfully",
		"project": project,
	})
}

// DeleteProject deletes a project (soft delete)
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	id := c.Param("id")
	projectID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	if err := h.DB.Delete(&models.Project{}, projectID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete project",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project deleted successfully",
	})
}

// UpdateProgress updates project progress
func (h *ProjectHandler) UpdateProgress(c *gin.Context) {
	id := c.Param("id")
	projectID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	var req struct {
		Progress      float64 `json:"progress"`
		Foundation    float64 `json:"foundation"`
		Utilities     float64 `json:"utilities"`
		Interior      float64 `json:"interior"`
		Equipment     float64 `json:"equipment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Update project progress
	var project models.Project
	if err := h.DB.First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Project not found",
		})
		return
	}

	project.Progress = req.Progress
	project.UpdateStatus()

	if err := h.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update progress",
		})
		return
	}

	// Update progress breakdown
	var breakdown models.ProgressBreakdown
	if err := h.DB.Where("project_id = ?", projectID).First(&breakdown).Error; err != nil {
		// Create if not exists
		breakdown = models.ProgressBreakdown{
			ProjectID: uint(projectID),
		}
	}

	breakdown.Foundation = req.Foundation
	breakdown.Utilities = req.Utilities
	breakdown.Interior = req.Interior
	breakdown.Equipment = req.Equipment

	if err := h.DB.Save(&breakdown).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update progress breakdown",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Progress updated successfully",
		"project": project,
		"breakdown": breakdown,
	})
}

