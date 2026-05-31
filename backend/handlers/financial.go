package handlers

import (
	"math"
	"xcash/backend/database"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
)

func OpenSavings(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		Type           string  `json:"type"`
		TargetAmount   float64 `json:"target_amount"`
		MonthlyDeposit float64 `json:"monthly_deposit"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	savings := models.Savings{UserID: user.ID, Type: body.Type, TargetAmount: body.TargetAmount, MonthlyDeposit: body.MonthlyDeposit}
	database.DB.Create(&savings)
	return c.Status(201).JSON(savings)
}

func GetSavings(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var savings []models.Savings
	database.DB.Where("user_id = ?", user.ID).Find(&savings)
	return c.JSON(savings)
}

func DepositSavings(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		ID     string  `json:"id"`
		Amount float64 `json:"amount"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	var wallet models.Wallet
	database.DB.Where("user_id = ?", user.ID).First(&wallet)
	if wallet.Balance < body.Amount {
		return c.Status(400).JSON(fiber.Map{"message": "Insufficient balance"})
	}
	database.DB.Model(&wallet).Update("balance", wallet.Balance-body.Amount)
	var savings models.Savings
	database.DB.Model(&savings).Where("id = ? AND user_id = ?", body.ID, user.ID).Update("current_amount", database.DB.Raw("current_amount + ?", body.Amount))
	database.DB.First(&savings, "id = ?", body.ID)
	return c.JSON(savings)
}

func ApplyLoan(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		Amount  float64 `json:"amount"`
		Tenure  int     `json:"tenure"`
	}
	if err := c.BodyParser(&body); err != nil || body.Amount <= 0 || body.Tenure <= 0 {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	emi := math.Ceil((body.Amount * 1.12) / float64(body.Tenure))
	loan := models.Loan{UserID: user.ID, Amount: body.Amount, Tenure: body.Tenure, EMIAmount: emi}
	database.DB.Create(&loan)
	return c.Status(201).JSON(loan)
}

func GetLoans(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var loans []models.Loan
	database.DB.Where("user_id = ?", user.ID).Find(&loans)
	return c.JSON(loans)
}
