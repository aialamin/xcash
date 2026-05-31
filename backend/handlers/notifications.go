package handlers

import (
	"xcash/backend/database"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
)

func GetNotifications(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var notifs []models.Notification
	database.DB.Where("user_id = ?", user.ID).Order("created_at DESC").Limit(50).Find(&notifs)
	return c.JSON(notifs)
}

func MarkRead(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id := c.Params("id")
	database.DB.Model(&models.Notification{}).Where("id = ? AND user_id = ?", id, user.ID).Update("is_read", true)
	return c.JSON(fiber.Map{"message": "Marked as read"})
}

func MarkAllRead(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	database.DB.Model(&models.Notification{}).Where("user_id = ?", user.ID).Update("is_read", true)
	return c.JSON(fiber.Map{"message": "All marked as read"})
}
