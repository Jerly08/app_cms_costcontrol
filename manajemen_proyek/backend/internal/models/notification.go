package models

import (
	"time"

	"gorm.io/gorm"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeApprovalRequest  NotificationType = "approval_request"
	NotificationTypeApprovalApproved NotificationType = "approval_approved"
	NotificationTypeApprovalRejected NotificationType = "approval_rejected"
	NotificationTypeProjectUpdate    NotificationType = "project_update"
	NotificationTypeSystem           NotificationType = "system"
)

// Notification represents a user notification
type Notification struct {
	ID        uint             `gorm:"primaryKey" json:"id"`
	UserID    uint             `gorm:"not null;index" json:"user_id"`
	User      *User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Title     string           `gorm:"not null" json:"title"`
	Message   string           `gorm:"type:text" json:"message"`
	Type      NotificationType `gorm:"type:varchar(50);default:'system'" json:"type"`
	RelatedID *uint            `json:"related_id,omitempty"` // ID of related approval, project, etc.
	IsRead    bool             `gorm:"default:false;index" json:"is_read"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
	DeletedAt gorm.DeletedAt   `gorm:"index" json:"-"`
}

// TableName specifies the table name for Notification model
func (Notification) TableName() string {
	return "notifications"
}

