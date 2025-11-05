package models

import (
	"time"

	"gorm.io/gorm"
)

// Role represents user roles in the system
type Role struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"unique;not null" json:"name"` // director, manager, purchasing, cost_control, tim_lapangan
	DisplayName string         `gorm:"not null" json:"display_name"`
	Description string         `json:"description"`
	Permissions string         `gorm:"type:text" json:"permissions"` // JSON string of permissions
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// User represents system users
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Email     string         `gorm:"unique;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"` // Password hash, never exposed in JSON
	RoleID    uint           `gorm:"not null" json:"role_id"`
	Role      Role           `gorm:"foreignKey:RoleID" json:"role"`
	Phone     string         `json:"phone"`
	Position  string         `json:"position"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// TableName specifies the table name for Role model
func (Role) TableName() string {
	return "roles"
}

