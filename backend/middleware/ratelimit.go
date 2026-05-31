package middleware

import (
	"context"
	"fmt"
	"strconv"
	"time"
	"xcash/backend/database"

	"github.com/gofiber/fiber/v2"
)

const (
	maxLoginAttempts = 5
	lockoutDuration  = 15 * time.Minute
)

// RateLimit blocks login after 5 failed attempts per phone for 15 minutes
func LoginRateLimit(c *fiber.Ctx) error {
	// Extract phone from body without consuming it
	var body struct {
		Phone string `json:"phone"`
	}
	if err := c.BodyParser(&body); err != nil || body.Phone == "" {
		return c.Next()
	}

	if database.RDB == nil {
		return c.Next() // Redis unavailable — degrade gracefully
	}

	ctx := context.Background()
	key := fmt.Sprintf("login_attempts:%s", body.Phone)

	val, err := database.RDB.Get(ctx, key).Result()
	if err == nil {
		attempts, _ := strconv.Atoi(val)
		if attempts >= maxLoginAttempts {
			return c.Status(429).JSON(fiber.Map{
				"message": fmt.Sprintf("Too many failed attempts. Try again in %d minutes.", int(lockoutDuration.Minutes())),
			})
		}
	}
	return c.Next()
}

// RecordFailedLogin increments the failed attempt counter
func RecordFailedLogin(phone string) {
	if database.RDB == nil {
		return
	}
	ctx := context.Background()
	key := fmt.Sprintf("login_attempts:%s", phone)
	database.RDB.Incr(ctx, key)
	database.RDB.Expire(ctx, key, lockoutDuration)
}

// ClearLoginAttempts resets the counter on successful login
func ClearLoginAttempts(phone string) {
	if database.RDB == nil {
		return
	}
	ctx := context.Background()
	database.RDB.Del(ctx, fmt.Sprintf("login_attempts:%s", phone))
}
