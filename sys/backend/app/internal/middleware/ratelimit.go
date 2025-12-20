package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/chatshare/backend/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func RateLimitMiddleware(cfg *config.Config, redisClient *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		key := fmt.Sprintf("rate_limit:%s", ip)

		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
		defer cancel()

		count, err := redisClient.Incr(ctx, key).Result()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Rate limit check failed"})
			c.Abort()
			return
		}

		if count == 1 {
			redisClient.Expire(ctx, key, cfg.RateLimitDuration)
		}

		if count > int64(cfg.RateLimitRequests) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}

		c.Next()
	}
}
