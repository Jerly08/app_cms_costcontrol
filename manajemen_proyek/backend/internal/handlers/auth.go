package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/unipro/project-management/config"
	"github.com/unipro/project-management/internal/models"
	jwtPkg "github.com/unipro/project-management/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB     *gorm.DB
	Config *config.Config
}

// LoginRequest represents login request body
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest represents registration request body
type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Phone    string `json:"phone"`
	Position string `json:"position"`
	RoleID   uint   `json:"role_id" binding:"required"`
}

// LoginResponse represents login response
type LoginResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		DB:     db,
		Config: cfg,
	}
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Find user by email (username is email)
	var user models.User
	if err := h.DB.Preload("Role").Where("email = ?", req.Username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid credentials",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database error",
		})
		return
	}

	// Check if user is active
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Account is deactivated",
		})
		return
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	// Generate JWT token
	token, err := jwtPkg.GenerateToken(&user, h.Config.JWT.Expiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	// Remove password from response
	user.Password = ""

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login successful",
		"data": gin.H{
			"access_token":  token,
			"refresh_token": token, // For now, using same token
			"user":          &user,
		},
	})
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Check if email already exists
	var existingUser models.User
	if err := h.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Email already registered",
		})
		return
	}

	// Check if role exists
	var role models.Role
	if err := h.DB.First(&role, req.RoleID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID",
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to hash password",
		})
		return
	}

	// Create user
	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		RoleID:   req.RoleID,
		Phone:    req.Phone,
		Position: req.Position,
		IsActive: true,
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	// Load role for response
	h.DB.Preload("Role").First(&user, user.ID)

	// Generate JWT token
	token, err := jwtPkg.GenerateToken(&user, h.Config.JWT.Expiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	// Remove password from response
	user.Password = ""

	c.JSON(http.StatusCreated, LoginResponse{
		Token: token,
		User:  &user,
	})
}

// RefreshToken generates a new token
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Get token from header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authorization header required",
		})
		return
	}

	// Extract token
	token := authHeader[7:] // Remove "Bearer " prefix

	// Refresh token
	newToken, err := jwtPkg.RefreshToken(token, h.Config.JWT.Expiry)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": newToken,
	})
}

// Me returns current user info
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	var user models.User
	if err := h.DB.Preload("Role").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	// Remove password
	user.Password = ""

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

