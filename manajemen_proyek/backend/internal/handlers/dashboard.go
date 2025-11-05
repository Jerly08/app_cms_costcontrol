package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/internal/models"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

// GetDashboard returns role-specific dashboard data
func (h *DashboardHandler) GetDashboard(c *gin.Context) {
	// Get user from context (set by auth middleware)
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	user := userInterface.(*models.User)

	// Preload role
	if err := h.db.Preload("Role").First(&user, user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load user data"})
		return
	}

	// Return dashboard data based on role
	switch user.Role.Name {
	case "ceo", "project_director", "director":
		h.getDirectorDashboard(c, user)
	case "manager":
		h.getManagerDashboard(c, user)
	case "cost_control":
		h.getCostControlDashboard(c, user)
	case "purchasing":
		h.getPurchasingDashboard(c, user)
	case "tim_lapangan":
		h.getFieldDashboard(c, user)
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
	}
}

// Director Dashboard - Full overview
func (h *DashboardHandler) getDirectorDashboard(c *gin.Context, user *models.User) {
	var stats struct {
		TotalProjects    int64   `json:"total_projects"`
		ActiveProjects   int64   `json:"active_projects"`
		CompletedProjects int64  `json:"completed_projects"`
		TotalBudget      float64 `json:"total_budget"`
		TotalSpent       float64 `json:"total_spent"`
		OverBudgetCount  int64   `json:"over_budget_count"`
	}

	// Get project statistics
	h.db.Model(&models.Project{}).Count(&stats.TotalProjects)
	h.db.Model(&models.Project{}).Where("status != ?", models.StatusCompleted).Count(&stats.ActiveProjects)
	h.db.Model(&models.Project{}).Where("status = ?", models.StatusCompleted).Count(&stats.CompletedProjects)
	h.db.Model(&models.Project{}).Where("status = ?", models.StatusOverBudget).Count(&stats.OverBudgetCount)

	// Get budget summary
	h.db.Model(&models.Project{}).Select("COALESCE(SUM(estimated_cost), 0)").Scan(&stats.TotalBudget)
	h.db.Model(&models.Project{}).Select("COALESCE(SUM(actual_cost), 0)").Scan(&stats.TotalSpent)

	// Get pending approvals
	var pendingApprovals int64
	h.db.Model(&models.Approval{}).Where("status = ?", models.ApprovalStatusPending).Count(&pendingApprovals)

	// Get recent projects
	var recentProjects []models.Project
	h.db.Preload("Manager").Order("created_at DESC").Limit(5).Find(&recentProjects)

	// Get material alerts (low stock)
	var lowStockMaterials []models.Material
	h.db.Raw("SELECT * FROM materials WHERE stock <= min_stock AND deleted_at IS NULL").Scan(&lowStockMaterials)

	// Get cost variance by project
	var projectCostVariance []map[string]interface{}
	h.db.Model(&models.Project{}).
		Select("id, name, estimated_cost, actual_cost, progress, status, ((actual_cost - estimated_cost) / NULLIF(estimated_cost, 0) * 100) as variance_percentage").
		Where("status != ?", models.StatusCompleted).
		Order("variance_percentage DESC").
		Limit(10).
		Find(&projectCostVariance)

	c.JSON(http.StatusOK, gin.H{
		"role":                  user.Role.Name,
		"stats":                 stats,
		"pending_approvals":     pendingApprovals,
		"recent_projects":       recentProjects,
		"low_stock_materials":   lowStockMaterials,
		"project_cost_variance": projectCostVariance,
	})
}

