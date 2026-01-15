package utils

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	// OAuth state tokens expire after 10 minutes
	StateTokenExpiration = 10 * time.Minute
	StateTokenPrefix     = "oauth:state:"
)

type SessionStore struct {
	redisClient *redis.Client
}

func NewSessionStore(redisClient *redis.Client) *SessionStore {
	return &SessionStore{
		redisClient: redisClient,
	}
}

// StoreState stores OAuth state token in Redis
func (s *SessionStore) StoreState(ctx context.Context, state string) error {
	key := StateTokenPrefix + state
	return s.redisClient.Set(ctx, key, "valid", StateTokenExpiration).Err()
}

// ValidateState validates OAuth state token without deleting it
func (s *SessionStore) ValidateState(ctx context.Context, state string) (bool, error) {
	key := StateTokenPrefix + state

	// Check if state exists
	exists, err := s.redisClient.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}

	return exists > 0, nil
}

// ValidateAndDeleteState validates and deletes OAuth state token (one-time use)
func (s *SessionStore) ValidateAndDeleteState(ctx context.Context, state string) (bool, error) {
	key := StateTokenPrefix + state

	// Check if state exists
	exists, err := s.redisClient.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}

	if exists == 0 {
		return false, nil
	}

	// Delete the state (one-time use)
	err = s.redisClient.Del(ctx, key).Err()
	if err != nil {
		return false, err
	}

	return true, nil
}

// StoreSession stores user session data
func (s *SessionStore) StoreSession(ctx context.Context, sessionID string, data interface{}, expiration time.Duration) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return s.redisClient.Set(ctx, key, data, expiration).Err()
}

// GetSession retrieves user session data
func (s *SessionStore) GetSession(ctx context.Context, sessionID string) (string, error) {
	key := fmt.Sprintf("session:%s", sessionID)
	return s.redisClient.Get(ctx, key).Result()
}

// DeleteSession deletes user session
func (s *SessionStore) DeleteSession(ctx context.Context, sessionID string) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return s.redisClient.Del(ctx, key).Err()
}
