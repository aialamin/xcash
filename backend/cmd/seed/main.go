package main

import (
	"context"
	"fmt"
	"log"

	"xcash/backend/config"
	"xcash/backend/database"
	"xcash/backend/models"

	"github.com/joho/godotenv"
)

type seedAccount struct {
	Name  string
	Phone string
	Pin   string
	Role  string
	Add   float64
}

var accounts = []seedAccount{
	{Name: "Alice Rahman", Phone: "01711111111", Pin: "123456", Role: "user", Add: 5000},
	{Name: "Bob Hasan", Phone: "01722222222", Pin: "123456", Role: "user", Add: 3000},
	{Name: "Carol Akter", Phone: "01733333333", Pin: "123456", Role: "user", Add: 1000},
	{Name: "Demo Agent", Phone: "01800000001", Pin: "123456", Role: "agent", Add: 50000},
	{Name: "Shop BD", Phone: "01900000001", Pin: "123456", Role: "merchant", Add: 10000},
	{Name: "Admin", Phone: "01000000000", Pin: "123456", Role: "admin", Add: 0},
}

func main() {
	_ = godotenv.Load()
	config.Load()
	database.ConnectPostgres()
	database.ConnectRedis()

	db := database.DB
	ctx := context.Background()

	for _, a := range accounts {
		var existing models.User
		if err := db.Where("phone = ?", a.Phone).First(&existing).Error; err == nil {
			fmt.Printf("skip %-20s (already exists)\n", a.Phone)
			continue
		}

		user := models.User{Name: a.Name, Phone: a.Phone, Pin: a.Pin, Role: a.Role}
		if err := user.HashPin(a.Pin); err != nil {
			log.Fatalf("hash pin: %v", err)
		}
		if err := db.Create(&user).Error; err != nil {
			log.Fatalf("create user %s: %v", a.Phone, err)
		}

		wallet := models.Wallet{UserID: user.ID, Balance: a.Add}
		if err := db.Create(&wallet).Error; err != nil {
			log.Fatalf("create wallet %s: %v", a.Phone, err)
		}

		if a.Add > 0 {
			tx := models.Transaction{
				SenderID:   user.ID,
				ReceiverID: user.ID,
				Amount:     a.Add,
				Type:       "add_money",
				Status:     "success",
				Note:       "Seed balance",
				Ref:        fmt.Sprintf("SEED-%s", user.ID),
				Metadata:   "{}",
			}
			db.Create(&tx)
		}

		database.DeleteCache(ctx, fmt.Sprintf("wallet:%s", user.ID))
		fmt.Printf("seeded  %-20s role=%-8s balance=৳%.0f\n", a.Phone, a.Role, a.Add)
	}

	var count int64
	db.Model(&models.User{}).Count(&count)
	fmt.Printf("\nTotal users in DB: %d\n", count)
	fmt.Println("\nTest credentials (all PINs: 123456)")
	fmt.Println("Phone          | Role     | Balance")
	fmt.Println("---------------|----------|--------")
	var users []models.User
	db.Find(&users)
	for _, u := range users {
		var wallet models.Wallet
		db.Where("user_id = ?", u.ID).First(&wallet)
		fmt.Printf("%-15s| %-8s | ৳%.0f\n", u.Phone, u.Role, wallet.Balance)
	}
}
