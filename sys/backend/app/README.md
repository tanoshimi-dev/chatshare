# ChatShare Backend

Go backend service for the ChatShare platform using Gin framework.

## Structure

```
backend/app/
├── internal/
│   ├── config/           # Configuration loader
│   │   └── config.go
│   ├── database/         # Database models and migrations
│   │   ├── database.go  # Database connection
│   │   └── models.go    # Data models
│   ├── handlers/         # HTTP handlers
│   │   ├── auth.go      # Authentication (OAuth)
│   │   ├── user.go      # User management
│   │   ├── chat.go      # Chat operations
│   │   ├── search.go    # Search and rankings
│   │   ├── category.go  # Categories
│   │   ├── comment.go   # Comments
│   │   └── admin.go     # Admin operations
│   ├── middleware/       # Middleware
│   │   ├── auth.go      # JWT authentication
│   │   ├── cors.go      # CORS configuration
│   │   └── ratelimit.go # Rate limiting
│   ├── redis/           # Redis client
│   │   └── redis.go
│   ├── router/          # Route definitions
│   │   └── router.go
│   └── utils/           # Utility functions
│       ├── jwt.go       # JWT helpers
│       ├── password.go  # Password helpers
│       └── response.go  # Response formatters
├── main.go              # Entry point
├── go.mod               # Dependencies
├── Dockerfile           # Docker build
└── README.md            # This file
```

## Dependencies

- **gin-gonic/gin** - Web framework
- **gorm.io/gorm** - ORM
- **gorm.io/driver/postgres** - PostgreSQL driver
- **redis/go-redis** - Redis client
- **golang-jwt/jwt** - JWT authentication
- **golang.org/x/oauth2** - OAuth 2.0
- **google/uuid** - UUID generation
- **sendgrid/sendgrid-go** - Email sending

## Database Models

### User
- ID, Email, Name, Avatar
- Provider (google/line), ProviderID
- Role (user/admin), Status
- Email verification, Last login

### Chat
- ID, Title, Description, PublicLink
- Category, Keywords
- View/Share/Favorite/Comment/Good counts
- Public visibility, Link validity, Status

### Category
- ID, Name, Slug, Description
- Icon, Color, Sort order

### Keyword
- ID, Name, Slug, Usage count

### Relationships
- Favorite (user favorites chat)
- FavoriteUser (user favorites user)
- Comment (user comments on chat)
- View (chat view tracking)
- Share (share tracking)
- Good (like/upvote)

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

## Authentication Flow

### OAuth (Google/LINE)
1. Client requests `/api/v1/auth/google` or `/api/v1/auth/line`
2. Server returns OAuth URL with state
3. User authenticates with provider
4. Provider redirects to callback URL
5. Server exchanges code for token
6. Server fetches user info
7. Server creates/updates user in database
8. Server generates JWT token
9. Client receives JWT token and user data

### JWT Authentication
- Include in request header: `Authorization: Bearer <token>`
- Token contains: user_id, email, role
- Token expires after configured duration (default 24h)

## Middleware

### AuthMiddleware
- Validates JWT token
- Sets user_id, user_email, user_role in context
- Returns 401 if invalid/expired

### AdminMiddleware
- Requires AuthMiddleware first
- Checks if user role is "admin"
- Returns 403 if not admin

### OptionalAuthMiddleware
- Sets user context if valid token provided
- Allows request to proceed even without token

### RateLimitMiddleware
- Uses Redis to track request counts
- Configurable limit per IP address
- Returns 429 if limit exceeded

### CORSMiddleware
- Allows cross-origin requests from frontend
- Configurable allowed origins, methods, headers

## Configuration

Environment variables (see .env.example):

**Server**
- PORT, GIN_MODE, ENVIRONMENT

**Database**
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSLMODE

**Redis**
- REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB

**JWT**
- JWT_SECRET, JWT_EXPIRATION

**OAuth**
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL
- LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_REDIRECT_URL

**Email**
- SENDGRID_API_KEY, FROM_EMAIL, FROM_NAME

**Other**
- FRONTEND_URL, RATE_LIMIT_REQUESTS, RATE_LIMIT_DURATION
- DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

## Development

### Run Locally (without Docker)

```bash
# Install dependencies
go mod download

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run the application
go run main.go
```

### Run Tests

```bash
go test -v ./...
```

### Build Binary

```bash
go build -o chatshare-backend .
./chatshare-backend
```

## Docker

### Build Image

```bash
docker build -t chatshare-backend .
```

### Run Container

```bash
docker run -p 8080:8080 --env-file .env chatshare-backend
```

## Common Tasks

### Create First Admin User

After OAuth login, manually update user role in database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Add Categories

Use admin API or manually insert:

```sql
INSERT INTO categories (id, name, slug, description, is_active, sort_order)
VALUES 
  (gen_random_uuid(), 'Technology', 'technology', 'Tech discussions', true, 1),
  (gen_random_uuid(), 'Entertainment', 'entertainment', 'Movies, music, etc', true, 2);
```

## Security Notes

- Never commit .env files
- Use strong JWT_SECRET in production
- Enable HTTPS in production
- Validate and sanitize all user inputs
- Use parameterized queries (GORM handles this)
- Implement rate limiting
- Monitor for malicious activity
- Keep dependencies updated

## Performance Tips

- Use Redis caching for frequently accessed data
- Add database indexes on commonly queried fields
- Use connection pooling (handled by GORM)
- Enable gzip compression (handled by Nginx)
- Paginate large result sets
- Use database transactions for multi-step operations
