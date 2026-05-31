package kafka

import (
	"context"
	"encoding/json"
	"log"
	"xcash/backend/config"
	"xcash/backend/database"
	"xcash/backend/models"

	"github.com/segmentio/kafka-go"
)

type NotificationEvent struct {
	UserID string `json:"user_id"`
	Title  string `json:"title"`
	Body   string `json:"body"`
	Type   string `json:"type"`
}

func StartConsumers(ctx context.Context) {
	go consumeNotifications(ctx)
}

func consumeNotifications(ctx context.Context) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  config.App.KafkaBrokers,
		Topic:    TopicNotifications,
		GroupID:  config.App.KafkaGroupID,
		MinBytes: 1,
		MaxBytes: 10e6,
	})
	defer r.Close()

	log.Println("Kafka notifications consumer started")
	for {
		msg, err := r.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("Kafka fetch error: %v", err)
			continue
		}

		var event NotificationEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("Kafka unmarshal error: %v", err)
			r.CommitMessages(ctx, msg)
			continue
		}

		notif := models.Notification{
			UserID: event.UserID,
			Title:  event.Title,
			Body:   event.Body,
			Type:   event.Type,
		}
		if result := database.DB.Create(&notif); result.Error != nil {
			log.Printf("Notification save error: %v", result.Error)
		}

		r.CommitMessages(ctx, msg)
	}
}
