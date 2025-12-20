App Features for users:
- Share Chat public link
- Read someone's chats
- Mark favorite chats
- Search chats by keywords
- Share favorite chats
- Export chats list to CSV

App required functions:
- For User 
  - authentication using OAuth Google or LINE
  - Check user's email is verified
  - Chat public link registration with catego 
  - Search chat by keywords, category, user, etc
  - Mark good for chats
  - Mark favorite users
  - Favorite Ranking 
    - Ranking by number of favorites
    - Ranking by number of shares
    - Ranking by number of comments
    - Ranking by number of views
- For Admin
  - Manage users
  - Manage chats
  - Manage categories
  - Manage keywords
  - Manage search filters
  - Check chat link validity
  - Malicious activity detection
  - User activity monitoring
  - Chat content moderation

App architecture:
- Frontend（mobile）: React Native
- Frontend（Web）: React using Material UI
- Backend: Golang with Gin
- Database: PostgreSQL
- Authentication: OAuth Google or LINE
- Chaching: Redis
