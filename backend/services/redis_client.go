package services

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

// InitRedis initializes the Redis client connection
func InitRedis() {
	// Upstash Redis URL (完全なURL形式)
	upstashURL := os.Getenv("UPSTASH_REDIS_URL")

	if upstashURL != "" {
		// Upstash Redis URLを直接解析
		opt, err := redis.ParseURL(upstashURL)
		if err != nil {
			log.Printf("Warning: Failed to parse Upstash Redis URL: %v", err)
		} else {
			RedisClient = redis.NewClient(opt)
			log.Println("Upstash Redis client initialized")
		}
	}

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis connection failed: %v. Rate limiting will fall back to in-memory storage.", err)
		RedisClient = nil
	} else {
		log.Println("Redis connected successfully")
	}
}

// CloseRedis closes the Redis connection
func CloseRedis() {
	if RedisClient != nil {
		if err := RedisClient.Close(); err != nil {
			log.Printf("Error closing Redis connection: %v", err)
		}
	}
}

// IsRedisAvailable checks if Redis is available
func IsRedisAvailable() bool {
	if RedisClient == nil {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	return RedisClient.Ping(ctx).Err() == nil
}
