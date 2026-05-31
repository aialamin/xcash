package database

import (
	"log"
	"xcash/backend/config"
	"xcash/backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectPostgres() {
	var err error
	DB, err = gorm.Open(postgres.Open(config.App.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}

	// Enable UUID extension
	DB.Exec("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"")

	// Auto-migrate all models
	if err := DB.AutoMigrate(
		&models.User{},
		&models.Wallet{},
		&models.Transaction{},
		&models.Savings{},
		&models.Loan{},
		&models.Notification{},
		&models.Beneficiary{},
		&models.SupportTicket{},
		&models.SupportMessage{},
		&models.FeeConfig{},
		&models.LoginHistory{},
		&models.PaymentLink{},
		&models.Referral{},
	); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("PostgreSQL connected and migrated")
}
