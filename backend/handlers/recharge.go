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

var validOperators = map[string]bool{
	"grameenphone": true, "robi": true, "banglalink": true,
	"teletalk": true, "airtel": true,
}

func Recharge(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		MSISDN   string  `json:"msisdn"`
		Operator string  `json:"operator"`
		Type     string  `json:"type"`
		Amount   float64 `json:"amount"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	if ok, msg := middleware.ValidateAmount(body.Amount, 10, 1000); !ok {
		return c.Status(400).JSON(fiber.Map{"message": msg})
	}
	if !middleware.ValidatePhone(body.MSISDN) {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid phone number for recharge"})
	}
	if !validOperators[body.Operator] {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid operator"})
	}

	var txRecord models.Transaction
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var wallet models.Wallet
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("user_id = ?", user.ID).First(&wallet).Error; err != nil {
			return err
		}
		if wallet.Balance < body.Amount {
			return fiber.NewError(400, "Insufficient balance")
		}
		if err := tx.Model(&wallet).Update("balance", wallet.Balance-body.Amount).Error; err != nil {
			return err
		}
		txRecord = models.Transaction{
			SenderID: user.ID,
			Type:     "recharge",
			Amount:   body.Amount,
			Status:   "success",
			Ref:      fmt.Sprintf("XC%d", time.Now().UnixMilli()),
			Metadata: fmt.Sprintf(`{"msisdn":"%s","operator":"%s","type":"%s"}`, body.MSISDN, body.Operator, body.Type),
		}
		return tx.Create(&txRecord).Error
	})
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(fiber.Map{"message": e.Message})
		}
		return c.Status(500).JSON(fiber.Map{"message": "Recharge failed"})
	}

	database.DeleteCache(c.Context(), fmt.Sprintf("wallet:%s", user.ID))
	kafka.Publish(kafka.TopicTransactions, txRecord.ID, txRecord)
	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: "Recharge Successful",
		Body: fmt.Sprintf("৳%.2f recharged to %s (%s)", body.Amount, body.MSISDN, body.Operator), Type: "recharge",
	})
	return c.JSON(fiber.Map{"transaction": txRecord})
}
