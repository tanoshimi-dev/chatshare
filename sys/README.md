# ChatShare - Chat Sharing Platform

ChatShare is a platform for sharing and discovering chat conversations. Users can share public chat links, search for interesting conversations, and interact with a community of chat enthusiasts.

## Features

### For Users
- Share chat public links with categories and keywords
- Search chats by keywords, category, and user
- Mark chats as favorites
- Follow favorite users
- Comment on chats
- Export chat lists to CSV
- View rankings by favorites, shares, comments, and views

### For Admins
- User management (activate, suspend, promote)
- Chat moderation (flag, remove inappropriate content)
- Category and keyword management
- User activity monitoring
- Platform statistics and analytics

## Architecture

- **Backend**: Golang with Gin framework
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Authentication**: OAuth 2.0 (Google & LINE)
- **Reverse Proxy**: Nginx
- **Email**: SendGrid / Mailhog (development)
- **Monitoring**: pgAdmin (database), Redis Commander (cache)

## Tech Stack

- **Language**: Go 1.21
- **Web Framework**: Gin
- **ORM**: GORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: OAuth 2.0 (Google & LINE)
- **JWT**: golang-jwt/jwt
- **Containerization**: Docker & Docker Compose

## Project Structure

```
chatshare/sys/
├── backend/
│   ├── app/
│   │   ├── internal/
│   │   │   ├── config/       # Configuration management
│   │   │   │   └── config.go
│   │   │   ├── database/     # Database models and migrations
│   │   │   │   ├── database.go
│   │   │   │   └── models.go
│   │   │   ├── handlers/     # HTTP request handlers
│   │   │   │   ├── admin.go
│   │   │   │   ├── auth.go
│   │   │   │   ├── category.go
│   │   │   │   ├── chat.go
│   │   │   │   ├── comment.go
│   │   │   │   ├── search.go
│   │   │   │   └── user.go
│   │   │   ├── middleware/   # Middleware (auth, CORS, rate limiting)
│   │   │   │   ├── auth.go
│   │   │   │   ├── cors.go
│   │   │   │   └── ratelimit.go
│   │   │   ├── redis/        # Redis client
│   │   │   │   └── redis.go
│   │   │   ├── router/       # Route definitions
│   │   │   │   └── router.go
│   │   │   └── utils/        # Utility functions
│   │   │       ├── jwt.go
│   │   │       ├── password.go
│   │   │       └── response.go
│   │   ├── main.go           # Application entry point
│   │   ├── go.mod            # Go dependencies
│   │   ├── Dockerfile        # Backend Docker image
│   │   └── README.md         # Backend documentation
│   ├── nginx/
│   │   ├── nginx.conf        # Nginx configuration
│   │   └── Dockerfile        # Nginx Docker image
│   ├── docker-compose.yml    # Docker Compose orchestration
│   └── Makefile              # Development commands
├── frontend/
│   ├── admin/                # Admin frontend application
│   └── user/                 # User frontend application
│       ├── mobile/           # React Native mobile app
│       └── web/              # React web app
└── README.md                 # This file
```

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- Make (optional, for convenience commands)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chatshare/sys/backend
```

### 2. Setup Environment Variables

```bash
# Copy the example environment file
make init
# or
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required configuration:**
- `JWT_SECRET`: A strong secret key for JWT tokens
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `LINE_CHANNEL_ID` & `LINE_CHANNEL_SECRET`: LINE OAuth credentials
- `SENDGRID_API_KEY`: SendGrid API key (optional, for production email)

### 3. Start the Application

```bash
# Build and start all services
make prod

# Or without Make
docker-compose build
docker-compose up -d
```

### 4. Verify Services

```bash
# Check running services
make ps

# View logs
make logs
```

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Nginx | 80 | Reverse proxy & API gateway |
| Backend | 8080 | Go API server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| pgAdmin | 5050 | Database admin UI |
| Redis Commander | 8081 | Redis monitoring UI |
| Mailhog | 8025 | Email testing UI (dev only) |
| Mailhog SMTP | 1025 | SMTP server (dev only) |

## API Endpoints

### Authentication
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - Google OAuth callback
- `GET /api/v1/auth/line` - Initiate LINE OAuth
- `GET /api/v1/auth/line/callback` - LINE OAuth callback
- `GET /api/v1/auth/me` - Get current user (requires auth)

### Public Endpoints
- `GET /api/v1/categories` - List categories
- `GET /api/v1/chats` - List public chats (paginated)
- `GET /api/v1/chats/:id` - Get chat details
- `GET /api/v1/search?q=query` - Search chats
- `GET /api/v1/rankings/favorites` - Top chats by favorites
- `GET /api/v1/rankings/shares` - Top chats by shares
- `GET /api/v1/rankings/comments` - Top chats by comments
- `GET /api/v1/rankings/views` - Top chats by views
- `GET /api/v1/rankings/goods` - Top chats by good marks
- `GET /api/v1/keywords/popular` - Popular keywords
- `GET /api/v1/users/:id` - Get user profile

### Protected Endpoints (Require Authentication)

**User Management**
- `GET /api/v1/user/profile` - Get my profile
- `PUT /api/v1/user/profile` - Update my profile
- `GET /api/v1/user/favorites/users` - My favorite users
- `POST /api/v1/user/favorites/users/:id` - Add favorite user
- `DELETE /api/v1/user/favorites/users/:id` - Remove favorite user

