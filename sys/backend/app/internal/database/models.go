package database

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email           string         `gorm:"uniqueIndex;not null" json:"email"`
	EmailVerified   bool           `gorm:"default:false" json:"email_verified"`
	Name            string         `gorm:"size:255" json:"name"`
	Avatar          string         `gorm:"size:512" json:"avatar"`
	Provider        string         `gorm:"size:50;not null" json:"provider"` // google, line
	ProviderID      string         `gorm:"uniqueIndex;not null" json:"provider_id"`
	Role            string         `gorm:"size:50;default:'user'" json:"role"` // user, admin
	Status          string         `gorm:"size:50;default:'active'" json:"status"` // active, suspended, deleted
	LastLoginAt     *time.Time     `json:"last_login_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relationships
	Chats           []Chat         `gorm:"foreignKey:UserID" json:"chats,omitempty"`
	Favorites       []Favorite     `gorm:"foreignKey:UserID" json:"favorites,omitempty"`
	FavoritedBy     []FavoriteUser `gorm:"foreignKey:TargetUserID" json:"favorited_by,omitempty"`
	Comments        []Comment      `gorm:"foreignKey:UserID" json:"comments,omitempty"`
	Views           []View         `gorm:"foreignKey:UserID" json:"views,omitempty"`
	Shares          []Share        `gorm:"foreignKey:UserID" json:"shares,omitempty"`
	Goods           []Good         `gorm:"foreignKey:UserID" json:"goods,omitempty"`
}

// Category represents a chat category
type Category struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Slug        string         `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Description string         `gorm:"size:500" json:"description"`
	Icon        string         `gorm:"size:255" json:"icon"`
	Color       string         `gorm:"size:50" json:"color"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relationships
	Chats       []Chat         `gorm:"foreignKey:CategoryID" json:"chats,omitempty"`
}

// Chat represents a shared chat
type Chat struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID          uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	CategoryID      uuid.UUID      `gorm:"type:uuid;index" json:"category_id"`
	Title           string         `gorm:"size:255;not null" json:"title"`
	Description     string         `gorm:"size:1000" json:"description"`
	PublicLink      string         `gorm:"size:512;uniqueIndex;not null" json:"public_link"`
	ChatType        string         `gorm:"size:50;default:'chatgpt'" json:"chat_type"` // chatgpt, claude, copilot
	IsLinkValid     bool           `gorm:"default:true" json:"is_link_valid"`
	IsPublic        bool           `gorm:"default:true" json:"is_public"`
	IsFeatured      bool           `gorm:"default:false" json:"is_featured"`
	Status          string         `gorm:"size:50;default:'active'" json:"status"` // active, flagged, removed
	ViewCount       int            `gorm:"default:0" json:"view_count"`
	ShareCount      int            `gorm:"default:0" json:"share_count"`
	FavoriteCount   int            `gorm:"default:0" json:"favorite_count"`
	CommentCount    int            `gorm:"default:0" json:"comment_count"`
	GoodCount       int            `gorm:"default:0" json:"good_count"`
	LastViewedAt    *time.Time     `json:"last_viewed_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relationships
	User            User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Category        Category       `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Keywords        []ChatKeyword  `gorm:"foreignKey:ChatID" json:"keywords,omitempty"`
	Favorites       []Favorite     `gorm:"foreignKey:ChatID" json:"favorites,omitempty"`
	Comments        []Comment      `gorm:"foreignKey:ChatID" json:"comments,omitempty"`
	Views           []View         `gorm:"foreignKey:ChatID" json:"views,omitempty"`
	Shares          []Share        `gorm:"foreignKey:ChatID" json:"shares,omitempty"`
	Goods           []Good         `gorm:"foreignKey:ChatID" json:"goods,omitempty"`
}

// Keyword represents a keyword/tag
type Keyword struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Slug        string         `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	UsageCount  int            `gorm:"default:0" json:"usage_count"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`

	// Relationships
	ChatKeywords []ChatKeyword  `gorm:"foreignKey:KeywordID" json:"chat_keywords,omitempty"`
}

// ChatKeyword represents the many-to-many relationship between Chat and Keyword
type ChatKeyword struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ChatID     uuid.UUID `gorm:"type:uuid;not null;index" json:"chat_id"`
	KeywordID  uuid.UUID `gorm:"type:uuid;not null;index" json:"keyword_id"`
	CreatedAt  time.Time `json:"created_at"`

	// Relationships
	Chat       Chat      `gorm:"foreignKey:ChatID" json:"chat,omitempty"`
	Keyword    Keyword   `gorm:"foreignKey:KeywordID" json:"keyword,omitempty"`
}

// Favorite represents a user favoriting a chat
type Favorite struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	ChatID    uuid.UUID `gorm:"type:uuid;not null;index" json:"chat_id"`
	CreatedAt time.Time `json:"created_at"`

	// Relationships
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Chat      Chat      `gorm:"foreignKey:ChatID" json:"chat,omitempty"`
}

// FavoriteUser represents a user favoriting another user
type FavoriteUser struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	TargetUserID uuid.UUID `gorm:"type:uuid;not null;index" json:"target_user_id"`
	CreatedAt    time.Time `json:"created_at"`

	// Relationships
	User         User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TargetUser   User      `gorm:"foreignKey:TargetUserID" json:"target_user,omitempty"`
}

// Comment represents a comment on a chat
type Comment struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ChatID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"chat_id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	Status    string         `gorm:"size:50;default:'active'" json:"status"` // active, flagged, removed
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relationships
	Chat      Chat           `gorm:"foreignKey:ChatID" json:"chat,omitempty"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// View represents a user viewing a chat
type View struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ChatID    uuid.UUID `gorm:"type:uuid;not null;index" json:"chat_id"`
	UserID    uuid.UUID `gorm:"type:uuid;index" json:"user_id"` // nullable for anonymous views
	IPAddress string    `gorm:"size:45" json:"ip_address"`
	UserAgent string    `gorm:"size:512" json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`

	// Relationships
	Chat      Chat      `gorm:"foreignKey:ChatID" json:"chat,omitempty"`
	User      *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// Share represents a user sharing a chat
type Share struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ChatID    uuid.UUID `gorm:"type:uuid;not null;index" json:"chat_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Platform  string    `gorm:"size:50" json:"platform"` // twitter, facebook, line, etc.
	CreatedAt time.Time `json:"created_at"`

	// Relationships
	Chat      Chat      `gorm:"foreignKey:ChatID" json:"chat,omitempty"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// Good represents a user marking a chat as good
type Good struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ChatID    uuid.UUID `gorm:"type:uuid;not null;index" json:"chat_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`

	// Relationships
	Chat      Chat      `gorm:"foreignKey:ChatID" json:"chat,omitempty"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
