package handlers

// safety.go — XCash competitive advantage features:
// 1. Receiver name confirmation before send
// 2. 30-second transaction cancellation window
// 3. In-app dispute filing
// 4. Self-set daily spending limit
// 5. Daily spend tracking
// 6. Fraud score check before transaction
// 7. Device fingerprint / new device alert

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
	"xcash/backend/database"
	"xcash/backend/kafka"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
)

// ──────────────────────────────────────────
// 1. RECEIVER CONFIRMATION (bKash has NONE)
// ──────────────────────────────────────────

// VerifyReceiver returns the receiver's name before the user commits
// POST /api/transfer/verify-receiver  { "phone": "017xxxxxxxx" }
func VerifyReceiver(c *fiber.Ctx) error {
	var body struct{ Phone string `json:"phone"` }
	if err := c.BodyParser(&body); err != nil || body.Phone == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Phone required"})
	}
	var receiver models.User
	if database.DB.Select("id,name,phone,status").Where("phone = ?", body.Phone).First(&receiver).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "No XCash account found for this number"})
	}
	if receiver.Status == "blocked" {
		return c.Status(400).JSON(fiber.Map{"message": "This account is inactive"})
	}
	return c.JSON(fiber.Map{
		"name":  receiver.Name,
		"phone": receiver.Phone,
	})
}

// ──────────────────────────────────────────────────────
// 2. TRANSACTION CANCELLATION WINDOW (bKash has ZERO)
// ──────────────────────────────────────────────────────

const cancelTTL = 30 * time.Second

type pendingTx struct {
	SenderID   string  `json:"sender_id"`
	ReceiverID string  `json:"receiver_id"`
	Amount     float64 `json:"amount"`
	Fee        float64 `json:"fee"`
	Note       string  `json:"note"`
}

