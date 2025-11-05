package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/unipro/project-management/internal/models"
)

var jwtSecret []byte

// Claims represents JWT claims structure
type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	RoleID uint   `json:"role_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Initialize sets the JWT secret key
func Initialize(secret string) {
	jwtSecret = []byte(secret)
}

// GenerateToken creates a new JWT token for a user
func GenerateToken(user *models.User, expiry time.Duration) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID: user.ID,
		Email:  user.Email,
		RoleID: user.RoleID,
		Role:   user.Role.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "unipro-project-management",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateToken validates and parses a JWT token
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// RefreshToken generates a new token with extended expiry
func RefreshToken(tokenString string, expiry time.Duration) (string, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return "", err
	}

	// Create new token with fresh expiry
	now := time.Now()
	claims.ExpiresAt = jwt.NewNumericDate(now.Add(expiry))
	claims.IssuedAt = jwt.NewNumericDate(now)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

