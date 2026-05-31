package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"xcash/backend/config"
	"xcash/backend/database"
	"xcash/backend/handlers"
	"xcash/backend/kafka"
	"xcash/backend/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// Load env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file, using environment variables")
	}
	config.Load()

	// Connect infrastructure
	database.ConnectPostgres()
	handlers.SeedDefaultFees()
	database.ConnectRedis()
	database.ConnectFirebase()
	kafka.InitProducer()

	// Start Kafka consumers
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	kafka.StartConsumers(ctx)

	// Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "XCash Enterprise API v1.0",
		ErrorHandler: errorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} ${method} ${path} ${latency}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOriginsFunc: func(origin string) bool {
			// Allow Expo dev clients and local network access
			return true // restrict to specific domains in production
		},
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	routes.Setup(app)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-quit
		log.Println("Shutting down server...")
		cancel()
		kafka.Close()
		app.Shutdown()
	}()

	log.Printf("XCash API running on :%s", config.App.AppPort)
	if err := app.Listen(":" + config.App.AppPort); err != nil {
		log.Printf("Server stopped: %v", err)
	}
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"message": err.Error()})
}
