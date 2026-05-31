package database

import (
	"context"
	"encoding/json"
	"log"
	"time"
	"xcash/backend/config"

	"github.com/redis/go-redis/v9"
)

var RDB *redis.Client

func ConnectRedis() {
	RDB = redis.NewClient(&redis.Options{
		Addr:     config.App.RedisAddr,
		Password: config.App.RedisPassword,
		DB:       config.App.RedisDB,
	})
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := RDB.Ping(ctx).Err(); err != nil {
		log.Printf("Redis connection warning: %v (continuing without cache)", err)
		RDB = nil
		return
	}
	log.Println("Redis connected")
}

func SetCache(ctx context.Context, key string, value any, ttl time.Duration) error {
	if RDB == nil {
		return nil
	}
	b, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return RDB.Set(ctx, key, b, ttl).Err()
}

func GetCache(ctx context.Context, key string, dest any) error {
	if RDB == nil {
		return redis.Nil
	}
	b, err := RDB.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}
	return json.Unmarshal(b, dest)
}

func DeleteCache(ctx context.Context, keys ...string) {
	if RDB == nil {
		return
	}
	RDB.Del(ctx, keys...)
}
