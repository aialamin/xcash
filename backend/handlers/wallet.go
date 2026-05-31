package handlers

import (
	"fmt"
	"math"
	"time"
	"xcash/backend/database"
	"xcash/backend/kafka"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func GetBalance(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	cacheKey := fmt.Sprintf("wallet:%s", user.ID)

	var wallet models.Wallet
	if err := database.GetCache(c.Context(), cacheKey, &wallet); err == nil {
		return c.JSON(wallet)
	}
	if result := database.DB.Where("user_id = ?", user.ID).First(&wallet); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Wallet not found"})
	}
	database.SetCache(c.Context(), cacheKey, wallet, 60*time.Second)
	return c.JSON(wallet)
}

func AddMoney(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		Amount float64 `json:"amount"`
		Source string  `json:"source"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	if ok, msg := middleware.ValidateAmount(body.Amount, middleware.MinTransactionAmount, middleware.MaxAddMoneyAmount); !ok {
		return c.Status(400).JSON(fiber.Map{"message": msg})
	}

	var newBalance float64
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var wallet models.Wallet
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("user_id = ?", user.ID).First(&wallet).Error; err != nil {
			return err
		}
		newBalance = wallet.Balance + body.Amount
		if err := tx.Model(&wallet).Update("balance", newBalance).Error; err != nil {
			return err
		}
		record := models.Transaction{
			ReceiverID: user.ID,
			Type:       "add_money",
			Amount:     body.Amount,
			Status:     "success",
			Ref:        fmt.Sprintf("XC%d", time.Now().UnixMilli()),
			Metadata:   fmt.Sprintf(`{"source":"%s"}`, body.Source),
		}
		return tx.Create(&record).Error
	})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Transaction failed"})
	}

	database.DeleteCache(c.Context(), fmt.Sprintf("wallet:%s", user.ID))
	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: "Money Added",
		Body: fmt.Sprintf("৳%.2f added via %s", body.Amount, body.Source), Type: "add_money",
	})
	return c.JSON(fiber.Map{"wallet_balance": newBalance})
}

func CashOut(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		Amount     float64 `json:"amount"`
		AgentPhone string  `json:"agent_phone"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	if ok, msg := middleware.ValidateAmount(body.Amount, middleware.MinTransactionAmount, middleware.MaxTransactionAmount); !ok {
		return c.Status(400).JSON(fiber.Map{"message": msg})
	}
	if body.AgentPhone == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Agent phone required"})
	}

	fee := math.Ceil(body.Amount * 0.018)
	total := body.Amount + fee
	var txRecord models.Transaction

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var wallet models.Wallet
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("user_id = ?", user.ID).First(&wallet).Error; err != nil {
			return err
		}
		if wallet.Balance < total {
			return fiber.NewError(400, "Insufficient balance")
		}
		if err := tx.Model(&wallet).Update("balance", wallet.Balance-total).Error; err != nil {
			return err
		}
		txRecord = models.Transaction{
			SenderID: user.ID,
			Type:     "cash_out",
			Amount:   body.Amount,
			Fee:      fee,
			Status:   "success",
			Ref:      fmt.Sprintf("XC%d", time.Now().UnixMilli()),
			Metadata: fmt.Sprintf(`{"agent_phone":"%s"}`, body.AgentPhone),
		}
		return tx.Create(&txRecord).Error
	})
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(fiber.Map{"message": e.Message})
		}
		return c.Status(500).JSON(fiber.Map{"message": "Transaction failed"})
	}

	database.DeleteCache(c.Context(), fmt.Sprintf("wallet:%s", user.ID))
	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: "Cash Out Successful",
		Body: fmt.Sprintf("৳%.2f cash out. Fee: ৳%.2f", body.Amount, fee), Type: "cash_out",
	})
	return c.JSON(fiber.Map{"transaction": txRecord, "fee": fee})
}
