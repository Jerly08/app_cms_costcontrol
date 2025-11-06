package database

import (
	"fmt"
	"log"

	"github.com/unipro/project-management/config"
	"github.com/unipro/project-management/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect establishes database connection
func Connect(cfg *config.DatabaseConfig) error {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		cfg.Host,
		cfg.User,
		cfg.Password,
		cfg.DBName,
		cfg.Port,
		cfg.SSLMode,
		cfg.TimeZone,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("✓ Database connected successfully")
	return nil
}

// AutoMigrate runs database migrations
func AutoMigrate() error {
	log.Println("Running database migrations...")
	
	err := DB.AutoMigrate(
		// User & Auth
		&models.Role{},
		&models.User{},
		
		// Project Management
		&models.Project{},
		&models.ProgressBreakdown{},
		
		// Reports
		&models.DailyReport{},
		&models.Photo{},
		&models.WeeklyReport{},
		
		// Materials & BOM
		&models.Material{},
		&models.BOM{},
		&models.MaterialUsage{},
		
		// Purchase Requests
		&models.PurchaseRequest{},
		&models.PRItem{},
		&models.ApprovalHistory{},
		&models.PRComment{},
		
		// Approvals & Notifications
		&models.Approval{},
		&models.Notification{},
	)

	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("✓ Database migrations completed successfully")
	return nil
}

// SeedDefaultRoles creates default roles if they don't exist
func SeedDefaultRoles() error {
	log.Println("Seeding default roles...")
	
	defaultRoles := []models.Role{
		{
			Name:        "ceo",
			DisplayName: "Chief Executive Officer (CEO)",
			Description: "Highest authority - Full system access and final approval",
			Permissions: `{"all": true, "final_approval": true}`,
		},
		{
			Name:        "project_director",
			DisplayName: "Project Director",
			Description: "Full access to all projects - Christopher",
			Permissions: `{"all": true, "approval": true}`,
		},
		{
			Name:        "director",
			DisplayName: "Director",
			Description: "Full system access - can view and manage everything",
			Permissions: `{"all": true}`,
		},
		{
			Name:        "manager",
			DisplayName: "Manager/GM",
			Description: "Can manage projects and approve requests",
			Permissions: `{"projects": ["read", "write"], "reports": ["read", "write"], "approval": true}`,
		},
		{
			Name:        "cost_control",
			DisplayName: "Cost Control",
			Description: "Can verify and control project costs",
			Permissions: `{"projects": ["read"], "costs": ["read", "write", "verify"], "purchasing": ["read", "verify"]}`,
		},
		{
			Name:        "purchasing",
			DisplayName: "Purchasing",
			Description: "Can create and manage purchase requests",
			Permissions: `{"purchasing": ["read", "write"], "projects": ["read"]}`,
		},
		{
			Name:        "tim_lapangan",
			DisplayName: "Tim Lapangan",
			Description: "Can submit daily reports and update project progress",
			Permissions: `{"daily_reports": ["read", "write"], "projects": ["read", "update_progress"]}`,
		},
	}

	for _, role := range defaultRoles {
		var existing models.Role
		result := DB.Where("name = ?", role.Name).First(&existing)
		
		if result.Error == gorm.ErrRecordNotFound {
			if err := DB.Create(&role).Error; err != nil {
				return fmt.Errorf("failed to create role %s: %w", role.Name, err)
			}
			log.Printf("✓ Created role: %s", role.DisplayName)
		} else {
			log.Printf("→ Role already exists: %s", role.DisplayName)
		}
	}

	log.Println("✓ Default roles seeded successfully")
	return nil
}

// SeedDummyUsers creates dummy users for each role for testing
func SeedDummyUsers() error {
	log.Println("Seeding dummy users...")
	
	// Define dummy users
	dummyUsers := []struct {
		Name     string
		Email    string
		Password string // Plain password, will be hashed
		RoleName string
		IsActive bool
	}{
		{
			Name:     "Direktur Utama",
			Email:    "ceo@unipro.com",
			Password: "ceo123",
			RoleName: "ceo",
			IsActive: true,
		},
		{
			Name:     "Christopher (Project Director)",
			Email:    "christopher@unipro.com",
			Password: "christopher123",
			RoleName: "project_director",
			IsActive: true,
		},
		{
			Name:     "Director",
			Email:    "director@unipro.com",
			Password: "director123",
			RoleName: "director",
			IsActive: true,
		},
		{
			Name:     "General Manager",
			Email:    "manager@unipro.com",
			Password: "manager123",
			RoleName: "manager",
			IsActive: true,
		},
		{
			Name:     "Cost Control",
			Email:    "costcontrol@unipro.com",
			Password: "costcontrol123",
			RoleName: "cost_control",
			IsActive: true,
		},
		{
			Name:     "Purchasing Staff",
			Email:    "purchasing@unipro.com",
			Password: "purchasing123",
			RoleName: "purchasing",
			IsActive: true,
		},
		{
			Name:     "Tim Lapangan",
			Email:    "lapangan@unipro.com",
			Password: "lapangan123",
			RoleName: "tim_lapangan",
			IsActive: true,
		},
	}

	for _, userData := range dummyUsers {
		// Check if user already exists
		var existing models.User
		result := DB.Where("email = ?", userData.Email).First(&existing)
		
		if result.Error == gorm.ErrRecordNotFound {
			// Get role ID
			var role models.Role
			if err := DB.Where("name = ?", userData.RoleName).First(&role).Error; err != nil {
				log.Printf("⚠ Role not found for user %s: %s", userData.Email, userData.RoleName)
				continue
			}

			// Hash password
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(userData.Password), bcrypt.DefaultCost)
			if err != nil {
				return fmt.Errorf("failed to hash password for %s: %w", userData.Email, err)
			}

			// Create user
			user := models.User{
				Name:     userData.Name,
				Email:    userData.Email,
				Password: string(hashedPassword),
				RoleID:   role.ID,
				IsActive: userData.IsActive,
			}

			if err := DB.Create(&user).Error; err != nil {
				return fmt.Errorf("failed to create user %s: %w", userData.Email, err)
			}
			log.Printf("✓ Created user: %s (%s)", userData.Name, userData.RoleName)
		} else {
			log.Printf("→ User already exists: %s", userData.Email)
		}
	}

	log.Println("✓ Dummy users seeded successfully")
	log.Println("")
	log.Println("📝 Test Accounts (email / password):")
	log.Println("  CEO: ceo@unipro.com / ceo123")
	log.Println("  Project Director: christopher@unipro.com / christopher123")
	log.Println("  Director: director@unipro.com / director123")
	log.Println("  Manager: manager@unipro.com / manager123")
	log.Println("  Cost Control: costcontrol@unipro.com / costcontrol123")
	log.Println("  Purchasing: purchasing@unipro.com / purchasing123")
	log.Println("  Tim Lapangan: lapangan@unipro.com / lapangan123")
	log.Println("")
	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}

