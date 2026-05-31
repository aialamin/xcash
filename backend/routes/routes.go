package routes

import (
	"xcash/backend/handlers"
	"xcash/backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	api := app.Group("/api")

	// Health
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "xcash-backend"})
	})

	// Auth
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/firebase-register", handlers.FirebaseRegister)
	auth.Post("/login", middleware.LoginRateLimit, handlers.Login)
	auth.Post("/firebase-login", middleware.LoginRateLimit, handlers.FirebaseLogin)
	auth.Post("/verify-pin", middleware.Auth, handlers.VerifyPIN)
	auth.Get("/profile", middleware.Auth, handlers.GetProfile)
	auth.Patch("/profile", middleware.Auth, handlers.UpdateProfile)
	auth.Post("/device", middleware.Auth, handlers.UpdateDeviceID)
	auth.Get("/device-alert", middleware.Auth, handlers.CheckNewDeviceAlert)

	// Wallet
	wallet := api.Group("/wallet", middleware.Auth)
	wallet.Get("/balance", handlers.GetBalance)
	wallet.Post("/add-money", handlers.AddMoney)
	wallet.Post("/cash-out", handlers.CashOut)
	wallet.Patch("/daily-limit", handlers.SetDailyLimit)
	wallet.Get("/daily-spend", handlers.GetDailySpend)

	// Transfer
	transfer := api.Group("/transfer", middleware.Auth)
	transfer.Post("/verify-receiver", handlers.VerifyReceiver) // confirm name before send
	transfer.Post("/hold", handlers.HoldTransaction)           // stage tx for 30s cancel window
	transfer.Delete("/hold/:holdId", handlers.CancelTransaction)
	transfer.Post("/send", handlers.SendMoney)
	transfer.Post("/request", handlers.RequestMoney)
	transfer.Get("/history", handlers.GetHistory)

	// Payment
	payment := api.Group("/payment", middleware.Auth)
	payment.Post("/merchant", handlers.MerchantPay)
	payment.Get("/receipt/:id", handlers.GetReceipt)

	// Recharge
	api.Post("/recharge", middleware.Auth, handlers.Recharge)

	// Bills
	api.Post("/bills/pay", middleware.Auth, handlers.PayBill)

	// Financial
	financial := api.Group("/financial", middleware.Auth)
	financial.Post("/savings", handlers.OpenSavings)
	financial.Get("/savings", handlers.GetSavings)
	financial.Post("/savings/deposit", handlers.DepositSavings)
	financial.Post("/loan", handlers.ApplyLoan)
	financial.Get("/loan", handlers.GetLoans)

	// Notifications
	notifs := api.Group("/notifications", middleware.Auth)
	notifs.Get("/", handlers.GetNotifications)
	notifs.Patch("/read-all", handlers.MarkAllRead)
	notifs.Patch("/:id/read", handlers.MarkRead)

	// Transactions — dispute
	api.Post("/transactions/:id/dispute", middleware.Auth, handlers.DisputeTransaction)

	// Beneficiaries
	benes := api.Group("/beneficiaries", middleware.Auth)
	benes.Get("/", handlers.GetBeneficiaries)
	benes.Post("/", handlers.AddBeneficiary)
	benes.Delete("/:id", handlers.DeleteBeneficiary)
}
