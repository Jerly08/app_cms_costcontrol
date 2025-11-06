package models

import (
	"time"

	"gorm.io/gorm"
)

// PRStatus represents purchase request status
type PRStatus string

const (
	PRStatusPending  PRStatus = "pending"
	PRStatusApproved PRStatus = "approved"
	PRStatusRejected PRStatus = "rejected"
)

// PRPriority represents purchase request priority
type PRPriority string

const (
	PRPriorityLow    PRPriority = "low"
	PRPriorityNormal PRPriority = "normal"
	PRPriorityHigh   PRPriority = "high"
	PRPriorityUrgent PRPriority = "urgent"
)

// ApprovalStage represents the approval workflow stages
type ApprovalStage string

const (
	StagePurchasing   ApprovalStage = "Purchasing"
	StageCostControl  ApprovalStage = "Cost Control"
	StageGM           ApprovalStage = "GM"
)

// ApprovalHistoryStatus represents status for each approval stage
type ApprovalHistoryStatus string

const (
	StageStatusPending  ApprovalHistoryStatus = "pending"
	StageStatusApproved ApprovalHistoryStatus = "approved"
	StageStatusRejected ApprovalHistoryStatus = "rejected"
)

// PurchaseRequest represents a purchase request with multi-stage approval
type PurchaseRequest struct {
	ID            uint          `gorm:"primaryKey" json:"id"`
	PRNumber      string        `gorm:"unique;not null;index" json:"pr_number"` // Auto-generated: PR-YYYY-XXXX
	ProjectID     uint          `gorm:"not null;index" json:"project_id"`
	Project       *Project      `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	RequesterID   uint          `gorm:"not null;index" json:"requester_id"`
	Requester     *User         `gorm:"foreignKey:RequesterID" json:"requester,omitempty"`
	Title         string        `gorm:"not null" json:"title"`
	Description   string        `gorm:"type:text" json:"description"`
	Priority      PRPriority    `gorm:"type:varchar(20);default:'normal'" json:"priority"`
	Status        PRStatus      `gorm:"type:varchar(20);default:'pending'" json:"status"`
	TotalAmount   float64       `gorm:"type:decimal(15,2);not null" json:"total_amount"`
	RequiredDate  *time.Time    `json:"required_date,omitempty"`
	CurrentStage  ApprovalStage `gorm:"type:varchar(50);default:'Purchasing'" json:"current_stage"`
	Items         []PRItem      `gorm:"foreignKey:PurchaseRequestID" json:"items,omitempty"`
	ApprovalHistory []ApprovalHistory `gorm:"foreignKey:PurchaseRequestID" json:"approval_history,omitempty"`
	Comments      []PRComment   `gorm:"foreignKey:PurchaseRequestID" json:"comments,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// PRItem represents items in a purchase request
type PRItem struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	PurchaseRequestID uint           `gorm:"not null;index" json:"purchase_request_id"`
	MaterialID        uint           `gorm:"not null;index" json:"material_id"`
	Material          *Material      `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	Quantity          float64        `gorm:"type:decimal(15,2);not null" json:"quantity"`
	Unit              string         `gorm:"not null" json:"unit"`
	EstimatedPrice    float64        `gorm:"type:decimal(15,2);not null" json:"estimated_price"`
	TotalPrice        float64        `gorm:"type:decimal(15,2);not null" json:"total_price"` // Quantity * EstimatedPrice
	Vendor            string         `json:"vendor"`
	Notes             string         `gorm:"type:text" json:"notes"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

// ApprovalHistory tracks approval progress through each stage
type ApprovalHistory struct {
	ID                uint                  `gorm:"primaryKey" json:"id"`
	PurchaseRequestID uint                  `gorm:"not null;index" json:"purchase_request_id"`
	Stage             ApprovalStage         `gorm:"type:varchar(50);not null" json:"stage"`
	Status            ApprovalHistoryStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	ApproverID        *uint                 `json:"approver_id,omitempty"`
	Approver          *User                 `gorm:"foreignKey:ApproverID" json:"approver,omitempty"`
	Comment           string                `gorm:"type:text" json:"comment"`
	ApprovedAt        *time.Time            `json:"approved_at,omitempty"`
	CreatedAt         time.Time             `json:"created_at"`
	UpdatedAt         time.Time             `json:"updated_at"`
}

// PRComment represents comments/discussions on a purchase request
type PRComment struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	PurchaseRequestID uint           `gorm:"not null;index" json:"purchase_request_id"`
	UserID            uint           `gorm:"not null" json:"user_id"`
	User              *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Comment           string         `gorm:"type:text;not null" json:"comment"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for PurchaseRequest model
func (PurchaseRequest) TableName() string {
	return "purchase_requests"
}

// TableName specifies the table name for PRItem model
func (PRItem) TableName() string {
	return "pr_items"
}

// TableName specifies the table name for ApprovalHistory model
func (ApprovalHistory) TableName() string {
	return "approval_histories"
}

// TableName specifies the table name for PRComment model
func (PRComment) TableName() string {
	return "pr_comments"
}

// BeforeCreate hook to calculate total price for PR items
func (item *PRItem) BeforeCreate(tx *gorm.DB) error {
	item.TotalPrice = item.Quantity * item.EstimatedPrice
	return nil
}

// BeforeUpdate hook to calculate total price for PR items
func (item *PRItem) BeforeUpdate(tx *gorm.DB) error {
	item.TotalPrice = item.Quantity * item.EstimatedPrice
	return nil
}

// GetNextStage returns the next approval stage
func (pr *PurchaseRequest) GetNextStage() *ApprovalStage {
	switch pr.CurrentStage {
	case StagePurchasing:
		stage := StageCostControl
		return &stage
	case StageCostControl:
		stage := StageGM
		return &stage
	default:
		return nil // GM is the last stage
	}
}

// IsFullyApproved checks if PR has been approved by all stages
func (pr *PurchaseRequest) IsFullyApproved() bool {
	return pr.CurrentStage == StageGM && pr.Status == PRStatusApproved
}

