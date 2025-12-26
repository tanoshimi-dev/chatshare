package main

import (
	"log"
	"os"

	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/database"
	"github.com/chatshare/backend/internal/firebase"
	"github.com/chatshare/backend/internal/redis"
	"github.com/chatshare/backend/internal/router"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.LoadConfig()

	// Set Gin mode
	gin.SetMode(cfg.GinMode)

	// Initialize database
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize Redis
	redisClient := redis.InitRedis(cfg)
	if err := redis.Ping(redisClient); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// Initialize Firebase Admin SDK (optional, will work without it)
	var firebaseService *firebase.FirebaseService
	if cfg.FirebaseCredentialsPath != "" {
		firebaseService, err = firebase.NewFirebaseService(cfg.FirebaseCredentialsPath)
		if err != nil {
			log.Printf("Warning: Failed to initialize Firebase Admin SDK: %v", err)
			log.Println("Continuing without Firebase integration...")
		} else {
			log.Println("Firebase Admin SDK initialized successfully")
		}
	} else {
		log.Println("Firebase credentials path not provided, running without Firebase integration")
	}

	// Initialize router
	r := router.SetupRouter(cfg, db, redisClient, firebaseService)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
