package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/config"
	"github.com/unipro/project-management/internal/handlers"
	"github.com/unipro/project-management/internal/middleware"
	"github.com/unipro/project-management/pkg/database"
	jwtPkg "github.com/unipro/project-management/pkg/jwt"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()
	
	log.Println("🚀 Starting Unipro Project Management API...")
	log.Printf("📝 Environment: %s", cfg.Server.Env)
	
	// Connect to database
	log.Println("📦 Connecting to MySQL database...")
	if err := database.Connect(&cfg.Database); err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	
	// Run migrations
	log.Println("🔄 Running database migrations...")
	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("❌ Failed to run migrations: %v", err)
	}
	
	// Seed default roles
	log.Println("🌱 Seeding default data...")
	if err := database.SeedDefaultRoles(); err != nil {
		log.Fatalf("❌ Failed to seed roles: %v", err)
	}
	
	// Seed dummy users for testing
	if err := database.SeedDummyUsers(); err != nil {
		log.Fatalf("❌ Failed to seed users: %v", err)
	}
	
	// Initialize JWT
	jwtPkg.Initialize(cfg.JWT.Secret)
	
	// Setup Gin router
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	
	router := gin.Default()
	
	// CORS middleware - must be first
	router.Use(corsMiddleware())
	
	// Serve static files
	router.Static("/static", "./static")
	router.Static("/uploads", "./uploads")
	
	// Root route - redirect to login
	router.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/static/login.html")
	})
	
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Unipro Project Management API is running",
			"version": "1.0.0",
		})
	})
	
	// Initialize handlers
	db := database.GetDB()
	authHandler := handlers.NewAuthHandler(db, cfg)
	projectHandler := handlers.NewProjectHandler(db)
	dashboardHandler := handlers.NewDashboardHandler(db)
	reportHandler := handlers.NewReportHandler(db)
	photoHandler := handlers.NewPhotoHandler(db)
	
	// API v1 routes group
	v1 := router.Group("/api/v1")
	{
		// Public routes (no auth required)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/refresh", authHandler.RefreshToken)
		}
		
		// Protected routes (auth required)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Current user info
			protected.GET("/me", authHandler.Me)
			
			// Dashboard - role-specific metrics
			protected.GET("/dashboard", dashboardHandler.GetDashboard)
			
			// Projects routes
			projects := protected.Group("/projects")
			{
				projects.GET("", projectHandler.GetAllProjects)
				projects.GET("/:id", projectHandler.GetProjectByID)
				
				// Only managers and directors can create/update/delete
				projects.POST("", middleware.RequireRole("director", "manager"), projectHandler.CreateProject)
				projects.PUT("/:id", middleware.RequireRole("director", "manager"), projectHandler.UpdateProject)
				projects.DELETE("/:id", middleware.RequireRole("director", "manager"), projectHandler.DeleteProject)
				
				// Tim lapangan can update progress
				projects.PATCH("/:id/progress", middleware.RequireRole("director", "manager", "tim_lapangan"), projectHandler.UpdateProgress)
			}
			
			// Approvals routes
			approvals := protected.Group("/approvals")
			{
				approvals.GET("", handlers.GetApprovals)
				approvals.GET("/:id", handlers.GetApprovalByID)
				approvals.POST("", handlers.CreateApproval)
				approvals.PUT("/:id/status", handlers.UpdateApprovalStatus)
			}
			
			// Notifications routes
			notifications := protected.Group("/notifications")
			{
				notifications.GET("", handlers.GetNotifications)
				notifications.GET("/unread-count", handlers.GetUnreadCount)
				notifications.PUT("/:id/read", handlers.MarkAsRead)
				notifications.PUT("/mark-all-read", handlers.MarkAllAsRead)
				notifications.DELETE("/:id", handlers.DeleteNotification)
			}
			
			// Reports routes
			reports := protected.Group("/reports")
			{
				// Daily reports
				reports.GET("/daily", reportHandler.GetDailyReports)
				reports.GET("/daily/:id", reportHandler.GetDailyReportByID)
				reports.POST("/daily", middleware.RequireRole("tim_lapangan", "manager", "director"), reportHandler.CreateDailyReport)
				reports.PUT("/daily/:id", reportHandler.UpdateDailyReport)
				reports.DELETE("/daily/:id", reportHandler.DeleteDailyReport)
				
				// Photo uploads for daily reports
				reports.POST("/daily/:id/photos", middleware.RequireRole("tim_lapangan", "manager", "director"), photoHandler.UploadPhotos)
				reports.GET("/daily/:id/photos", photoHandler.GetPhotosByReport)
				
				// Weekly reports
				reports.GET("/weekly", reportHandler.GetWeeklyReports)
				reports.GET("/weekly/:id", reportHandler.GetWeeklyReportByID)
				reports.POST("/weekly/generate", middleware.RequireRole("manager", "director"), reportHandler.GenerateWeeklyReport)
				reports.GET("/weekly/:id/pdf", reportHandler.DownloadWeeklyReportPDF)
			}
			
			// Photos routes
			photos := protected.Group("/photos")
			{
				photos.DELETE("/:id", photoHandler.DeletePhoto)
			}
			
			// TODO: Users management routes
			// TODO: Materials management routes
			// TODO: Purchase Request routes
		}
	}
	
	// Start server
	serverAddr := fmt.Sprintf(":%s", cfg.Server.Port)
	log.Printf("✅ Server started successfully on http://localhost%s", serverAddr)
	log.Printf("📋 API Documentation: http://localhost%s/health", serverAddr)
	log.Printf("🔗 API Endpoint: http://localhost%s/api/v1", serverAddr)
	log.Println("\n👉 Press Ctrl+C to stop the server")
	
	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}

// CORS middleware
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

