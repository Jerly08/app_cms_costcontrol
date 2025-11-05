package models

import (
	"time"

	"gorm.io/gorm"
)

// MaterialCategory represents material categories
type MaterialCategory string

const (
	CategoryStructural MaterialCategory = "Structural"
	CategoryElectrical MaterialCategory = "Electrical"
	CategoryPlumbing   MaterialCategory = "Plumbing"
	CategoryFinishing  MaterialCategory = "Finishing"
	CategoryOther      MaterialCategory = "Other"
)

// Material represents construction materials
type Material struct {
	ID          uint             `gorm:"primaryKey" json:"id"`
	Name        string           `gorm:"not null;index" json:"name"`
	Code        string           `gorm:"unique;not null" json:"code"` // SKU/Material code
	Category    MaterialCategory `gorm:"type:varchar(50);not null" json:"category"`
	Unit        string           `gorm:"not null" json:"unit"` // unit of measurement (kg, m3, pcs, etc.)
	UnitPrice   float64          `gorm:"type:decimal(15,2);not null" json:"unit_price"`
	Stock       float64          `gorm:"type:decimal(15,2);default:0" json:"stock"` // Current stock quantity
	MinStock    float64          `gorm:"type:decimal(15,2);default:0" json:"min_stock"` // Minimum stock threshold
	Supplier    string           `json:"supplier"`
	Description string           `gorm:"type:text" json:"description"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	DeletedAt   gorm.DeletedAt   `gorm:"index" json:"-"`
}

// BOM (Bill of Materials) represents material requirements for a project
type BOM struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	ProjectID      uint           `gorm:"not null;index" json:"project_id"`
	Project        *Project       `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	MaterialID     uint           `gorm:"not null;index" json:"material_id"`
	Material       *Material      `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	PlannedQty     float64        `gorm:"type:decimal(15,2);not null" json:"planned_qty"` // Planned quantity needed
	UsedQty        float64        `gorm:"type:decimal(15,2);default:0" json:"used_qty"` // Actually used quantity
	RemainingQty   float64        `gorm:"type:decimal(15,2)" json:"remaining_qty"` // Calculated: PlannedQty - UsedQty
	EstimatedCost  float64        `gorm:"type:decimal(15,2)" json:"estimated_cost"` // PlannedQty * UnitPrice
	ActualCost     float64        `gorm:"type:decimal(15,2);default:0" json:"actual_cost"` // UsedQty * UnitPrice
	Phase          string         `json:"phase"` // Construction phase (foundation, utilities, interior, equipment)
	Notes          string         `gorm:"type:text" json:"notes"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

// MaterialUsage represents material consumption records
type MaterialUsage struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	ProjectID     uint           `gorm:"not null;index" json:"project_id"`
	Project       *Project       `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	MaterialID    uint           `gorm:"not null;index" json:"material_id"`
	Material      *Material      `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	DailyReportID *uint          `gorm:"index" json:"daily_report_id,omitempty"`
	DailyReport   *DailyReport   `gorm:"foreignKey:DailyReportID" json:"daily_report,omitempty"`
	Quantity      float64        `gorm:"type:decimal(15,2);not null" json:"quantity"`
	Cost          float64        `gorm:"type:decimal(15,2)" json:"cost"`
	UsageDate     time.Time      `gorm:"not null;index" json:"usage_date"`
	UsedBy        uint           `gorm:"not null" json:"used_by"` // User ID who recorded the usage
	User          *User          `gorm:"foreignKey:UsedBy" json:"user,omitempty"`
	Notes         string         `gorm:"type:text" json:"notes"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for Material model
func (Material) TableName() string {
	return "materials"
}

// TableName specifies the table name for BOM model
func (BOM) TableName() string {
	return "boms"
}

// TableName specifies the table name for MaterialUsage model
func (MaterialUsage) TableName() string {
	return "material_usages"
}

// UpdateRemainingQty updates the remaining quantity
func (b *BOM) UpdateRemainingQty() {
	b.RemainingQty = b.PlannedQty - b.UsedQty
}

// CalculateUsagePercentage calculates material usage percentage
func (b *BOM) CalculateUsagePercentage() float64 {
	if b.PlannedQty == 0 {
		return 0
	}
	return (b.UsedQty / b.PlannedQty) * 100
}

// IsLowStock checks if material stock is below minimum threshold
func (m *Material) IsLowStock() bool {
	return m.Stock <= m.MinStock
}

