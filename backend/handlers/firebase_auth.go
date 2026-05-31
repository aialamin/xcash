package handlers

import (
	"strings"
	"xcash/backend/database"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
)

// FirebaseLogin handles phone-verified login
// POST /api/auth/firebase-login
// Body: { phone, pin, firebase_token }
//
// Flow:
//  1. Verify Firebase ID token → confirms phone ownership
//  2. Match phone to XCash user
//  3. Verify PIN → issues XCash JWT
func FirebaseLogin(c *fiber.Ctx) error {
	var body struct {
		Phone         string `json:"phone"`
		PIN           string `json:"pin"`
		FirebaseToken string `json:"firebase_token"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	if body.Phone == "" || body.PIN == "" || body.FirebaseToken == "" {
		return c.Status(400).JSON(fiber.Map{"message": "phone, pin and firebase_token required"})
	}

	// If Firebase is not configured, fall back to standard login
	if database.FirebaseAuth == nil {
		return Login(c)
	}

	// 1. Verify Firebase token — confirms user owns this phone number
	firebasePhone, err := database.VerifyFirebaseToken(c.Context(), body.FirebaseToken)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"message": "Invalid or expired OTP. Please try again."})
	}

	// Normalise: Firebase returns +8801XXXXXXXXX, we store 01XXXXXXXXX
	normalised := strings.TrimPrefix(firebasePhone, "+88")
	if normalised == "" {
		normalised = body.Phone // fallback
	}

	// 2. Find XCash user
	var user models.User
	if database.DB.Where("phone = ?", normalised).First(&user).Error != nil {
		// Phone verified but no account — prompt to register
		return c.Status(404).JSON(fiber.Map{
			"message":        "No XCash account found for this number. Please register.",
			"phone_verified": true,
		})
	}

	// 3. Check PIN
	if !user.CheckPin(body.PIN) {
		middleware.RecordFailedLogin(user.Phone)
		return c.Status(401).JSON(fiber.Map{"message": "Incorrect PIN"})
	}
	if user.Status == "blocked" {
		return c.Status(403).JSON(fiber.Map{"message": "Account blocked. Contact support."})
	}

	middleware.ClearLoginAttempts(user.Phone)
	token, _ := generateToken(user.ID, user.Role)
	return c.JSON(fiber.Map{
		"token":          token,
		"phone_verified": true,
		"user":           fiber.Map{"id": user.ID, "name": user.Name, "phone": user.Phone, "role": user.Role},
	})
}

// FirebaseRegister creates an account after Firebase phone verification
// POST /api/auth/firebase-register
// Body: { name, phone, pin, nid, firebase_token }
func FirebaseRegister(c *fiber.Ctx) error {
	var body struct {
		Name          string `json:"name"`
		Phone         string `json:"phone"`
		PIN           string `json:"pin"`
		NID           string `json:"nid"`
		Email         string `json:"email"`
		FirebaseToken string `json:"firebase_token"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}

	// If Firebase not configured, fall back to standard register
	if database.FirebaseAuth == nil {
		return Register(c)
	}

	// Verify Firebase token
	firebasePhone, err := database.VerifyFirebaseToken(c.Context(), body.FirebaseToken)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"message": "Phone verification expired. Please verify again."})
	}

	// Ensure the phone in the token matches the submitted phone
	normalised := strings.TrimPrefix(firebasePhone, "+88")
	if normalised != body.Phone {
		return c.Status(400).JSON(fiber.Map{"message": "Phone number mismatch. Please re-verify."})
	}

	// Validate inputs
	if body.Name == "" || body.Phone == "" || body.PIN == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Name, phone and PIN are required"})
	}
	if !middleware.ValidatePhone(body.Phone) {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid phone number"})
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
	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Failed to create account"})
	}

	wallet := models.Wallet{UserID: user.ID, Balance: 0}
	database.DB.Create(&wallet)

	token, _ := generateToken(user.ID, user.Role)
	return c.Status(201).JSON(fiber.Map{
		"token":          token,
		"phone_verified": true,
		"user":           fiber.Map{"id": user.ID, "name": user.Name, "phone": user.Phone, "role": user.Role},
	})
}
