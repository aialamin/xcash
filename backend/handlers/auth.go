package handlers

import (
	"fmt"
	"time"
	"xcash/backend/config"
	"xcash/backend/database"
	"xcash/backend/kafka"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func generateToken(userID, role string) (string, error) {
	claims := middleware.Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(config.App.JWTExpiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.App.JWTSecret))
}

func Register(c *fiber.Ctx) error {
	var body struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
		PIN   string `json:"pin"`
		NID   string `json:"nid"`
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}

	body.Name = middleware.SanitizeString(body.Name)
	body.Phone = middleware.SanitizeString(body.Phone)

	if body.Name == "" || body.Phone == "" || body.PIN == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Name, phone and PIN are required"})
	}
	if !middleware.ValidatePhone(body.Phone) {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid phone number. Must be a valid Bangladeshi number (e.g. 01712345678)"})
	}
	if ok, msg := middleware.ValidatePIN(body.PIN); !ok {
		return c.Status(400).JSON(fiber.Map{"message": msg})
	}

	var existing models.User
	if database.DB.Where("phone = ?", body.Phone).First(&existing).Error == nil {
		return c.Status(400).JSON(fiber.Map{"message": "Phone already registered"})
	}

	user := models.User{Name: body.Name, Phone: body.Phone, NID: body.NID, Email: body.Email}
	if err := user.HashPin(body.PIN); err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Server error"})
	}
	if result := database.DB.Create(&user); result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Failed to create account"})
	}

	wallet := models.Wallet{UserID: user.ID, Balance: 0}
	database.DB.Create(&wallet)

	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: "Welcome to XCash!",
		Body: fmt.Sprintf("Hi %s, your account is ready.", user.Name), Type: "general",
	})

	token, _ := generateToken(user.ID, user.Role)
	return c.Status(201).JSON(fiber.Map{
		"token": token,
		"user":  fiber.Map{"id": user.ID, "name": user.Name, "phone": user.Phone, "role": user.Role},
	})
}

func Login(c *fiber.Ctx) error {
	var body struct {
		Phone string `json:"phone"`
		PIN   string `json:"pin"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}

	var user models.User
	if database.DB.Where("phone = ?", body.Phone).First(&user).Error != nil {
		middleware.RecordFailedLogin(body.Phone)
		return c.Status(401).JSON(fiber.Map{"message": "Invalid phone or PIN"})
	}
	if !user.CheckPin(body.PIN) {
		middleware.RecordFailedLogin(body.Phone)
		return c.Status(401).JSON(fiber.Map{"message": "Invalid phone or PIN"})
	}
	if user.Status == "blocked" {
		return c.Status(403).JSON(fiber.Map{"message": "Account blocked. Contact support."})
	}

	middleware.ClearLoginAttempts(body.Phone)
	token, _ := generateToken(user.ID, user.Role)
	return c.JSON(fiber.Map{
		"token": token,
		"user":  fiber.Map{"id": user.ID, "name": user.Name, "phone": user.Phone, "role": user.Role},
	})
}

// VerifyPIN is called server-side before any sensitive transaction
func VerifyPIN(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		PIN string `json:"pin"`
	}
	if err := c.BodyParser(&body); err != nil || body.PIN == "" {
		return c.Status(400).JSON(fiber.Map{"message": "PIN required"})
	}
	if !user.CheckPin(body.PIN) {
		middleware.RecordFailedLogin(user.Phone)
		return c.Status(401).JSON(fiber.Map{"message": "Incorrect PIN"})
	}
	middleware.ClearLoginAttempts(user.Phone)
	return c.JSON(fiber.Map{"verified": true})
}

func GetProfile(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	return c.JSON(user)
}

func UpdateProfile(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	database.DB.Model(user).Updates(models.User{Name: middleware.SanitizeString(body.Name), Email: body.Email})
	database.DeleteCache(c.Context(), "user:"+user.ID)
	return c.JSON(user)
}
