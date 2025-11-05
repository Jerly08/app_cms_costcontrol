package models

import (
	"time"

	"gorm.io/gorm"
)

// WeatherCondition represents weather conditions at the project site
type WeatherCondition string

const (
	WeatherSunny  WeatherCondition = "Sunny"
	WeatherCloudy WeatherCondition = "Cloudy"
	WeatherRainy  WeatherCondition = "Rainy"
	WeatherStormy WeatherCondition = "Stormy"
)

// DailyReport represents daily field report from construction site
type DailyReport struct {
	ID          uint             `gorm:"primaryKey" json:"id"`
	ProjectID   uint             `gorm:"not null;index" json:"project_id"`
	Project     *Project         `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Date        time.Time        `gorm:"not null;index" json:"date"`
	Activities  string           `gorm:"type:text;not null" json:"activities"` // Daily activities description
	Progress    float64          `gorm:"type:decimal(5,2)" json:"progress"`    // Daily progress percentage
	Weather     WeatherCondition `gorm:"type:varchar(20)" json:"weather"`
	Workers     int              `json:"workers"`                              // Number of workers present
	Notes       string           `gorm:"type:text" json:"notes"`               // Additional notes or issues
	Photos      []Photo          `gorm:"foreignKey:DailyReportID" json:"photos,omitempty"`
	ReportedBy  uint             `gorm:"not null" json:"reported_by"`
	Reporter    *User            `gorm:"foreignKey:ReportedBy" json:"reporter,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	DeletedAt   gorm.DeletedAt   `gorm:"index" json:"-"`
}

// Photo represents uploaded photos for daily reports
type Photo struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	DailyReportID uint           `gorm:"not null;index" json:"daily_report_id"`
	Filename      string         `gorm:"not null" json:"filename"`
	FilePath      string         `gorm:"not null" json:"file_path"`
	FileSize      int64          `json:"file_size"`
	MimeType      string         `json:"mime_type"`
	Caption       string         `json:"caption"`
	UploadedBy    uint           `gorm:"not null" json:"uploaded_by"`
	Uploader      *User          `gorm:"foreignKey:UploadedBy" json:"uploader,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// WeeklyReport represents auto-generated weekly summary report
type WeeklyReport struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	ProjectID   uint           `gorm:"not null;index" json:"project_id"`
	Project     *Project       `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	WeekNumber  int            `gorm:"not null" json:"week_number"`  // Week number in the year
	Year        int            `gorm:"not null" json:"year"`
	StartDate   time.Time      `gorm:"not null" json:"start_date"`
	EndDate     time.Time      `gorm:"not null" json:"end_date"`
	Summary     string         `gorm:"type:text" json:"summary"`     // Auto-generated summary
	TotalProgress float64      `gorm:"type:decimal(5,2)" json:"total_progress"`
	Achievements string         `gorm:"type:text" json:"achievements"` // Key achievements this week
	Issues      string         `gorm:"type:text" json:"issues"`      // Problems encountered
	NextWeekPlan string        `gorm:"type:text" json:"next_week_plan"`
	PDFPath     string         `json:"pdf_path"`                     // Path to generated PDF report
	GeneratedBy uint           `gorm:"not null" json:"generated_by"`
	Generator   *User          `gorm:"foreignKey:GeneratedBy" json:"generator,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for DailyReport model
func (DailyReport) TableName() string {
	return "daily_reports"
}

// TableName specifies the table name for Photo model
func (Photo) TableName() string {
	return "photos"
}

// TableName specifies the table name for WeeklyReport model
func (WeeklyReport) TableName() string {
	return "weekly_reports"
}

