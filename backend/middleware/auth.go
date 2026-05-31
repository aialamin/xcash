package middleware

import (
	"strings"
	"xcash/backend/config"
	"xcash/backend/database"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func Auth(c *fiber.Ctx) error {
	header := c.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return c.Status(401).JSON(fiber.Map{"message": "Missing token"})
	}
	tokenStr := strings.TrimPrefix(header, "Bearer ")
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
		return []byte(config.App.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"message": "Invalid token"})
	}

	var user models.User
	if result := database.DB.First(&user, "id = ?", claims.UserID); result.Error != nil {
		return c.Status(401).JSON(fiber.Map{"message": "User not found"})
	}
	if user.Status == "blocked" {
		return c.Status(403).JSON(fiber.Map{"message": "Account blocked"})
	}

	c.Locals("user", &user)
	return c.Next()
}

func GetUser(c *fiber.Ctx) *models.User {
	return c.Locals("user").(*models.User)
}
