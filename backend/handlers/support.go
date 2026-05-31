package handlers

import (
	"fmt"
	"xcash/backend/database"
	"xcash/backend/kafka"
	"xcash/backend/middleware"
	"xcash/backend/models"

	"github.com/gofiber/fiber/v2"
)

// ── CUSTOMER SUPPORT ──

func CreateTicket(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var body struct {
		Subject  string `json:"subject"`
		Category string `json:"category"`
		Message  string `json:"message"`
		Priority string `json:"priority"`
	}
	if err := c.BodyParser(&body); err != nil || body.Subject == "" || body.Message == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Subject and message required"})
	}

	ticket := models.SupportTicket{
		UserID:   user.ID,
		Subject:  body.Subject,
		Category: body.Category,
		Priority: body.Priority,
		Status:   "open",
	}
	if err := database.DB.Create(&ticket).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Failed to create ticket"})
	}

	// First message
	msg := models.SupportMessage{
		TicketID: ticket.ID,
		SenderID: user.ID,
		Message:  body.Message,
		IsAdmin:  false,
	}
	database.DB.Create(&msg)

	kafka.Publish(kafka.TopicNotifications, user.ID, kafka.NotificationEvent{
		UserID: user.ID, Title: "Support Ticket Created",
		Body: fmt.Sprintf("Ticket #%s submitted. We'll respond within 24 hours.", ticket.ID[:8]),
		Type: "support",
	})

	return c.Status(201).JSON(ticket)
}

func GetTickets(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	var tickets []models.SupportTicket
	database.DB.Where("user_id = ?", user.ID).
		Order("created_at DESC").
		Preload("Messages").
		Find(&tickets)
	return c.JSON(tickets)
}

func GetTicket(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id := c.Params("id")
	var ticket models.SupportTicket
	if database.DB.Preload("Messages").First(&ticket, "id = ?", id).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Ticket not found"})
	}
	if ticket.UserID != user.ID && user.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Access denied"})
	}
	return c.JSON(ticket)
}

func ReplyTicket(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id := c.Params("id")
	var body struct{ Message string `json:"message"` }
	if err := c.BodyParser(&body); err != nil || body.Message == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Message required"})
	}

	var ticket models.SupportTicket
	if database.DB.First(&ticket, "id = ?", id).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Ticket not found"})
	}
	if ticket.UserID != user.ID && user.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Access denied"})
	}

	isAdmin := user.Role == "admin"
	msg := models.SupportMessage{
		TicketID: ticket.ID, SenderID: user.ID,
		Message: body.Message, IsAdmin: isAdmin,
	}
	database.DB.Create(&msg)

	if isAdmin && ticket.Status == "open" {
		database.DB.Model(&ticket).Update("status", "in_progress")
		kafka.Publish(kafka.TopicNotifications, ticket.UserID, kafka.NotificationEvent{
			UserID: ticket.UserID, Title: "Support Reply",
			Body: "Our support team has responded to your ticket.", Type: "support",
		})
	}
	return c.JSON(msg)
}

func CloseTicket(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id := c.Params("id")
	var ticket models.SupportTicket
	if database.DB.First(&ticket, "id = ?", id).Error != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Ticket not found"})
	}
	if ticket.UserID != user.ID && user.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Access denied"})
	}
	database.DB.Model(&ticket).Update("status", "closed")
	return c.JSON(fiber.Map{"message": "Ticket closed"})
}

// ── ADMIN PANEL ──

func AdminGetUsers(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	if user.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Admin only"})
	}
	var users []models.User
	database.DB.Preload("Wallet").Order("created_at DESC").Find(&users)
	// Build response with balance included
	type UserWithBalance struct {
		models.User
		Balance float64 `json:"balance"`
	}
	result := make([]UserWithBalance, len(users))
	for i, u := range users {
		result[i] = UserWithBalance{User: u, Balance: u.Wallet.Balance}
	}
	return c.JSON(result)
}

func AdminGetStats(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	if user.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Admin only"})
	}
	var totalUsers, activeUsers, totalTx int64
	var totalVolume float64
	database.DB.Model(&models.User{}).Count(&totalUsers)
	database.DB.Model(&models.User{}).Where("status = ?", "active").Count(&activeUsers)
	database.DB.Model(&models.Transaction{}).Where("status = ?", "success").Count(&totalTx)
	database.DB.Model(&models.Transaction{}).Where("status = ?", "success").Select("COALESCE(SUM(amount),0)").Scan(&totalVolume)
	var openTickets int64
	database.DB.Model(&models.SupportTicket{}).Where("status IN ?", []string{"open","in_progress"}).Count(&openTickets)
	return c.JSON(fiber.Map{
		"total_users":   totalUsers,
		"active_users":  activeUsers,
		"total_tx":      totalTx,
		"total_volume":  totalVolume,
		"open_tickets":  openTickets,
	})
}

func AdminBlockUser(c *fiber.Ctx) error {
	admin := middleware.GetUser(c)
	if admin.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Admin only"})
	}
	id := c.Params("id")
	var body struct{ Status string `json:"status"` }
	c.BodyParser(&body)
	if body.Status == "" { body.Status = "blocked" }
	database.DB.Model(&models.User{}).Where("id = ?", id).Update("status", body.Status)
	return c.JSON(fiber.Map{"message": "User status updated", "status": body.Status})
}

func AdminGetAllTickets(c *fiber.Ctx) error {
	admin := middleware.GetUser(c)
	if admin.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Admin only"})
	}
	var tickets []models.SupportTicket
	database.DB.Order("created_at DESC").Preload("User").Preload("Messages").Find(&tickets)
	return c.JSON(tickets)
}

func AdminGetTransactions(c *fiber.Ctx) error {
	admin := middleware.GetUser(c)
	if admin.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Admin only"})
	}
	var txs []models.Transaction
	database.DB.Order("created_at DESC").Limit(100).
		Preload("Sender").Preload("Receiver").Find(&txs)
	return c.JSON(txs)
}

// ── FEE CONFIG ──

func GetFees(c *fiber.Ctx) error {
	var fees []models.FeeConfig
	database.DB.Find(&fees)
	return c.JSON(fees)
}

func AdminUpdateFee(c *fiber.Ctx) error {
	admin := middleware.GetUser(c)
	if admin.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Admin only"})
	}
	var body models.FeeConfig
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid request"})
	}
	database.DB.Where("tx_type = ?", body.TxType).Assign(body).FirstOrCreate(&body)
	return c.JSON(body)
}
