package database

import (
	"context"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

var FirebaseAuth *auth.Client

func ConnectFirebase() {
	ctx := context.Background()

	serviceAccountPath := os.Getenv("FIREBASE_SERVICE_ACCOUNT")

	var app *firebase.App
	var err error

	if serviceAccountPath != "" {
		// Production: use service account JSON file
		opt := option.WithCredentialsFile(serviceAccountPath)
		app, err = firebase.NewApp(ctx, nil, opt)
	} else {
		// Development: use GOOGLE_APPLICATION_CREDENTIALS env or ADC
		projectID := os.Getenv("FIREBASE_PROJECT_ID")
		if projectID == "" {
			log.Println("Firebase: FIREBASE_PROJECT_ID not set — Firebase auth disabled")
			return
		}
		conf := &firebase.Config{ProjectID: projectID}
		app, err = firebase.NewApp(ctx, conf)
	}

	if err != nil {
		log.Printf("Firebase init warning: %v (Firebase auth disabled)", err)
		return
	}

	FirebaseAuth, err = app.Auth(ctx)
	if err != nil {
		log.Printf("Firebase auth warning: %v (Firebase auth disabled)", err)
		return
	}

	log.Println("Firebase Auth connected")
}

// VerifyFirebaseToken verifies an ID token and returns the phone number
func VerifyFirebaseToken(ctx context.Context, idToken string) (string, error) {
	token, err := FirebaseAuth.VerifyIDToken(ctx, idToken)
	if err != nil {
		return "", err
	}
	phone, _ := token.Claims["phone_number"].(string)
	return phone, nil
}
