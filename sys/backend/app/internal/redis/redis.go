package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/chatshare/backend/internal/config"
	"github.com/redis/go-redis/v9"
)

func InitRedis(cfg *config.Config) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})
}

func Ping(client *redis.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := client.Ping(ctx).Result()
	return err
}
