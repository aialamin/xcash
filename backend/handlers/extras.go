package handlers

import (
	"fmt"
	"math/rand"
	"time"
	"xcash/backend/database"
	"xcash/backend/kafka"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ── CHANGE PIN ──
func ChangePIN(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		CurrentPIN string `json:"current_pin"`
		NewPIN     string `json:"new_pin"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	if !user.CheckPin(body.CurrentPIN) {
		middleware.RecordFailedLogin(user.Phone)
		return c.Status(401).JSON(fiber.Map{"message": "Current PIN is incorrect"})
	}
	if ok, msg := middleware.ValidatePIN(body.NewPIN); !ok {
		return c.Status(400).JSON(fiber.Map{"message": msg})
	}
	if err := user.HashPin(body.NewPIN); err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Server error"})
	}
	database.DB.Model(user).Update("pin", user.Pin)
	middleware.ClearLoginAttempts(user.Phone)
	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: "PIN Changed",
		Body: "Your Pocket PIN was changed successfully. If this wasn't you, contact support immediately.", Type: "security",
	})
	return c.JSON(fiber.Map{"message": "PIN changed successfully"})
}

// ── ACCOUNT FREEZE ──
func FreezeAccount(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct{ Freeze bool `json:"freeze"` }
	c.BodyParser(&body)
	status := "active"
	if body.Freeze { status = "frozen" }
	database.DB.Model(user).Update("status", status)
	database.DeleteCache(c.Context(), "user:"+user.ID)
	msg := "Account unfrozen successfully"
	if body.Freeze { msg = "Account frozen. No transactions can be made until unfrozen." }
	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: map[bool]string{true: "Account Frozen", false: "Account Unfrozen"}[body.Freeze],
		Body: msg, Type: "security",
	})
	return c.JSON(fiber.Map{"message": msg, "status": status})
}

// ── LOGIN HISTORY ──
func GetLoginHistory(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var history []models.LoginHistory
	database.DB.Where("user_id = ?", user.ID).Order("created_at DESC").Limit(20).Find(&history)
	return c.JSON(history)
}

func RecordLogin(userID, deviceID, ip, status string) {
	database.DB.Create(&models.LoginHistory{
		UserID: userID, DeviceID: deviceID,
		IPAddress: ip, Status: status,
	})
}

// ── SPENDING ANALYTICS ──
func GetSpendingAnalytics(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	period := c.Query("period", "month") // week, month, year

	var since time.Time
	now := time.Now()
	switch period {
	case "week":  since = now.AddDate(0, 0, -7)
	case "year":  since = now.AddDate(-1, 0, 0)
	default:      since = now.AddDate(0, -1, 0)
	}

	type CategoryTotal struct {
		Type  string  `json:"type"`
		Total float64 `json:"total"`
		Count int64   `json:"count"`
	}
	var byCategory []CategoryTotal
	database.DB.Model(&models.Transaction{}).
		Select("type, SUM(amount) as total, COUNT(*) as count").
		Where("sender_id = ? AND status = ? AND created_at >= ?", user.ID, "success", since).
		Group("type").Scan(&byCategory)

	type DailyTotal struct {
		Day   string  `json:"day"`
		Total float64 `json:"total"`
	}
	var daily []DailyTotal
	database.DB.Model(&models.Transaction{}).
		Select("DATE(created_at) as day, SUM(amount) as total").
		Where("sender_id = ? AND status = ? AND created_at >= ?", user.ID, "success", since).
		Group("DATE(created_at)").Order("day").Scan(&daily)

	var totalSpent float64
	database.DB.Model(&models.Transaction{}).
		Where("sender_id = ? AND status = ? AND created_at >= ?", user.ID, "success", since).
		Select("COALESCE(SUM(amount+fee),0)").Scan(&totalSpent)

	return c.JSON(fiber.Map{
		"period":       period,
		"total_spent":  totalSpent,
		"by_category":  byCategory,
		"daily":        daily,
	})
}

// ── PAYMENT LINKS ──
func CreatePaymentLink(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		Amount      float64 `json:"amount"`
		Description string  `json:"description"`
		MaxUses     int     `json:"max_uses"`
	}
	c.BodyParser(&body)

	code := fmt.Sprintf("%s%06d", user.Phone[len(user.Phone)-4:], rand.Intn(999999))
	link := models.PaymentLink{
		UserID:      user.ID,
		Code:        code,
		Amount:      body.Amount,
		Description: body.Description,
		MaxUses:     body.MaxUses,
	}
	database.DB.Create(&link)
	return c.Status(201).JSON(fiber.Map{
		"link": link,
		"url":  fmt.Sprintf("pocket://pay-link/%s", code),
		"share_text": fmt.Sprintf("Pay %s using Pocket:\npocket://pay-link/%s", user.Name, code),
	})
}

func GetPaymentLink(c *fiber.Ctx) error {
	code := c.Params("code")
	var link models.PaymentLink
	if database.DB.Preload("User").Where("code = ? AND active = true", code).First(&link).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Payment link not found or expired"})
	}
	if link.MaxUses > 0 && link.Uses >= link.MaxUses {
		return c.Status(400).JSON(fiber.Map{"message": "Payment link has reached maximum uses"})
	}
	return c.JSON(fiber.Map{
		"receiver_name":  link.User.Name,
		"receiver_phone": link.User.Phone,
		"amount":         link.Amount,
		"description":    link.Description,
	})
}

func GetMyPaymentLinks(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var links []models.PaymentLink
	database.DB.Where("user_id = ?", user.ID).Order("created_at DESC").Find(&links)
	return c.JSON(links)
}

func DeactivatePaymentLink(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id := c.Params("id")
	database.DB.Model(&models.PaymentLink{}).Where("id = ? AND user_id = ?", id, user.ID).Update("active", false)
	return c.JSON(fiber.Map{"message": "Payment link deactivated"})
}

// ── REFERRAL PROGRAM ──
func GetReferralCode(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	code := fmt.Sprintf("PKT%s", user.Phone[len(user.Phone)-6:])
	var count int64
	database.DB.Model(&models.Referral{}).Where("referrer_id = ?", user.ID).Count(&count)
	var rewarded int64
	database.DB.Model(&models.Referral{}).Where("referrer_id = ? AND rewarded = true", user.ID).Count(&rewarded)
	return c.JSON(fiber.Map{
		"code":          code,
		"total_refs":    count,
		"rewarded_refs": rewarded,
		"reward_per_ref": 50,
		"share_text":    fmt.Sprintf("Join Pocket — Bangladesh's fastest MFS!\nUse my code %s to get ৳50 on signup.\nDownload: pocket://join/%s", code, code),
	})
}

func ApplyReferral(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct{ Code string `json:"code"` }
	if err := c.BodyParser(&body); err != nil || body.Code == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Referral code required"})
	}

	// Check already used referral
	var existing models.Referral
	if database.DB.Where("referred_id = ?", user.ID).First(&existing).Error == nil {
		return c.Status(400).JSON(fiber.Map{"message": "You have already used a referral code"})
	}

	// Find referrer by phone suffix
	phone := body.Code[3:] // strip "PKT"
	var referrer models.User
	if database.DB.Where("phone LIKE ?", "%"+phone).First(&referrer).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Invalid referral code"})
	}
	if referrer.ID == user.ID {
		return c.Status(400).JSON(fiber.Map{"message": "Cannot use your own referral code"})
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Create referral record
		ref := models.Referral{ReferrerID: referrer.ID, ReferredID: user.ID, Code: body.Code, Rewarded: true}
		tx.Create(&ref)
		// Reward referrer ৳50
		tx.Model(&models.Wallet{}).Where("user_id = ?", referrer.ID).
			UpdateColumn("balance", gorm.Expr("balance + ?", 50))
		// Reward new user ৳50
		tx.Model(&models.Wallet{}).Where("user_id = ?", user.ID).
			UpdateColumn("balance", gorm.Expr("balance + ?", 50))
		return nil
	})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Failed to apply referral"})
	}

	database.DeleteCache(c.Context(), fmt.Sprintf("wallet:%s", user.ID), fmt.Sprintf("wallet:%s", referrer.ID))
	kafka.Publish(kafka.TopicNotifications, referrer.ID, kafka.NotificationEvent{
		UserID: referrer.ID, Title: "Referral Bonus!",
		Body: fmt.Sprintf("%s joined using your code. ৳50 added to your wallet!", user.Name), Type: "reward",
	})
	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: "Welcome Bonus!",
		Body: "৳50 added to your wallet for using a referral code!", Type: "reward",
	})
	return c.JSON(fiber.Map{"message": "Referral applied! ৳50 added to your wallet"})
}
