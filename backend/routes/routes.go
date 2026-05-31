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
		return c.JSON(fiber.Map{"status": "ok", "service": "pocket-backend"})
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
	transfer.Post("/verify-receiver", handlers.VerifyReceiver)
	transfer.Post("/hold", handlers.HoldTransaction)
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

	// Transactions
	api.Post("/transactions/:id/dispute", middleware.Auth, handlers.DisputeTransaction)

	// Beneficiaries
	benes := api.Group("/beneficiaries", middleware.Auth)
	benes.Get("/", handlers.GetBeneficiaries)
	benes.Post("/", handlers.AddBeneficiary)
	benes.Delete("/:id", handlers.DeleteBeneficiary)

	// Fees
	api.Get("/fees", handlers.GetFees)

	// Security
	api.Post("/auth/change-pin", middleware.Auth, handlers.ChangePIN)
	api.Patch("/wallet/freeze", middleware.Auth, handlers.FreezeAccount)
	api.Get("/auth/login-history", middleware.Auth, handlers.GetLoginHistory)

	// Analytics
	api.Get("/analytics/spending", middleware.Auth, handlers.GetSpendingAnalytics)

	// Payment Links
	links := api.Group("/payment-links", middleware.Auth)
	links.Post("/", handlers.CreatePaymentLink)
	links.Get("/", handlers.GetMyPaymentLinks)
	links.Delete("/:id", handlers.DeactivatePaymentLink)
	api.Get("/payment-links/resolve/:code", handlers.GetPaymentLink)

	// Referral
	api.Get("/referral", middleware.Auth, handlers.GetReferralCode)
	api.Post("/referral/apply", middleware.Auth, handlers.ApplyReferral)

	// Safety
	safety := api.Group("/safety", middleware.Auth)
	safety.Post("/verify-receiver", handlers.VerifyReceiver)
	safety.Get("/daily-spend", handlers.GetDailySpend)

	// Support / Chat
	support := api.Group("/support", middleware.Auth)
	support.Post("/tickets", handlers.CreateTicket)
	support.Get("/tickets", handlers.GetTickets)
	support.Get("/tickets/:id", handlers.GetTicket)
	support.Post("/tickets/:id/reply", handlers.ReplyTicket)
	support.Patch("/tickets/:id/close", handlers.CloseTicket)

	// Admin
	admin := api.Group("/admin", middleware.Auth)
	admin.Get("/stats", handlers.AdminGetStats)
	admin.Get("/users", handlers.AdminGetUsers)
	admin.Patch("/users/:id/status", handlers.AdminBlockUser)
	admin.Get("/tickets", handlers.AdminGetAllTickets)
	admin.Get("/transactions", handlers.AdminGetTransactions)
	admin.Post("/fees", handlers.AdminUpdateFee)
}