**Chat Management**
- `POST /api/v1/chats` - Create chat
- `PUT /api/v1/chats/:id` - Update chat
- `DELETE /api/v1/chats/:id` - Delete chat
- `POST /api/v1/chats/:id/favorite` - Favorite chat
- `DELETE /api/v1/chats/:id/favorite` - Unfavorite chat
- `POST /api/v1/chats/:id/good` - Mark as good
- `DELETE /api/v1/chats/:id/good` - Remove good mark
- `POST /api/v1/chats/:id/share` - Record share
- `POST /api/v1/chats/:id/comments` - Add comment
- `DELETE /api/v1/chats/:id/comments/:commentId` - Delete comment

### Admin Endpoints (Require Admin Role)

**User Management**
- `GET /api/v1/admin/users` - List all users
- `PUT /api/v1/admin/users/:id/status` - Update user status
- `PUT /api/v1/admin/users/:id/role` - Update user role
- `GET /api/v1/admin/users/:id/activity` - Get user activity

**Chat Management**
- `GET /api/v1/admin/chats` - List all chats
- `PUT /api/v1/admin/chats/:id/status` - Update chat status
- `DELETE /api/v1/admin/chats/:id` - Delete chat

**Category Management**
- `POST /api/v1/admin/categories` - Create category
- `PUT /api/v1/admin/categories/:id` - Update category
- `DELETE /api/v1/admin/categories/:id` - Delete category

**Statistics**
- `GET /api/v1/admin/statistics` - Platform statistics

## Development

### Using Make Commands

```bash
# Start all services
make up

# Stop all services
make down

# Restart services
make restart

# View logs
make logs

# View backend logs only
make logs-backend

# Access PostgreSQL shell
make db-shell

# Access Redis CLI
make redis-cli

# Access backend container shell
make backend-shell

# Run tests
make test

# Clean up (remove containers and volumes)
make clean
```

### Manual Development

```bash
# Start services
docker-compose up

# Stop services
docker-compose down

# Rebuild a specific service
docker-compose build backend

# View logs for a specific service
docker-compose logs -f backend

# Execute commands in a container
docker-compose exec backend sh
docker-compose exec postgres psql -U chatshare -d chatshare_db
```

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost/api/v1/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### LINE OAuth

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new LINE Login channel
3. Add callback URL: `http://localhost/api/v1/auth/line/callback`
4. Copy Channel ID and Channel Secret to `.env`

## Database Management

### Access pgAdmin

1. Open http://localhost:5050
2. Login with:
   - Email: `admin@chatshare.com`
   - Password: `admin`
3. Add server:
   - Host: `postgres`
   - Port: `5432`
   - Username: `chatshare`
   - Password: `chatshare_password`

### Direct Database Access

```bash
# Via Make
make db-shell

# Via Docker Compose
docker-compose exec postgres psql -U chatshare -d chatshare_db
```

## Redis Management

### Access Redis Commander

1. Open http://localhost:8081
2. Browse and manage Redis keys

### Direct Redis Access

```bash
# Via Make
make redis-cli

# Via Docker Compose
docker-compose exec redis redis-cli
```

## Email Testing (Development)

Mailhog captures all emails sent from the application in development mode.

1. Open http://localhost:8025
2. View all sent emails in the web interface

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Update database passwords
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up proper CORS origins
- [ ] Enable rate limiting
- [ ] Configure SendGrid for production emails
- [ ] Set `GIN_MODE=release`
- [ ] Review and restrict exposed ports
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Enable monitoring and alerts

### Environment Variables

Ensure all production environment variables are properly set in `.env`:

```bash
JWT_SECRET=<strong-random-secret>
GOOGLE_CLIENT_ID=<production-google-client-id>
GOOGLE_CLIENT_SECRET=<production-google-client-secret>
LINE_CHANNEL_ID=<production-line-channel-id>
LINE_CHANNEL_SECRET=<production-line-channel-secret>
SENDGRID_API_KEY=<sendgrid-api-key>
FRONTEND_URL=<production-frontend-url>
```

## Monitoring

### Application Health

- Health endpoint: `http://localhost/health`
- Returns `{"status": "ok"}` when healthy

### Container Health

```bash
# Check container status
docker-compose ps

# View resource usage
docker stats
```

## Troubleshooting

### Backend won't start

1. Check logs: `make logs-backend`
2. Verify database connection: `make db-shell`
3. Check environment variables in `.env`

### Database connection issues

1. Ensure PostgreSQL is running: `docker-compose ps postgres`
2. Check database credentials match in `.env` and `docker-compose.yml`
3. Wait for database to be ready (check health status)

### Redis connection issues

1. Ensure Redis is running: `docker-compose ps redis`
2. Test connection: `make redis-cli` then `PING`

### OAuth authentication fails

1. Verify OAuth credentials in `.env`
2. Check redirect URLs match in OAuth provider settings
3. Ensure frontend URL is correctly configured

## API Documentation

For detailed API documentation, you can:

1. Import the Postman collection (coming soon)
2. Use the interactive API explorer (coming soon)
3. Refer to the handler files in `app/backend/internal/handlers/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:
- Create an issue on GitHub
- Contact: [your-email@example.com]
