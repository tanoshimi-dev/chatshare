# ChatShare Mobile App - Test Cases

**App Version:** 0.0.1  
**Platform:** iOS & Android  
**Test Date:** 2026年1月25日  
**Test Environment:** iPhone 17 Simulator, Android Emulator

---

## 1. Authentication & User Management

### 1.1 User Registration
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-001 | Register new user with valid email | 1. Open app<br>2. Navigate to Register screen<br>3. Enter valid email, password<br>4. Click Register | User account created successfully, redirected to Home | High |
| AUTH-002 | Register with invalid email format | 1. Navigate to Register screen<br>2. Enter invalid email (e.g., "test@")<br>3. Click Register | Error message displayed, registration fails | High |
| AUTH-003 | Register with weak password | 1. Navigate to Register screen<br>2. Enter weak password (e.g., "123")<br>3. Click Register | Error message about password requirements | Medium |
| AUTH-004 | Register with existing email | 1. Navigate to Register screen<br>2. Enter already registered email<br>3. Click Register | Error message: Email already exists | High |

### 1.2 User Login
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-101 | Login with valid credentials | 1. Open app<br>2. Enter valid email and password<br>3. Click Login | Successful login, redirect to Home screen | High |
| AUTH-102 | Login with invalid credentials | 1. Navigate to Login screen<br>2. Enter wrong password<br>3. Click Login | Error message displayed, login fails | High |
| AUTH-103 | Login with empty fields | 1. Navigate to Login screen<br>2. Leave fields empty<br>3. Click Login | Validation error displayed | Medium |
| AUTH-104 | LINE Login integration | 1. Navigate to Login screen<br>2. Click "Login with LINE"<br>3. Complete LINE auth flow | Successful LINE authentication and login | High |
| AUTH-105 | Google Sign-In integration | 1. Navigate to Login screen<br>2. Click "Sign in with Google"<br>3. Complete Google auth flow | Successful Google authentication and login | High |
| AUTH-106 | Session persistence | 1. Login successfully<br>2. Close app<br>3. Reopen app | User remains logged in | High |

### 1.3 Account Management
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-201 | View account information | 1. Login<br>2. Navigate to Account screen | User profile information displayed correctly | Medium |
| AUTH-202 | Logout functionality | 1. Login<br>2. Navigate to Settings<br>3. Click Logout | User logged out, redirected to Login screen | High |
| AUTH-203 | Update profile information | 1. Navigate to Account screen<br>2. Update profile fields<br>3. Save changes | Profile updated successfully | Medium |

---

## 2. Navigation & UI

### 2.1 Bottom Tab Navigation
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| NAV-001 | Navigate to Home tab | 1. Login<br>2. Click Home tab | Home screen displayed | High |
| NAV-002 | Navigate to Search tab | 1. Click Search tab | Search screen with categories displayed | High |
| NAV-003 | Navigate to Timeline tab | 1. Click Timeline tab | Timeline screen displayed | High |
| NAV-004 | Navigate to History tab | 1. Click History tab | History screen displayed | Medium |
| NAV-005 | Tab state persistence | 1. Switch between tabs<br>2. Return to previous tab | Previous tab state preserved | Medium |

### 2.2 Drawer Navigation
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| NAV-101 | Open drawer menu | 1. Swipe from left or click menu icon | Drawer opens with navigation options | High |
| NAV-102 | Navigate to Settings | 1. Open drawer<br>2. Click Settings | Settings screen displayed | Medium |
| NAV-103 | Navigate to Favorite Users | 1. Open drawer<br>2. Click Favorite Users | Favorite Users screen displayed | Medium |
| NAV-104 | Close drawer | 1. Open drawer<br>2. Swipe left or click outside | Drawer closes | Low |

### 2.3 Screen Transitions
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| NAV-201 | Navigate to Detail screen | 1. From Home, click item<br>2. Navigate to Detail | Smooth transition, Detail screen loads | High |
| NAV-202 | Navigate to Share Detail | 1. From search results<br>2. Click share item | Share Detail screen displayed | High |
| NAV-203 | Back navigation | 1. Navigate to any detail screen<br>2. Press back button | Return to previous screen | High |