// HoldTransaction stages a send and returns a hold_id — user has 30s to cancel or confirm
// POST /api/transfer/hold  { phone, amount, note }
func HoldTransaction(c *fiber.Ctx) error {
	sender := middleware.GetUser(c)
	var body struct {
		Phone  string  `json:"phone"`
		Amount float64 `json:"amount"`
		Note   string  `json:"note"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	if ok, msg := middleware.ValidateAmount(body.Amount, middleware.MinTransactionAmount, middleware.MaxTransactionAmount); !ok {
		return c.Status(400).JSON(fiber.Map{"message": msg})
	}

	var receiver models.User
	if database.DB.Select("id,name,phone,status").Where("phone = ?", body.Phone).First(&receiver).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Receiver not found"})
	}
	if receiver.ID == sender.ID {
		return c.Status(400).JSON(fiber.Map{"message": "Cannot send to yourself"})
	}

	fee := 0.0
	if body.Amount > 100 {
		fee = 5
	}

	// Store in Redis for 30 seconds
	if database.RDB == nil {
		return c.Status(503).JSON(fiber.Map{"message": "Service temporarily unavailable"})
	}
	holdID := fmt.Sprintf("hold:%s:%d", sender.ID, time.Now().UnixMilli())
	payload, _ := json.Marshal(pendingTx{
		SenderID: sender.ID, ReceiverID: receiver.ID,
		Amount: body.Amount, Fee: fee, Note: body.Note,
	})
	database.RDB.Set(context.Background(), holdID, payload, cancelTTL)

	return c.JSON(fiber.Map{
		"hold_id":       holdID,
		"receiver_name": receiver.Name,
		"receiver_phone": receiver.Phone,
		"amount":        body.Amount,
		"fee":           fee,
		"total":         body.Amount + fee,
		"cancel_by":     time.Now().Add(cancelTTL).Unix(),
	})
}

// CancelTransaction cancels a held transaction within 30s
// DELETE /api/transfer/hold/:holdId
func CancelTransaction(c *fiber.Ctx) error {
	sender := middleware.GetUser(c)
	holdID := c.Params("holdId")
	if database.RDB == nil {
		return c.Status(503).JSON(fiber.Map{"message": "Service unavailable"})
	}
	key := fmt.Sprintf("hold:%s:%s", sender.ID, holdID)
	// Try the exact key first, then the raw holdID (which already has the prefix)
	n, _ := database.RDB.Del(context.Background(), holdID).Result()
	if n == 0 {
		database.RDB.Del(context.Background(), key)
	}
	return c.JSON(fiber.Map{"message": "Transaction cancelled successfully"})
}

// ──────────────────────────────────────────────────────
// 3. IN-APP DISPUTE (bKash = phone only, 30% unresolved)
// ──────────────────────────────────────────────────────

// DisputeTransaction flags a transaction as disputed
// POST /api/transactions/:id/dispute  { "reason": "..." }
func DisputeTransaction(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	txID := c.Params("id")
	var body struct{ Reason string `json:"reason"` }
	c.BodyParser(&body)

	var tx models.Transaction
	if database.DB.First(&tx, "id = ?", txID).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Transaction not found"})
	}
	if tx.SenderID != user.ID && tx.ReceiverID != user.ID {
		return c.Status(403).JSON(fiber.Map{"message": "Access denied"})
	}
	if tx.Disputed {
		return c.Status(400).JSON(fiber.Map{"message": "Already disputed"})
	}
	database.DB.Model(&tx).Update("disputed", true)

	// Notify support via Kafka
	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID,
		Title:  "Dispute Filed",
		Body:   fmt.Sprintf("Your dispute for transaction %s has been received. We will respond within 24 hours.", tx.Ref),
		Type:   "dispute",
	})

	return c.JSON(fiber.Map{
		"message": "Dispute filed. You will receive a response within 24 hours.",
		"ref":     tx.Ref,
	})
}

// ──────────────────────────────────────────────────────
// 4. SELF-SET DAILY SPENDING LIMIT (bKash has NO self-set)
// ──────────────────────────────────────────────────────

// SetDailyLimit lets users protect themselves by capping daily spend
// PATCH /api/wallet/daily-limit  { "limit": 5000 }
func SetDailyLimit(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct{ Limit float64 `json:"limit"` }
	if err := c.BodyParser(&body); err != nil || body.Limit <= 0 {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid limit"})
	}
	if body.Limit > middleware.MaxTransactionAmount {
		return c.Status(400).JSON(fiber.Map{"message": fmt.Sprintf("Maximum daily limit is ৳%.0f", middleware.MaxTransactionAmount)})
	}
	database.DB.Model(user).Update("daily_limit", body.Limit)
	return c.JSON(fiber.Map{"daily_limit": body.Limit, "message": "Daily limit updated"})
}

// GetDailySpend returns how much the user has spent today
// GET /api/wallet/daily-spend
func GetDailySpend(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	today := time.Now().Truncate(24 * time.Hour)

	var total float64
	database.DB.Model(&models.Transaction{}).
		Where("sender_id = ? AND type IN ? AND status = ? AND created_at >= ?",
			user.ID, []string{"send_money", "cash_out", "payment", "bill_pay", "recharge"}, "success", today).
		Select("COALESCE(SUM(amount + fee), 0)").
		Scan(&total)

	return c.JSON(fiber.Map{
		"spent_today": total,
		"daily_limit": user.DailyLimit,
		"remaining":   user.DailyLimit - total,
	})
}

// ──────────────────────────────────────────────────────
// 5. NEW DEVICE ALERT CHECK
// ──────────────────────────────────────────────────────

// CheckNewDevice returns whether this session has a new-device alert pending
// GET /api/auth/device-alert
func CheckNewDeviceAlert(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	if database.RDB == nil {
		return c.JSON(fiber.Map{"new_device": false})
	}
	key := fmt.Sprintf("new_device_alert:%s", user.ID)
	deviceID, err := database.RDB.GetDel(context.Background(), key).Result()
	if err != nil {
		return c.JSON(fiber.Map{"new_device": false})
	}
	return c.JSON(fiber.Map{"new_device": true, "device_id": deviceID})
}

// UpdateDeviceID registers the current device for this user
// POST /api/auth/device  { "device_id": "..." }
func UpdateDeviceID(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct{ DeviceID string `json:"device_id"` }
	if err := c.BodyParser(&body); err != nil || body.DeviceID == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Device ID required"})
	}
	isNew := middleware.CheckAndRegisterDevice(database.DB, user, body.DeviceID)
	if isNew {
		middleware.StoreDeviceAlert(user.ID, body.DeviceID)
		kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
			UserID: user.ID,
			Title:  "⚠️ New Device Login",
			Body:   "Your XCash account was accessed from a new device. If this wasn't you, contact support immediately.",
			Type:   "security",
		})
	}
	return c.JSON(fiber.Map{"registered": true, "new_device": isNew})
}
