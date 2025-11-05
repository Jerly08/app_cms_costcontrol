package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	jwtPkg "github.com/unipro/project-management/pkg/jwt"
)

// AuthMiddleware validates JWT token from request header
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			c.Abort()
			return
		}

		// Check Bearer token format
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization format. Use: Bearer <token>",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := jwtPkg.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Set user info in context for use in handlers
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role_id", claims.RoleID)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// RequireRole middleware checks if user has required role
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Role not found in context",
			})
			c.Abort()
			return
		}

		userRole := role.(string)

		// Check if user role is in allowed roles
		allowed := false
		
		// CEO, Project Director, and Director have full access
		if userRole == "ceo" || userRole == "project_director" || userRole == "director" {
			allowed = true
		} else {
			// Check specific roles
			for _, allowedRole := range allowedRoles {
				if userRole == allowedRole {
					allowed = true
					break
				}
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Insufficient permissions",
				"message": "You don't have permission to access this resource",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetUserID gets user ID from context
func GetUserID(c *gin.Context) uint {
	userID, _ := c.Get("user_id")
	return userID.(uint)
}

// GetUserRole gets user role from context
func GetUserRole(c *gin.Context) string {
	role, _ := c.Get("role")
	return role.(string)
}

