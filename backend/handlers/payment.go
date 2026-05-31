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

func MerchantPay(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		MerchantPhone string  `json:"merchant_phone"`
		Amount        float64 `json:"amount"`
		Note          string  `json:"note"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	if ok, msg := middleware.ValidateAmount(body.Amount, middleware.MinTransactionAmount, middleware.MaxTransactionAmount); !ok {
		return c.Status(400).JSON(fiber.Map{"message": msg})
	}
	if body.MerchantPhone == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Merchant phone required"})
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
			Type:     "payment",
			Amount:   body.Amount,
			Status:   "success",
			Note:     middleware.SanitizeString(body.Note),
			Ref:      fmt.Sprintf("XC%d", time.Now().UnixMilli()),
			Metadata: fmt.Sprintf(`{"merchant_phone":"%s"}`, body.MerchantPhone),
		}
		return tx.Create(&txRecord).Error
	})
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(fiber.Map{"message": e.Message})
		}
		return c.Status(500).JSON(fiber.Map{"message": "Payment failed"})
	}

	database.DeleteCache(c.Context(), fmt.Sprintf("wallet:%s", user.ID))
	kafka.Publish(kafka.TopicTransactions, txRecord.ID, txRecord)
	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: "Payment Successful",
		Body: fmt.Sprintf("৳%.2f paid to %s", body.Amount, body.MerchantPhone), Type: "payment",
	})
	return c.JSON(fiber.Map{"transaction": txRecord})
}

func GetReceipt(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id := c.Params("id")
	var tx models.Transaction
	if result := database.DB.Preload("Sender").Preload("Receiver").First(&tx, "id = ?", id); result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Transaction not found"})
	}
	// Only allow owner to view receipt
	if tx.SenderID != user.ID && tx.ReceiverID != user.ID {
		return c.Status(403).JSON(fiber.Map{"message": "Access denied"})
	}
	return c.JSON(tx)
}
