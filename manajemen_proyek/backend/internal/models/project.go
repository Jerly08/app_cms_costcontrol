package models

import (
	"time"

	"gorm.io/gorm"
)

// ProjectStatus represents the status of a project
type ProjectStatus string

const (
	StatusOnTrack    ProjectStatus = "On Track"
	StatusWarning    ProjectStatus = "Warning"
	StatusOverBudget ProjectStatus = "Over Budget"
	StatusCompleted  ProjectStatus = "Completed"
	StatusOnHold     ProjectStatus = "On Hold"
)

// ProjectType represents the type of construction project
type ProjectType string

const (
	TypeNewBuild  ProjectType = "New Build"
	TypeRenovation ProjectType = "Renovation"
	TypeExpansion ProjectType = "Expansion"
)

// Project represents a construction project
type Project struct {
	ID             uint              `gorm:"primaryKey" json:"id"`
	Name           string            `gorm:"not null" json:"name"`
	Description    string            `gorm:"type:text" json:"description"`
	Customer       string            `json:"customer"`
	City           string            `json:"city"`
	Address        string            `gorm:"type:text" json:"address"`
	ProjectType    ProjectType       `gorm:"type:varchar(50);default:'New Build'" json:"project_type"`
	EstimatedCost  float64           `gorm:"type:decimal(15,2);not null" json:"estimated_cost"`
	ActualCost     float64           `gorm:"type:decimal(15,2);default:0" json:"actual_cost"`
	Progress       float64           `gorm:"type:decimal(5,2);default:0" json:"progress"` // Overall progress percentage
	Status         ProjectStatus     `gorm:"type:varchar(50);default:'On Track'" json:"status"`
	StartDate      time.Time         `json:"start_date"`
	EndDate        time.Time         `json:"end_date"`
	Deadline       *time.Time        `json:"deadline,omitempty"`
	
	// Relations
	ManagerID      uint              `json:"manager_id"`
	Manager        *User             `gorm:"foreignKey:ManagerID" json:"manager,omitempty"`
	DailyReports   []DailyReport     `gorm:"foreignKey:ProjectID" json:"daily_reports,omitempty"`
	WeeklyReports  []WeeklyReport    `gorm:"foreignKey:ProjectID" json:"weekly_reports,omitempty"`
	ProgressBreakdown *ProgressBreakdown `gorm:"foreignKey:ProjectID" json:"progress_breakdown,omitempty"`
	
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
	DeletedAt      gorm.DeletedAt    `gorm:"index" json:"-"`
}

// ProgressBreakdown tracks detailed progress per construction phase
type ProgressBreakdown struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	ProjectID  uint           `gorm:"unique;not null" json:"project_id"`
	Foundation float64        `gorm:"type:decimal(5,2);default:0" json:"foundation"` // %
	Utilities  float64        `gorm:"type:decimal(5,2);default:0" json:"utilities"`  // %
	Interior   float64        `gorm:"type:decimal(5,2);default:0" json:"interior"`   // %
	Equipment  float64        `gorm:"type:decimal(5,2);default:0" json:"equipment"`  // %
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for Project model
func (Project) TableName() string {
	return "projects"
}

// TableName specifies the table name for ProgressBreakdown model
func (ProgressBreakdown) TableName() string {
	return "progress_breakdowns"
}

// CalculateVariance calculates the variance between estimated and actual cost
func (p *Project) CalculateVariance() float64 {
	if p.EstimatedCost == 0 {
		return 0
	}
	return ((p.ActualCost - p.EstimatedCost) / p.EstimatedCost) * 100
}

// UpdateStatus updates project status based on cost variance
func (p *Project) UpdateStatus() {
	variance := p.CalculateVariance()
	
	if p.Progress >= 100 {
		p.Status = StatusCompleted
	} else if variance > 5 {
		p.Status = StatusOverBudget
	} else if variance > 0 {
		p.Status = StatusWarning
	} else {
		p.Status = StatusOnTrack
	}
}

