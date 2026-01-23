#!/bin/bash

# Advanced Search API Test Script
# This script demonstrates various ways to use the advanced search endpoint

BASE_URL="http://localhost:8080/api/v1"

echo "=== Advanced Search API Test Cases ==="
echo ""

# Test 1: Search by chat type
echo "1. Search by chat type (ChatGPT):"
curl -s "${BASE_URL}/search/advanced?chat_type=chatgpt&page_size=5" | jq '.data[] | {title, chat_type, created_at}'
echo ""

# Test 2: Search by date range (last 30 days)
echo "2. Search by date range (last 30 days):"
DATE_FROM=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d "30 days ago" +%Y-%m-%d)
DATE_TO=$(date +%Y-%m-%d)
curl -s "${BASE_URL}/search/advanced?date_from=${DATE_FROM}&date_to=${DATE_TO}&page_size=5" | jq '.pagination, .data[] | select(.title) | {title, created_at}'
echo ""

# Test 3: Search with text query and chat type
echo "3. Search with text query 'AI' and chat type:"
curl -s "${BASE_URL}/search/advanced?q=AI&chat_type=chatgpt&page_size=5" | jq '.data[] | {title, chat_type, description}'
echo ""

# Test 4: Sort by favorite count (most popular)
echo "4. Most popular chats (by favorites):"
curl -s "${BASE_URL}/search/advanced?sort_by=favorite_count&sort_order=desc&page_size=5" | jq '.data[] | {title, favorite_count, view_count}'
echo ""

# Test 5: Sort by view count
echo "5. Most viewed chats:"
curl -s "${BASE_URL}/search/advanced?sort_by=view_count&sort_order=desc&page_size=5" | jq '.data[] | {title, view_count, created_at}'
echo ""

# Test 6: Get categories first, then search by category
echo "6. Search by category (first get categories):"
CATEGORY_ID=$(curl -s "${BASE_URL}/categories" | jq -r '.data[0].id')
if [ "$CATEGORY_ID" != "null" ] && [ -n "$CATEGORY_ID" ]; then
    echo "Using category ID: $CATEGORY_ID"
    curl -s "${BASE_URL}/search/advanced?category_id=${CATEGORY_ID}&page_size=5" | jq '.data[] | {title, category}'
else
    echo "No categories found"
fi
echo ""

# Test 7: Pagination test
echo "7. Pagination (page 1 vs page 2):"
echo "Page 1:"
curl -s "${BASE_URL}/search/advanced?page=1&page_size=3" | jq '.pagination'
echo "Page 2:"
curl -s "${BASE_URL}/search/advanced?page=2&page_size=3" | jq '.pagination'
echo ""

# Test 8: Combined filters
echo "8. Combined search (ChatGPT + last week + sorted by favorites):"
WEEK_AGO=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d)
curl -s "${BASE_URL}/search/advanced?chat_type=chatgpt&date_from=${WEEK_AGO}&sort_by=favorite_count&sort_order=desc&page_size=5" | jq '.data[] | {title, chat_type, favorite_count, created_at}'
echo ""

# Test 9: Search by user (if you have a user ID)
echo "9. Search by user (example - replace with actual user ID):"
echo "curl \"${BASE_URL}/search/advanced?user_id=YOUR_USER_ID&page_size=5\""
echo ""

echo "=== Test Complete ==="