// Manager Dashboard - Project management focus
func (h *DashboardHandler) getManagerDashboard(c *gin.Context, user *models.User) {
	var stats struct {
		MyProjects       int64   `json:"my_projects"`
		ActiveProjects   int64   `json:"active_projects"`
		TotalBudget      float64 `json:"total_budget"`
		TotalSpent       float64 `json:"total_spent"`
	}

	// Get projects managed by this user
	h.db.Model(&models.Project{}).Where("manager_id = ?", user.ID).Count(&stats.MyProjects)
	h.db.Model(&models.Project{}).Where("manager_id = ? AND status != ?", user.ID, models.StatusCompleted).Count(&stats.ActiveProjects)

	// Get budget for managed projects
	h.db.Model(&models.Project{}).Where("manager_id = ?", user.ID).Select("COALESCE(SUM(estimated_cost), 0)").Scan(&stats.TotalBudget)
	h.db.Model(&models.Project{}).Where("manager_id = ?", user.ID).Select("COALESCE(SUM(actual_cost), 0)").Scan(&stats.TotalSpent)

	// Get pending approvals assigned to this manager
	var pendingApprovals []models.Approval
	h.db.Preload("Requester").Preload("Project").
		Where("approver_id = ? AND status = ?", user.ID, models.ApprovalStatusPending).
		Order("created_at DESC").
		Limit(10).
		Find(&pendingApprovals)

	// Get my projects
	var myProjects []models.Project
	h.db.Where("manager_id = ?", user.ID).Order("created_at DESC").Limit(10).Find(&myProjects)

	// Get recent daily reports
	var recentReports []models.DailyReport
	h.db.Preload("Project").Preload("Reporter").
		Joins("JOIN projects ON daily_reports.project_id = projects.id").
		Where("projects.manager_id = ?", user.ID).
		Order("daily_reports.date DESC").
		Limit(5).
		Find(&recentReports)

	c.JSON(http.StatusOK, gin.H{
		"role":              user.Role.Name,
		"stats":             stats,
		"pending_approvals": pendingApprovals,
		"my_projects":       myProjects,
		"recent_reports":    recentReports,
	})
}

// Cost Control Dashboard - Budget verification focus
func (h *DashboardHandler) getCostControlDashboard(c *gin.Context, user *models.User) {
	var stats struct {
		TotalBudget        float64 `json:"total_budget"`
		TotalSpent         float64 `json:"total_spent"`
		OverBudgetProjects int64   `json:"over_budget_projects"`
		VariancePercentage float64 `json:"variance_percentage"`
	}

	// Get overall budget statistics
	h.db.Model(&models.Project{}).Select("COALESCE(SUM(estimated_cost), 0)").Scan(&stats.TotalBudget)
	h.db.Model(&models.Project{}).Select("COALESCE(SUM(actual_cost), 0)").Scan(&stats.TotalSpent)
	h.db.Model(&models.Project{}).Where("status = ?", models.StatusOverBudget).Count(&stats.OverBudgetProjects)

	if stats.TotalBudget > 0 {
		stats.VariancePercentage = ((stats.TotalSpent - stats.TotalBudget) / stats.TotalBudget) * 100
	}

	// Get pending purchase approvals for verification
	var pendingVerifications []models.Approval
	h.db.Preload("Requester").Preload("Project").
		Where("type = ? AND status = ?", models.ApprovalTypePurchase, models.ApprovalStatusPending).
		Order("created_at DESC").
		Limit(10).
		Find(&pendingVerifications)

	// Get projects with high cost variance
	var highVarianceProjects []map[string]interface{}
	h.db.Model(&models.Project{}).
		Select("id, name, estimated_cost, actual_cost, progress, status, ((actual_cost - estimated_cost) / NULLIF(estimated_cost, 0) * 100) as variance_percentage").
		Where("actual_cost > estimated_cost * 0.95"). // Projects using >95% of budget
		Order("variance_percentage DESC").
		Limit(10).
		Find(&highVarianceProjects)

	// Get material cost summary
	var materialCostSummary []map[string]interface{}
	h.db.Raw(`
		SELECT 
			m.category,
			COUNT(DISTINCT bom.project_id) as project_count,
			SUM(bom.estimated_cost) as total_estimated,
			SUM(bom.actual_cost) as total_actual,
			((SUM(bom.actual_cost) - SUM(bom.estimated_cost)) / NULLIF(SUM(bom.estimated_cost), 0) * 100) as variance_percentage
		FROM materials m
		LEFT JOIN boms bom ON m.id = bom.material_id
		WHERE bom.deleted_at IS NULL
		GROUP BY m.category
	`).Scan(&materialCostSummary)

	c.JSON(http.StatusOK, gin.H{
		"role":                   user.Role.Name,
		"stats":                  stats,
		"pending_verifications":  pendingVerifications,
		"high_variance_projects": highVarianceProjects,
		"material_cost_summary":  materialCostSummary,
	})
}

