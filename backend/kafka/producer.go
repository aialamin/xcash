package kafka

import (
	"context"
	"encoding/json"
	"log"
	"time"
	"xcash/backend/config"

	"github.com/segmentio/kafka-go"
)

const (
	TopicTransactions   = "xcash.transactions"
	TopicNotifications  = "xcash.notifications"
	TopicAudit          = "xcash.audit"
)

var writer *kafka.Writer

func InitProducer() {
	writer = &kafka.Writer{
		Addr:         kafka.TCP(config.App.KafkaBrokers...),
		Balancer:     &kafka.LeastBytes{},
		RequiredAcks: kafka.RequireOne,
		Async:        true,
		ErrorLogger:  kafka.LoggerFunc(func(msg string, args ...interface{}) {
			log.Printf("[Kafka Error] "+msg, args...)
		}),
	}
	log.Println("Kafka producer initialized")
}

func Publish(topic string, key string, payload any) {
	if writer == nil {
		return
	}
	b, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Kafka marshal error: %v", err)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := writer.WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: b,
	}); err != nil {
		log.Printf("Kafka publish error: %v", err)
	}
}

func Close() {
	if writer != nil {
		writer.Close()
	}
}