---

## 3. Search Functionality

### 3.1 Basic Search
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SEARCH-001 | Category list display | 1. Navigate to Search screen | All categories displayed with icons | High |
| SEARCH-002 | Search by category | 1. Click a category | Search results for that category displayed | High |
| SEARCH-003 | Empty search results | 1. Search for non-existent term | "No results found" message displayed | Medium |
| SEARCH-004 | Pull to refresh categories | 1. Pull down on category list | Categories refresh | Medium |

### 3.2 Advanced Search
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SEARCH-101 | Navigate to Search Settings | 1. From Search screen<br>2. Click Settings icon | Search Settings screen displayed | Medium |
| SEARCH-102 | Apply search filters | 1. Open Search Settings<br>2. Set filters (date, type, etc.)<br>3. Apply | Filtered results displayed | High |
| SEARCH-103 | Save search settings | 1. Configure search filters<br>2. Save settings<br>3. Return later | Settings persist across sessions | Medium |
| SEARCH-104 | Clear search filters | 1. Set multiple filters<br>2. Click Clear/Reset | All filters cleared | Low |

### 3.3 Saved Searches
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SEARCH-201 | Save a search query | 1. Perform search<br>2. Click "Save Search"<br>3. Name and save | Search saved successfully | Medium |
| SEARCH-202 | Load saved search | 1. Navigate to saved searches<br>2. Click saved search | Search executed with saved parameters | Medium |
| SEARCH-203 | Delete saved search | 1. View saved searches<br>2. Delete a saved search | Search removed from list | Low |

---

## 4. Content Display & Interaction

### 4.1 Home Screen
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| HOME-001 | Display content feed | 1. Navigate to Home screen | Latest content displayed | High |
| HOME-002 | Pull to refresh content | 1. Pull down on Home screen | Content refreshes | Medium |
| HOME-003 | Infinite scroll | 1. Scroll to bottom of feed | More content loads automatically | Medium |
| HOME-004 | Click content item | 1. Click any content item | Navigate to Detail screen | High |

### 4.2 Detail Screen
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DETAIL-001 | Display detail content | 1. Navigate to Detail screen | Full content with metadata displayed | High |
| DETAIL-002 | Add to favorites | 1. View detail<br>2. Click favorite icon | Item added to favorites | Medium |
| DETAIL-003 | Share content | 1. View detail<br>2. Click share button<br>3. Select share method | Content shared successfully | Medium |
| DETAIL-004 | View comments | 1. View detail<br>2. Scroll to comments section | All comments displayed | Medium |

### 4.3 Timeline Screen
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TIME-001 | Display timeline | 1. Navigate to Timeline screen | Chronological timeline displayed | High |
| TIME-002 | Filter by date | 1. Select date filter<br>2. Apply | Timeline filtered by selected date | Medium |
| TIME-003 | Timeline refresh | 1. Pull to refresh | Timeline updates with latest data | Medium |

---

## 5. User Interactions

### 5.1 Favorites
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| FAV-001 | Add item to favorites | 1. View content<br>2. Click favorite icon | Item added, icon state changes | High |
| FAV-002 | Remove from favorites | 1. View favorited item<br>2. Click favorite icon again | Item removed from favorites | High |
| FAV-003 | View favorites list | 1. Navigate to Favorite Users screen | All favorited items displayed | Medium |
| FAV-004 | Empty favorites | 1. View favorites with no items | "No favorites" message displayed | Low |

### 5.2 History
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| HIST-001 | View history | 1. Navigate to History screen | Browsing history displayed | Medium |
| HIST-002 | Click history item | 1. Select history item | Navigate to that content | Medium |
| HIST-003 | Clear history | 1. Open history options<br>2. Click Clear History | All history removed | Low |

### 5.3 Comments
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| COMM-001 | Add comment | 1. View detail<br>2. Enter comment text<br>3. Submit | Comment posted successfully | Medium |
| COMM-002 | View all comments | 1. Navigate to comments section | All comments displayed chronologically | Medium |
| COMM-003 | Delete own comment | 1. View own comment<br>2. Click delete<br>3. Confirm | Comment deleted | Low |

