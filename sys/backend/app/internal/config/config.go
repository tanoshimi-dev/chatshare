package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	// Server
	Port        string
	GinMode     string
	Environment string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	// JWT
	JWTSecret     string
	JWTExpiration time.Duration

	// OAuth Google
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// OAuth LINE
	LINEChannelID     string
	LINEChannelSecret string
	LINERedirectURL   string

	// Email
	SendGridAPIKey string
	FromEmail      string
	FromName       string

	// Frontend
	FrontendURL string

	// Firebase
	FirebaseCredentialsPath string

	// Rate Limiting
	RateLimitRequests int
	RateLimitDuration time.Duration

	// Pagination
	DefaultPageSize int
	MaxPageSize     int
}

func LoadConfig() *Config {
	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))
	rateLimitRequests, _ := strconv.Atoi(getEnv("RATE_LIMIT_REQUESTS", "100"))
	defaultPageSize, _ := strconv.Atoi(getEnv("DEFAULT_PAGE_SIZE", "20"))
	maxPageSize, _ := strconv.Atoi(getEnv("MAX_PAGE_SIZE", "100"))

	jwtExpiration, err := time.ParseDuration(getEnv("JWT_EXPIRATION", "24h"))
	if err != nil {
		jwtExpiration = 24 * time.Hour
	}

	rateLimitDuration, err := time.ParseDuration(getEnv("RATE_LIMIT_DURATION", "1m"))
	if err != nil {
		rateLimitDuration = 1 * time.Minute
	}

	return &Config{
		Port:        getEnv("PORT", "8080"),
		GinMode:     getEnv("GIN_MODE", "debug"),
		Environment: getEnv("ENVIRONMENT", "development"),

		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "chatshare"),
		DBPassword: getEnv("DB_PASSWORD", "chatshare_password"),
		DBName:     getEnv("DB_NAME", "chatshare_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       redisDB,

		JWTSecret:     getEnv("JWT_SECRET", "your-secret-key"),
		JWTExpiration: jwtExpiration,

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", ""),

		LINEChannelID:     getEnv("LINE_CHANNEL_ID", ""),
		LINEChannelSecret: getEnv("LINE_CHANNEL_SECRET", ""),
		LINERedirectURL:   getEnv("LINE_REDIRECT_URL", ""),

		SendGridAPIKey: getEnv("SENDGRID_API_KEY", ""),
		FromEmail:      getEnv("FROM_EMAIL", "noreply@chatshare.com"),
		FromName:       getEnv("FROM_NAME", "ChatShare"),

		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),

		FirebaseCredentialsPath: getEnv("FIREBASE_CREDENTIALS_PATH", ""),

		RateLimitRequests: rateLimitRequests,
		RateLimitDuration: rateLimitDuration,

		DefaultPageSize: defaultPageSize,
		MaxPageSize:     maxPageSize,
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
