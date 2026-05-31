package handlers

import (
	"xcash/backend/database"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
)

func GetBeneficiaries(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var list []models.Beneficiary
	database.DB.Where("user_id = ?", user.ID).Find(&list)
	return c.JSON(list)
}

func AddBeneficiary(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		Name     string `json:"name"`
		Phone    string `json:"phone"`
		Nickname string `json:"nickname"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	b := models.Beneficiary{UserID: user.ID, Name: body.Name, Phone: body.Phone, Nickname: body.Nickname}
	database.DB.Create(&b)
	return c.Status(201).JSON(b)
}

func DeleteBeneficiary(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id := c.Params("id")
	database.DB.Where("id = ? AND user_id = ?", id, user.ID).Delete(&models.Beneficiary{})
	return c.JSON(fiber.Map{"message": "Removed"})
}
