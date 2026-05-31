package handlers

import (
	"fmt"
	"time"
	"xcash/backend/database"
	"xcash/backend/kafka"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func getDailySpent(userID string) float64 {
	today := time.Now().Truncate(24 * time.Hour)
	var total float64
	database.DB.Model(&models.Transaction{}).
		Where("sender_id = ? AND type IN ? AND status = ? AND created_at >= ?",
			userID, []string{"send_money", "cash_out", "payment", "bill_pay", "recharge"}, "success", today).
		Select("COALESCE(SUM(amount + fee), 0)").
		Scan(&total)
	return total
}

func SendMoney(c *fiber.Ctx) error {
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
	if !middleware.ValidatePhone(body.Phone) {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid receiver phone number"})
	}

	var receiver models.User
	if database.DB.Where("phone = ?", body.Phone).First(&receiver).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Receiver not found"})
	}
	if receiver.ID == sender.ID {
		return c.Status(400).JSON(fiber.Map{"message": "Cannot send to yourself"})
	}
	if receiver.Status == "blocked" {
		return c.Status(400).JSON(fiber.Map{"message": "Receiver account is inactive"})
	}

	// Daily limit enforcement
	spent := getDailySpent(sender.ID)
	if spent+body.Amount > sender.DailyLimit {
		remaining := sender.DailyLimit - spent
		return c.Status(400).JSON(fiber.Map{
			"message": fmt.Sprintf("Daily limit reached. You can send ৳%.2f more today.", remaining),
		})
	}

	// Fraud scoring
	var recentCount int64
	database.DB.Model(&models.Transaction{}).
		Where("sender_id = ? AND created_at > ?", sender.ID, time.Now().Add(-1*time.Hour)).
		Count(&recentCount)
	var senderBal models.Wallet
	database.DB.Where("user_id = ?", sender.ID).First(&senderBal)
	var prevTxCount int64
	database.DB.Model(&models.Transaction{}).Where("sender_id = ? AND receiver_id = ?", sender.ID, receiver.ID).Count(&prevTxCount)
	fs := middleware.ScoreTransaction(sender.ID, body.Amount, senderBal.Balance, prevTxCount == 0, time.Now().Hour(), int(recentCount))
	if fs.Block {
		return c.Status(400).JSON(fiber.Map{
			"message": "Transaction blocked by fraud protection. Please try a smaller amount or contact support.",
			"flags":   fs.Flags,
		})
	}

	var fee float64
	if body.Amount > 100 {
		fee = 5
	}
	total := body.Amount + fee
	var txRecord models.Transaction

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var senderWallet models.Wallet
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("user_id = ?", sender.ID).First(&senderWallet).Error; err != nil {
			return err
		}
		if senderWallet.Balance < total {
			return fiber.NewError(400, "Insufficient balance")
		}
		var receiverWallet models.Wallet
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("user_id = ?", receiver.ID).First(&receiverWallet).Error; err != nil {
			return err
		}
		if err := tx.Model(&senderWallet).Update("balance", senderWallet.Balance-total).Error; err != nil {
			return err
		}
		if err := tx.Model(&receiverWallet).Update("balance", receiverWallet.Balance+body.Amount).Error; err != nil {
			return err
		}
		txRecord = models.Transaction{
			SenderID:   sender.ID,
			ReceiverID: receiver.ID,
			Type:       "send_money",
			Amount:     body.Amount,
			Fee:        fee,
			Status:     "success",
			Note:       middleware.SanitizeString(body.Note),
			Ref:        fmt.Sprintf("XC%d", time.Now().UnixMilli()),
			Metadata:   "{}",
			FraudScore: fs.Score,
		}
		return tx.Create(&txRecord).Error
	})
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(fiber.Map{"message": e.Message})
		}
		return c.Status(500).JSON(fiber.Map{"message": "Transaction failed"})
	}

	database.DeleteCache(c.Context(),
		fmt.Sprintf("wallet:%s", sender.ID),
		fmt.Sprintf("wallet:%s", receiver.ID),
	)
	kafka.Publish(kafka.TopicTransactions, txRecord.ID, txRecord)
	kafka.Publish(kafka.TopicNotifications, sender.ID, kafka.NotificationEvent{
		UserID: sender.ID, Title: "Money Sent",
		Body: fmt.Sprintf("৳%.2f sent to %s", body.Amount, receiver.Name), Type: "send_money",
	})
	kafka.Publish(kafka.TopicNotifications, receiver.ID, kafka.NotificationEvent{
		UserID: receiver.ID, Title: "Money Received",
		Body: fmt.Sprintf("৳%.2f received from %s", body.Amount, sender.Name), Type: "send_money",
	})
	return c.JSON(fiber.Map{"transaction": txRecord})
}

func RequestMoney(c *fiber.Ctx) error {
	requester := middleware.GetUser(c)
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
	if !middleware.ValidatePhone(body.Phone) {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid phone number"})
	}

	var target models.User
	if database.DB.Where("phone = ?", body.Phone).First(&target).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "User not found"})
	}
	if target.ID == requester.ID {
		return c.Status(400).JSON(fiber.Map{"message": "Cannot request from yourself"})
	}

	tx := models.Transaction{
		SenderID:   target.ID,
		ReceiverID: requester.ID,
		Type:       "request_money",
		Amount:     body.Amount,
		Status:     "pending",
		Note:       middleware.SanitizeString(body.Note),
		Ref:        fmt.Sprintf("XC%d", time.Now().UnixMilli()),
		Metadata:   "{}",
	}
	database.DB.Create(&tx)

	kafka.Publish(kafka.TopicNotifications, target.ID, kafka.NotificationEvent{
		UserID: target.ID, Title: "Money Request",
		Body: fmt.Sprintf("%s requested ৳%.2f from you", requester.Name, body.Amount), Type: "request_money",
	})
	return c.JSON(fiber.Map{"transaction": tx, "message": "Request sent"})
}

func GetHistory(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var txs []models.Transaction
	database.DB.
		Where("sender_id = ? OR receiver_id = ?", user.ID, user.ID).
		Order("created_at DESC").
		Limit(50).
		Preload("Sender").
		Preload("Receiver").
		Find(&txs)
	return c.JSON(txs)
}
