package main

import (
	"context"
	"fmt"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"github.com/joho/godotenv"
	"google.golang.org/api/identitytoolkit/v2"
	"google.golang.org/api/option"
)

func main() {
	_ = godotenv.Load()

	saPath := os.Getenv("FIREBASE_SERVICE_ACCOUNT")
	if saPath == "" {
		saPath = "./firebase-service-account.json"
	}

	ctx := context.Background()

	// Init Firebase app
	opt := option.WithCredentialsFile(saPath)
	app, err := firebase.NewApp(ctx, &firebase.Config{ProjectID: "xcash-831fc"}, opt)
	if err != nil {
		log.Fatalf("Firebase init: %v", err)
	}

	// Get HTTP client with Firebase credentials
	client, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("Firebase auth: %v", err)
	}
	_ = client

	// Use Identity Toolkit API to add test phone numbers
	svc, err := identitytoolkit.NewService(ctx, opt)
	if err != nil {
		log.Fatalf("identitytoolkit: %v", err)
	}

	cfg := &identitytoolkit.GoogleCloudIdentitytoolkitAdminV2Config{
		SignIn: &identitytoolkit.GoogleCloudIdentitytoolkitAdminV2SignInConfig{
			PhoneNumber: &identitytoolkit.GoogleCloudIdentitytoolkitAdminV2PhoneNumber{
				Enabled: true,
				TestPhoneNumbers: map[string]string{
					"+8801521366254": "123456",
					"+8801711111111": "123456",
					"+8801722222222": "123456",
					"+8801733333333": "123456",
				},
			},
		},
	}

	result, err := svc.Projects.UpdateConfig("projects/xcash-831fc", cfg).
		UpdateMask("signIn.phoneNumber.testPhoneNumbers").
		Context(ctx).Do()
	if err != nil {
		log.Fatalf("Update config: %v", err)
	}

	fmt.Println("✅ Test phone numbers added:")
	for phone, code := range result.SignIn.PhoneNumber.TestPhoneNumbers {
		fmt.Printf("  %s → OTP: %s\n", phone, code)
	}
}
