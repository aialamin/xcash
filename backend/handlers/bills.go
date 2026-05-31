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

var validBillCategories = map[string]bool{
	"electricity": true, "gas": true, "water": true,
	"internet": true, "tv": true, "education": true,
	"loan_emi": true, "other": true,
}

func PayBill(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		Category  string  `json:"category"`
		AccountNo string  `json:"account_no"`
		Amount    float64 `json:"amount"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	if ok, msg := middleware.ValidateAmount(body.Amount, middleware.MinTransactionAmount, middleware.MaxTransactionAmount); !ok {
		return c.Status(400).JSON(fiber.Map{"message": msg})
	}
	if !validBillCategories[body.Category] {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid bill category"})
	}
	if body.AccountNo == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Account number required"})
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
			Type:     "bill_pay",
			Amount:   body.Amount,
			Status:   "success",
			Ref:      fmt.Sprintf("XC%d", time.Now().UnixMilli()),
			Metadata: fmt.Sprintf(`{"category":"%s","account_no":"%s"}`, body.Category, body.AccountNo),
		}
		return tx.Create(&txRecord).Error
	})
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(fiber.Map{"message": e.Message})
		}
		return c.Status(500).JSON(fiber.Map{"message": "Bill payment failed"})
	}

	database.DeleteCache(c.Context(), fmt.Sprintf("wallet:%s", user.ID))
	kafka.Publish(kafka.TopicTransactions, txRecord.ID, txRecord)
	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: "Bill Paid",
		Body: fmt.Sprintf("৳%.2f paid for %s", body.Amount, body.Category), Type: "bill_pay",
	})
	return c.JSON(fiber.Map{"transaction": txRecord})
}
