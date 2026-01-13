package router

import (
	"github.com/chatshare/backend/internal/config"
	"github.com/chatshare/backend/internal/firebase"
	"github.com/chatshare/backend/internal/handlers"
	"github.com/chatshare/backend/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func SetupRouter(cfg *config.Config, db *gorm.DB, redisClient *redis.Client, firebaseService *firebase.FirebaseService) *gin.Engine {
	r := gin.Default()

	// Middleware
	r.Use(middleware.CORSMiddleware(cfg))
	r.Use(middleware.RateLimitMiddleware(cfg, redisClient))

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg, redisClient, firebaseService)
	userHandler := handlers.NewUserHandler(db, cfg)
	chatHandler := handlers.NewChatHandler(db, cfg)
	searchHandler := handlers.NewSearchHandler(db, cfg)
	categoryHandler := handlers.NewCategoryHandler(db, cfg)
	commentHandler := handlers.NewCommentHandler(db, cfg)
	adminHandler := handlers.NewAdminHandler(db, cfg)
	wellKnownHandler := handlers.NewWellKnownHandler("./static")

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Well-known endpoints (Apple App Site Association)
	r.GET("/.well-known/apple-app-site-association", wellKnownHandler.AppleAppSiteAssociation)

	// API v1
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			// Google OAuth
			auth.GET("/google/redirect", authHandler.GoogleLogin)
			auth.POST("/google/callback", authHandler.GoogleCallback)

			// LINE OAuth
			auth.GET("/line/url", authHandler.GetLINEOAuthURL)
			auth.POST("/line/callback", authHandler.LINECallback)

			// Current user (requires auth)
			auth.GET("/me", middleware.AuthMiddleware(cfg), authHandler.GetCurrentUser)

			// Logout
			auth.POST("/logout", middleware.AuthMiddleware(cfg), authHandler.Logout)
		}

		// Public routes
		public := v1.Group("")
		{
			// Categories
			public.GET("/categories", categoryHandler.ListCategories)

			// Chats (with optional auth)
			public.GET("/chats", middleware.OptionalAuthMiddleware(cfg), chatHandler.ListChats)
			public.GET("/chats/:id", middleware.OptionalAuthMiddleware(cfg), chatHandler.GetChat)

			// Search and rankings
			public.GET("/search", searchHandler.SearchChats)
			public.GET("/rankings/favorites", searchHandler.GetRankingByFavorites)
			public.GET("/rankings/shares", searchHandler.GetRankingByShares)
			public.GET("/rankings/comments", searchHandler.GetRankingByComments)
			public.GET("/rankings/views", searchHandler.GetRankingByViews)
			public.GET("/keywords/popular", searchHandler.GetPopularKeywords)

			// Users (public profiles)
			public.GET("/users/:id", userHandler.GetUserByID)

			// Comments (public viewing)
			public.GET("/chats/:id/comments", commentHandler.ListComments)
		}

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			// User routes
			user := protected.Group("/user")
			{
				user.GET("/profile", userHandler.GetProfile)
				user.PUT("/profile", userHandler.UpdateProfile)
				user.GET("/favorites/users", userHandler.ListFavoriteUsers)
				user.POST("/favorites/users/:id", userHandler.AddFavoriteUser)
				user.DELETE("/favorites/users/:id", userHandler.RemoveFavoriteUser)
				// Delete own account
				user.DELETE("/account", userHandler.DeleteAccount)
			}

			// Chat management
			chats := protected.Group("/chats")
			{
				chats.POST("", chatHandler.CreateChat)
				chats.PUT("/:id", chatHandler.UpdateChat)
				chats.DELETE("/:id", chatHandler.DeleteChat)

				// Favorites
				chats.POST("/:id/favorite", chatHandler.AddFavorite)
				chats.DELETE("/:id/favorite", chatHandler.RemoveFavorite)

				// Share tracking
				chats.POST("/:id/share", chatHandler.RecordShare)

				// Comments
				chats.POST("/:id/comments", commentHandler.CreateComment)
				chats.DELETE("/:id/comments/:commentId", commentHandler.DeleteComment)
			}
		}

		// Admin routes (require admin role)
		admin := v1.Group("/admin")
		admin.Use(middleware.AuthMiddleware(cfg))
		admin.Use(middleware.AdminMiddleware())
		{
			// User management
			admin.GET("/users", adminHandler.ListUsers)
			admin.PUT("/users/:id/status", adminHandler.UpdateUserStatus)
			admin.PUT("/users/:id/role", adminHandler.UpdateUserRole)
			admin.GET("/users/:id/activity", adminHandler.GetUserActivity)

			// Chat management
			admin.GET("/chats", adminHandler.ListAllChats)
			admin.PUT("/chats/:id/status", adminHandler.UpdateChatStatus)
			admin.DELETE("/chats/:id", adminHandler.DeleteChatByAdmin)

			// Category management
			admin.POST("/categories", adminHandler.CreateCategory)
			admin.PUT("/categories/:id", adminHandler.UpdateCategory)
			admin.DELETE("/categories/:id", adminHandler.DeleteCategory)

			// Statistics
			admin.GET("/statistics", adminHandler.GetStatistics)
		}
	}

	return r
}
