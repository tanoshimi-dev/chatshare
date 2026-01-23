# Advanced Search API Documentation

## Endpoint

```
GET /api/v1/search/advanced
```

## Description

Advanced search endpoint for chats with multiple filter conditions including category, chat type, date range, and user.

## Query Parameters

### Search Filters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `q` | string | No | Text search query for title and description | `AI programming` |
| `category_id` | UUID | No | Filter by category ID (カテゴリ) | `550e8400-e29b-41d4-a716-446655440000` |
| `chat_type` | string | No | Filter by chat type (チャットタイプ) | `chatgpt`, `claude`, `copilot`, `gemini` |
| `date_from` | string | No | Start date for date range filter (日付範囲) | `2025-01-01` |
| `date_to` | string | No | End date for date range filter (日付範囲) | `2025-12-31` |
| `user_id` | UUID | No | Filter by user ID (ユーザー) | `550e8400-e29b-41d4-a716-446655440000` |

### Pagination

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `page_size` | integer | No | 20 | Number of items per page |

### Sorting

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sort_by` | string | No | `created_at` | Field to sort by: `created_at`, `view_count`, `favorite_count`, `share_count`, `comment_count` |
| `sort_order` | string | No | `desc` | Sort order: `asc` or `desc` |

## Request Examples

### 1. Search by Category

```bash
curl "http://localhost:8080/api/v1/search/advanced?category_id=550e8400-e29b-41d4-a716-446655440000"
```

### 2. Search by Chat Type

```bash
curl "http://localhost:8080/api/v1/search/advanced?chat_type=chatgpt"
```

### 3. Search by Date Range

```bash
curl "http://localhost:8080/api/v1/search/advanced?date_from=2025-01-01&date_to=2025-12-31"
```

### 4. Search by User

```bash
curl "http://localhost:8080/api/v1/search/advanced?user_id=550e8400-e29b-41d4-a716-446655440000"
```

### 5. Combined Search with All Filters

```bash
curl "http://localhost:8080/api/v1/search/advanced?q=AI&category_id=550e8400-e29b-41d4-a716-446655440000&chat_type=chatgpt&date_from=2025-01-01&date_to=2025-12-31&user_id=550e8400-e29b-41d4-a716-446655440000&sort_by=favorite_count&sort_order=desc&page=1&page_size=20"
```

### 6. Search with Sorting by Popularity

```bash
curl "http://localhost:8080/api/v1/search/advanced?sort_by=favorite_count&sort_order=desc"
```

## Response Format

### Success Response (200 OK)

```json
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "category_id": "770e8400-e29b-41d4-a716-446655440002",
      "title": "AI Programming Guide",
      "description": "Comprehensive guide to AI programming",
      "public_link": "https://chatgpt.com/share/abc123",
      "chat_type": "chatgpt",
      "is_link_valid": true,
      "is_public": true,
      "is_featured": false,
      "status": "active",
      "view_count": 1250,
      "share_count": 45,
      "favorite_count": 89,
      "good_count": 120,
      "comment_count": 15,
      "created_at": "2025-06-15T10:30:00Z",
      "updated_at": "2025-06-20T14:45:00Z",
      "user": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "https://example.com/avatar.jpg"
      },
      "category": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Programming",
        "slug": "programming",
        "description": "Programming related chats",
        "icon": "💻",
        "color": "#3B82F6"
      },
      "keywords": [
        {
          "id": "880e8400-e29b-41d4-a716-446655440003",
          "chat_id": "550e8400-e29b-41d4-a716-446655440000",
          "keyword_id": "990e8400-e29b-41d4-a716-446655440004",
          "keyword": {
            "id": "990e8400-e29b-41d4-a716-446655440004",
            "name": "AI",
            "slug": "ai"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "status": "error",
  "message": "Invalid request parameters"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "status": "error",
  "message": "Failed to search chats"
}
```

## Filter Details

### カテゴリ (Category)
- Filter chats by specific category
- Use the category UUID from `/api/v1/categories` endpoint
- Example: Technology, Programming, Design, etc.

### チャットタイプ (Chat Type)
- Filter by the AI platform type
- Valid values:
  - `chatgpt`: ChatGPT shared chats
  - `claude`: Claude shared chats
  - `copilot`: GitHub Copilot chats
  - `gemini`: Google Gemini chats

### 日付範囲 (Date Range)
- Filter chats created within a specific date range
- Date format: `YYYY-MM-DD` (ISO 8601)
- `date_from`: Include chats from this date onwards (inclusive)
- `date_to`: Include chats up to this date (inclusive, includes entire day)
- Both parameters are optional and can be used independently

### ユーザー (User)
- Filter chats by the user who created them
- Use the user UUID from user profile or `/api/v1/users/:id` endpoint
- Useful for viewing all chats from a specific user

## Notes

- All filters can be combined for more refined searches
- Text search (`q` parameter) is optional in advanced search
- Only public and active chats are returned
- Results are ordered by creation date (descending) by default
- Maximum page size is limited by server configuration
- Invalid UUIDs or dates are silently ignored
- Date range includes the entire day for `date_to`

## Use Cases

1. **Find recent ChatGPT chats in Programming category**
   ```
   ?chat_type=chatgpt&category_id=<programming_id>&sort_by=created_at&sort_order=desc
   ```

2. **Find most popular chats this month**
   ```
   ?date_from=2026-01-01&date_to=2026-01-31&sort_by=favorite_count&sort_order=desc
   ```

3. **Find all chats by a specific user**
   ```
   ?user_id=<user_id>&sort_by=created_at&sort_order=desc
   ```

4. **Find Claude chats about AI from last week**
   ```
   ?q=AI&chat_type=claude&date_from=2026-01-16&date_to=2026-01-23
   ```
