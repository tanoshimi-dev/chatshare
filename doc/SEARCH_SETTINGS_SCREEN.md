# Search Settings Screen - Mobile App

## Overview
A comprehensive search settings screen that allows users to filter chat searches with multiple conditions and seamlessly navigate to the Timeline screen with applied filters.

## Features

### Search Conditions (検索条件)

1. **カテゴリ (Category)**
   - Filter chats by category
   - Select from available categories
   - Option to select "All Categories"
   - Shows category icons and names

2. **チャットタイプ (Chat Type)**
   - Filter by AI platform type
   - Options:
     - 🤖 ChatGPT
     - 🧠 Claude
     - 💻 Copilot
     - ✨ Gemini
   - Option to select "All Types"

3. **日付範囲 (Date Range)**
   - Filter by creation date
   - **From Date**: Start date of the range
   - **To Date**: End date of the range
   - Uses native date picker for both iOS and Android
   - Can clear individual dates
   - Validates that "To Date" is after "From Date"

4. **Search Actions**
   - **Search Button**: Execute search with selected filters
   - **Clear All Button**: Reset all filters to default

## UI/UX Features

- **Clean Design**: Matches the app's sage green theme (#F5F5DC background)
- **Visual Feedback**: Selected items are highlighted
- **Icons**: Checkmarks indicate selected options
- **Easy Navigation**: Back button to return to previous screen
- **Responsive**: Works on all screen sizes

## Navigation

### Accessing the Screen
1. Open the drawer menu (hamburger menu)
2. Tap "Search Settings" menu item
3. The screen opens with all filter options

### Menu Integration
- Added to drawer navigation as "SearchSettings"
- Menu item with search icon (🔍)
- Located between "Account" and "Logout"

## Implementation Details

### Files Created
- **SearchSettingsScreen.tsx**: Main search settings screen component

### Files Modified
- **DrawerNavigator.tsx**: Added SearchSettings screen to drawer
- **CustomDrawerContent.tsx**: Added menu item for Search Settings
- **package.json**: Added @react-native-community/datetimepicker dependency

### Dependencies
- `@react-native-community/datetimepicker`: Native date picker component
- Already uses existing services: `fetchCategories` from `api.ts`

## Usage Flow

```
1. User opens drawer menu
2. Taps "Search Settings"
3. Select filters:
   - Choose category (optional)
   - Choose chat type (optional)
   - Set date range (optional)
4. Tap "Search" button
5. (Future: Navigate to search results with filters applied)
6. Or tap "Clear All" to reset filters
```

## Future Enhancements

### Planned Features
1. **User Filter (ユーザー)**
   - Add user selection/search
   - Filter chats by specific user

2. **Search Results Integration**
   - Connect to backend `/api/v1/search/advanced` endpoint
   - Display filtered results
   - Navigate from SearchSettings to results screen

3. **Saved Searches**
   - Save frequently used filter combinations
   - Quick access to saved searches

4. **Search History**
   - Track recent searches
   - Reuse previous search filters

## API Integration (Future)

When connected to the backend, the search will use:

```typescript
// Example API call
const searchParams = {
  category_id: selectedCategoryId,
  chat_type: selectedChatType,
  date_from: dateFrom?.toISOString().split('T')[0],
  date_to: dateTo?.toISOString().split('T')[0],
  page: 1,
  page_size: 20,
  sort_by: 'created_at',
  sort_order: 'desc'
};

const results = await fetch(
  `${API_BASE_URL}/search/advanced?${new URLSearchParams(searchParams)}`
);
```

## Testing

### To Test
1. Start the app: `npm run ios` or `npm run android`
2. Open drawer menu
3. Tap "Search Settings"
4. Test each filter:
   - Select different categories
   - Select different chat types
   - Set date ranges
   - Verify date picker works
   - Test "Clear All" button
   - Test "Search" button

### Verification Points
- ✅ All filters are selectable
- ✅ Selected items show checkmarks
- ✅ Date pickers open correctly
- ✅ Clear buttons work for dates
- ✅ Clear All resets everything
- ✅ Navigation works smoothly
- ✅ Back button returns to previous screen

## Known Limitations

1. **Search functionality**: Currently shows alert with selected filters (not yet connected to search results)
2. **User filter**: Not yet implemented
3. **Persistence**: Filters reset when screen is closed (no state persistence)

## Screenshots

The screen includes:
- Header with back button and title
- Scrollable content area
- Four main sections (Category, Chat Type, Date Range, Actions)
- Clean, organized layout
- Consistent styling with the rest of the app