// Purchasing Dashboard - Material and vendor management focus
func (h *DashboardHandler) getPurchasingDashboard(c *gin.Context, user *models.User) {
	var stats struct {
		TotalMaterials   int64 `json:"total_materials"`
		LowStockCount    int64 `json:"low_stock_count"`
		PendingPRCount   int64 `json:"pending_pr_count"`
		ApprovedPRCount  int64 `json:"approved_pr_count"`
	}

	// Get material statistics
	h.db.Model(&models.Material{}).Count(&stats.TotalMaterials)
	h.db.Model(&models.Material{}).Where("stock <= min_stock").Count(&stats.LowStockCount)

	// Get purchase request statistics
	h.db.Model(&models.Approval{}).
		Where("type = ? AND status = ? AND requester_id = ?", models.ApprovalTypePurchase, models.ApprovalStatusPending, user.ID).
		Count(&stats.PendingPRCount)
	h.db.Model(&models.Approval{}).
		Where("type = ? AND status = ? AND requester_id = ?", models.ApprovalTypePurchase, models.ApprovalStatusApproved, user.ID).
		Count(&stats.ApprovedPRCount)

	// Get low stock materials
	var lowStockMaterials []models.Material
	h.db.Where("stock <= min_stock").Order("stock ASC").Limit(10).Find(&lowStockMaterials)

	// Get my purchase requests
	var myPurchaseRequests []models.Approval
	h.db.Preload("Project").Preload("Approver").
		Where("requester_id = ? AND type = ?", user.ID, models.ApprovalTypePurchase).
		Order("created_at DESC").
		Limit(10).
		Find(&myPurchaseRequests)

	// Get recent material usage
	var recentUsage []models.MaterialUsage
	h.db.Preload("Material").Preload("Project").
		Order("usage_date DESC").
		Limit(10).
		Find(&recentUsage)

	c.JSON(http.StatusOK, gin.H{
		"role":                 user.Role.Name,
		"stats":                stats,
		"low_stock_materials":  lowStockMaterials,
		"my_purchase_requests": myPurchaseRequests,
		"recent_usage":         recentUsage,
	})
}

// Field Dashboard - Daily report and progress tracking focus
func (h *DashboardHandler) getFieldDashboard(c *gin.Context, user *models.User) {
	var stats struct {
		MyReportsToday     int64 `json:"my_reports_today"`
		MyReportsThisWeek  int64 `json:"my_reports_this_week"`
		MyReportsThisMonth int64 `json:"my_reports_this_month"`
	}

	today := time.Now().Truncate(24 * time.Hour)
	weekStart := today.AddDate(0, 0, -int(today.Weekday()))
	monthStart := time.Date(today.Year(), today.Month(), 1, 0, 0, 0, 0, today.Location())

	// Get report statistics
	h.db.Model(&models.DailyReport{}).
		Where("reported_by = ? AND date >= ?", user.ID, today).
		Count(&stats.MyReportsToday)
	h.db.Model(&models.DailyReport{}).
		Where("reported_by = ? AND date >= ?", user.ID, weekStart).
		Count(&stats.MyReportsThisWeek)
	h.db.Model(&models.DailyReport{}).
		Where("reported_by = ? AND date >= ?", user.ID, monthStart).
		Count(&stats.MyReportsThisMonth)

	// Get active projects
	var activeProjects []models.Project
	h.db.Where("status != ?", models.StatusCompleted).
		Order("updated_at DESC").
		Limit(10).
		Find(&activeProjects)

	// Get my recent reports
	var myRecentReports []models.DailyReport
	h.db.Preload("Project").Preload("Photos").
		Where("reported_by = ?", user.ID).
		Order("date DESC").
		Limit(10).
		Find(&myRecentReports)

	// Get pending tasks / reports needed (projects without today's report)
	var projectsNeedingReport []models.Project
	h.db.Raw(`
		SELECT p.* FROM projects p
		WHERE p.status != ? 
		AND NOT EXISTS (
			SELECT 1 FROM daily_reports dr 
			WHERE dr.project_id = p.id 
			AND dr.reported_by = ? 
			AND dr.date >= ?
			AND dr.deleted_at IS NULL
		)
		AND p.deleted_at IS NULL
		ORDER BY p.updated_at DESC
		LIMIT 5
	`, models.StatusCompleted, user.ID, today).Scan(&projectsNeedingReport)

	c.JSON(http.StatusOK, gin.H{
		"role":                    user.Role.Name,
		"stats":                   stats,
		"active_projects":         activeProjects,
		"my_recent_reports":       myRecentReports,
		"projects_needing_report": projectsNeedingReport,
	})
}