---

## 6. Settings & Preferences

### 6.1 App Settings
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SET-001 | View settings | 1. Navigate to Settings screen | All setting options displayed | Medium |
| SET-002 | Toggle notifications | 1. Toggle notification setting | Setting saved, notifications enabled/disabled | Medium |
| SET-003 | Change app theme | 1. Select theme option<br>2. Apply | App theme changes accordingly | Low |
| SET-004 | Reset to defaults | 1. Modify settings<br>2. Click Reset to Defaults | All settings restored to default | Low |

### 6.2 Search Settings
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SET-101 | Configure default search | 1. Navigate to Search Settings<br>2. Set default parameters | Defaults applied to new searches | Medium |
| SET-102 | Save search preferences | 1. Configure preferences<br>2. Save | Preferences persist across sessions | Medium |

---

## 7. Network & Data

### 7.1 Network Connectivity
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| NET-001 | App with no internet | 1. Disable internet<br>2. Open app<br>3. Try to load content | Error message: No internet connection | High |
| NET-002 | Network recovery | 1. Start with no internet<br>2. Enable internet<br>3. Retry | App recovers and loads data | High |
| NET-003 | Slow network | 1. Simulate slow connection<br>2. Load content | Loading indicators shown, eventual success | Medium |
| NET-004 | API timeout handling | 1. Force API timeout<br>2. Observe behavior | Appropriate error message, retry option | Medium |

### 7.2 Data Persistence
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| DATA-001 | Offline data access | 1. Load content while online<br>2. Go offline<br>3. View cached content | Previously loaded content accessible | Medium |
| DATA-002 | Data synchronization | 1. Make changes offline<br>2. Go online | Changes sync when connection restored | Medium |
| DATA-003 | Clear app cache | 1. Navigate to Settings<br>2. Clear cache | Cache cleared, app size reduced | Low |

---

## 8. Performance & Stability

### 8.1 Performance
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PERF-001 | App launch time | 1. Cold start app | App launches within 3 seconds | High |
| PERF-002 | Smooth scrolling | 1. Scroll through long lists | Smooth scrolling, no lag | High |
| PERF-003 | Memory usage | 1. Use app for extended period<br>2. Monitor memory | No memory leaks, stable usage | Medium |
| PERF-004 | Battery consumption | 1. Use app for 1 hour<br>2. Check battery drain | Reasonable battery consumption | Medium |

### 8.2 Stability
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| STAB-001 | App backgrounding | 1. Use app<br>2. Background app<br>3. Return | App resumes correctly | High |
| STAB-002 | Rapid navigation | 1. Quickly switch between screens | No crashes or UI glitches | High |
| STAB-003 | Concurrent operations | 1. Trigger multiple actions simultaneously | App handles gracefully | Medium |
| STAB-004 | Memory pressure | 1. Run app with low memory<br>2. Observe behavior | App handles low memory gracefully | Medium |

---

## 9. Platform-Specific Tests

### 9.1 iOS Specific
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IOS-001 | Safe area handling | 1. Test on iPhone with notch | Content respects safe areas | High |
| IOS-002 | Swipe gestures | 1. Use iOS swipe gestures | Native gestures work correctly | High |
| IOS-003 | App permissions | 1. Request notifications permission | Permission dialog shown, handled correctly | Medium |
| IOS-004 | Keyboard behavior | 1. Open keyboard<br>2. Type in fields | Keyboard doesn't hide content | Medium |
| IOS-005 | Dark mode support | 1. Enable iOS dark mode | App adapts to system theme | Low |

### 9.2 Android Specific
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AND-001 | Back button behavior | 1. Navigate through app<br>2. Press Android back button | Proper navigation history | High |
| AND-002 | Permissions handling | 1. Request permissions | Permission dialogs shown correctly | Medium |
| AND-003 | Split screen mode | 1. Enable split screen | App functions in split screen | Low |
| AND-004 | Different screen sizes | 1. Test on various Android devices | Layout adapts correctly | Medium |

