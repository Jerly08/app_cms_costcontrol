package models

import (
	"time"

	"gorm.io/gorm"
)

// ApprovalStatus represents the status of an approval request
type ApprovalStatus string

const (
	ApprovalStatusPending  ApprovalStatus = "pending"
	ApprovalStatusApproved ApprovalStatus = "approved"
	ApprovalStatusRejected ApprovalStatus = "rejected"
)

// ApprovalType represents the type of approval
type ApprovalType string

const (
	ApprovalTypeBudget   ApprovalType = "budget"
	ApprovalTypePurchase ApprovalType = "purchase"
	ApprovalTypeProject  ApprovalType = "project"
	ApprovalTypeReport   ApprovalType = "report"
)

// Approval represents an approval request
type Approval struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Title         string         `gorm:"not null" json:"title"`
	Description   string         `gorm:"type:text" json:"description"`
	Type          ApprovalType   `gorm:"type:varchar(50);not null" json:"type"`
	Status        ApprovalStatus `gorm:"type:varchar(50);default:'pending'" json:"status"`
	Amount        *float64       `gorm:"type:decimal(15,2)" json:"amount,omitempty"` // For budget/purchase approvals
	ProjectID     *uint          `json:"project_id,omitempty"`
	Project       *Project       `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	RequesterID   uint           `gorm:"not null" json:"requester_id"`
	Requester     *User          `gorm:"foreignKey:RequesterID" json:"requester,omitempty"`
	ApproverID    uint           `gorm:"not null" json:"approver_id"`
	Approver      *User          `gorm:"foreignKey:ApproverID" json:"approver,omitempty"`
	ApprovedAt    *time.Time     `json:"approved_at,omitempty"`
	ApprovalNotes string         `gorm:"type:text" json:"approval_notes,omitempty"` // Notes from approver
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for Approval model
func (Approval) TableName() string {
	return "approvals"
}

