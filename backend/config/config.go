package config

import (
	"fmt"
	"os"
)

type Config struct {
	AppPort       string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	DBSSLMode     string
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	KafkaBrokers  []string
	KafkaGroupID  string
	JWTSecret     string
	JWTExpiryHours int
}

var App = &Config{}

func Load() {
	// Railway sets PORT automatically — respect it
	App.AppPort = getEnv("PORT", getEnv("APP_PORT", "8080"))
	App.DBHost = getEnv("DB_HOST", "localhost")
	App.DBPort = getEnv("DB_PORT", "5432")
	App.DBUser = getEnv("DB_USER", "xcash")
	App.DBPassword = getEnv("DB_PASSWORD", "xcash_secret")
	App.DBName = getEnv("DB_NAME", "xcash_db")
	App.DBSSLMode = getEnv("DB_SSLMODE", "disable")
	App.RedisAddr = getEnv("REDIS_ADDR", "localhost:6379")
	App.RedisPassword = getEnv("REDIS_PASSWORD", "")
	App.KafkaBrokers = []string{getEnv("KAFKA_BROKERS", "localhost:9092")}
	App.KafkaGroupID = getEnv("KAFKA_GROUP_ID", "xcash-consumers")
	App.JWTSecret = getEnv("JWT_SECRET", "xcash_secret")
	App.JWTExpiryHours = 720
}

func (c *Config) DSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