---

## 10. Integration & Third-Party Services

### 10.1 Authentication Services
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-001 | Firebase integration | 1. Trigger Firebase operations | Operations complete successfully | High |
| INT-002 | LINE Login flow | 1. Complete LINE login<br>2. Verify token exchange | Successful authentication and user creation | High |
| INT-003 | Google Sign-In flow | 1. Complete Google sign-in<br>2. Verify token | Successful authentication | High |

### 10.2 External Services
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| INT-101 | API communication | 1. Make API calls | Successful request/response | High |
| INT-102 | WebView functionality | 1. Open LINE Login WebView<br>2. Complete auth flow | WebView loads and functions correctly | High |
| INT-103 | Deep linking | 1. Open app via deep link<br>2. Verify navigation | App opens to correct screen | Medium |

---

## 11. Security & Privacy

### 11.1 Security
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SEC-001 | Password encryption | 1. Register user<br>2. Verify storage | Password stored encrypted | High |
| SEC-002 | Token management | 1. Login<br>2. Check token storage | Tokens stored securely (AsyncStorage) | High |
| SEC-003 | Session timeout | 1. Login<br>2. Wait for timeout period<br>3. Make request | Session expires, re-login required | Medium |
| SEC-004 | SSL certificate validation | 1. Make HTTPS requests | SSL certificates validated | High |

### 11.2 Privacy
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PRIV-001 | Data permissions | 1. Review app permissions | Only necessary permissions requested | Medium |
| PRIV-002 | User data handling | 1. View privacy policy<br>2. Check data collection | Clear privacy policy, compliant data handling | Medium |

---

## 12. Error Handling

### 12.1 Error Messages
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ERR-001 | API error handling | 1. Trigger API error (500, 404, etc.)<br>2. Observe response | User-friendly error message displayed | High |
| ERR-002 | Validation errors | 1. Submit invalid form data | Clear validation error messages | High |
| ERR-003 | Network error | 1. Lose connection during operation | Graceful error handling, retry option | High |
| ERR-004 | Timeout errors | 1. Trigger request timeout | Timeout message, retry option | Medium |

---

## 13. Accessibility

### 13.1 Accessibility Features
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| A11Y-001 | VoiceOver support (iOS) | 1. Enable VoiceOver<br>2. Navigate app | All elements properly labeled | Medium |
| A11Y-002 | TalkBack support (Android) | 1. Enable TalkBack<br>2. Navigate app | All elements accessible | Medium |
| A11Y-003 | Dynamic type/font scaling | 1. Increase system font size<br>2. Open app | Text scales appropriately | Low |
| A11Y-004 | Color contrast | 1. Review UI elements | Sufficient color contrast for readability | Low |

---

## 14. Localization (Future)

### 14.1 Multi-language Support
| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| L10N-001 | Japanese language | 1. Set device to Japanese<br>2. Open app | App displays in Japanese | Low |
| L10N-002 | English language | 1. Set device to English<br>2. Open app | App displays in English | Low |
| L10N-003 | Date/time formatting | 1. Change locale<br>2. View dates | Dates formatted per locale | Low |

---

## Test Execution Notes

### Testing Priorities
- **High Priority**: Core functionality, authentication, navigation, search
- **Medium Priority**: Settings, favorites, performance, error handling
- **Low Priority**: Edge cases, accessibility, visual refinements

### Testing Devices
- **iOS**: iPhone 17 Simulator (iOS latest), iPhone SE, iPad
- **Android**: Pixel 7 Emulator, Samsung Galaxy S22, various screen sizes

### Test Data Requirements
- Valid test user credentials
- Test categories and content in database
- Mock API responses for error scenarios
- Test LINE and Google accounts for social login

### Known Issues / Bugs
(Document issues found during testing here)

---

## Appendix

### Test Metrics
- Total Test Cases: 150+
- High Priority: 60+
- Medium Priority: 60+
- Low Priority: 30+

### Revision History
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-25 | 1.0 | Initial test case document | QA Team |

---

**End of Test Cases Document**
