# Authentication Flow and State Management

## Overview

This document describes the complete authentication flow for Google and LINE login, including state management and profile icon display logic.

## Authentication Flow

### Google Authentication Flow

```
User clicks "Sign in with Google"
    ↓
LoginScreen.handleGoogleSignIn()
    ↓
authService.signInWithGoogle()
    ↓
1. Configure Google Sign-In SDK
    ↓
2. GoogleSignin.signIn() - Opens Google Sign-In UI
    ↓
3. User selects Google account and authorizes
    ↓
4. Receive userInfo from Google
    ↓
5. Create AuthResponse object:
   - token: mock_token_{timestamp}
   - user:
     * id: userInfo.data.user.id
     * email: userInfo.data.user.email
     * name: userInfo.data.user.name
     * avatar: userInfo.data.user.photo (Google profile photo URL)
     * provider: 'google'
     * role: 'user'
     * status: 'active'
     * email_verified: true
    ↓
6. Store in AsyncStorage:
   - 'auth_token': authResponse.token
   - 'user': JSON.stringify(authResponse.user)
    ↓
7. Return authResponse to LoginScreen
    ↓
8. Show success Alert popup
    ↓
9. User clicks OK
    ↓
10. Call refreshUser() from AuthContext
    ↓
11. AuthContext updates state:
    - user: authResponse.user
    - isLoggedIn: true
    ↓
12. RootNavigator detects isLoggedIn = true
    ↓
13. Automatically switches from Login stack to Main stack
    ↓
14. User sees HomeScreen with profile icon
```

### LINE Authentication Flow

```
User clicks "Sign in with LINE"
    ↓
LoginScreen.handleLineSignIn()
    ↓
1. Check if LINE login is available (channel ID configured)
    ↓
2. Fetch OAuth URL from backend:
   GET {API_BASE_URL}/auth/line/url
    ↓
3. Backend returns:
   - url: LINE OAuth URL
   - state: CSRF protection token
    ↓
4. Store state in AsyncStorage: 'line_oauth_state'
    ↓
5. Navigate to LineLoginWebView screen with OAuth URL
    ↓
6. User sees LINE login page in WebView
    ↓
7. User logs in with LINE credentials
    ↓
8. LINE redirects with authorization code
    ↓
9. WebView intercepts redirect and stores:
   - 'line_auth_code': authorization code
    ↓
10. Navigate back to LoginScreen
    ↓
11. LoginScreen.checkLineCallback() runs (useFocusEffect)
    ↓
12. Read 'line_auth_code' from AsyncStorage
    ↓
13. Exchange code for token:
    POST {API_BASE_URL}/auth/line/callback
    Body: { code, state }
    ↓
14. Backend validates code and returns:
    - token: JWT token
    - user:
      * id: LINE user ID
      * email: LINE email (may be empty)
      * name: LINE display name
      * avatar: LINE profile picture URL
      * provider: 'line'
      * role: 'user'
      * status: 'active'
      * email_verified: false/true
    ↓
15. Store in AsyncStorage:
    - 'auth_token': authResponse.token
    - 'user': JSON.stringify(authResponse.user)
    ↓
16. Show success Alert popup
    ↓
17. User clicks OK
    ↓
18. Call refreshUser() from AuthContext
    ↓
19. AuthContext updates state:
    - user: authResponse.user
    - isLoggedIn: true
    ↓
20. RootNavigator detects isLoggedIn = true
    ↓
21. Automatically switches from Login stack to Main stack
    ↓
22. User sees HomeScreen with profile icon
```

## State Management

### AsyncStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `auth_token` | string | JWT authentication token |
| `user` | JSON string | User profile data |
| `line_oauth_state` | string | CSRF protection token for LINE OAuth |
| `line_auth_code` | string | Temporary storage for LINE authorization code |
| `line_login_error` | string | Temporary storage for LINE login errors |

### AuthContext State

Located in: `src/contexts/AuthContext.tsx`

**State Variables:**
- `user: User | null` - Current user object
- `loading: boolean` - Loading state during auth checks
- `isLoggedIn: boolean` - Whether user is authenticated

**Methods:**
- `login()` - Google login (calls signInWithGoogle)
- `logout()` - Clear auth state and AsyncStorage
- `refreshUser()` - Reload user from API or AsyncStorage
- `dummyLogin()` - Demo login for testing

### User Data Structure

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;          // Profile photo URL (Google/LINE)
  provider: string;        // 'google' | 'line' | 'dummy'
  role: string;            // 'user' | 'admin'
  status: string;          // 'active' | 'inactive'
  email_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}
```

## Profile Icon Display Logic

Located in: `src/screens/HomeScreen.tsx`

### Decision Flow

```
User is logged in?
    ↓
YES → Check avatar field
    ↓
    ├─ Has avatar URL (avatar !== '')
    │   ↓
    │   Display: <Image source={{ uri: user.avatar }} />
    │   - Shows Google profile photo (for Google login)
    │   - Shows LINE profile picture (for LINE login)
    │
    └─ No avatar URL (avatar === '')
        ↓
        Check provider field
        ↓
        ├─ provider === 'google'
        │   ↓
        │   Display: Google icon (FontAwesome 'google')
        │   - Blue color (#4285F4)
        │   - White background
        │   - Blue border
        │
        ├─ provider === 'line'
        │   ↓
        │   Display: LINE icon (FontAwesome 'comment')
        │   - Green color (#00B900)
        │   - White background
        │   - Green border
        │
        └─ Other provider
            ↓
            Display: Default account icon
            - Material Icon 'account-circle'
            - Sage green color (#A8B896)
```

### Code Implementation

```tsx
{user?.avatar && user.avatar !== '' ? (
  <Image
    source={{ uri: user.avatar }}
    style={styles.profileAvatar}
  />
) : (
  <View style={styles.profileAvatarPlaceholder}>
    {user?.provider === 'google' ? (
      <View style={styles.googleIconContainer}>
        <FontAwesome name="google" size={24} color="#4285F4" />
      </View>
    ) : user?.provider === 'line' ? (
      <View style={styles.lineIconContainer}>
        <FontAwesome name="comment" size={24} color="#00B900" />
      </View>
    ) : (
      <Icon name="account-circle" size={36} color="#A8B896" />
    )}
  </View>
)}
```

### Icon Styles

**Google Icon Container:**
```tsx
googleIconContainer: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#FFF',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#4285F4',  // Google blue
}
```

**LINE Icon Container:**
```tsx
lineIconContainer: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#FFF',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#00B900',  // LINE green
}
```

**Profile Avatar:**
```tsx
profileAvatar: {
  width: 36,
  height: 36,
  borderRadius: 18,
  borderWidth: 2,
  borderColor: '#A8B896',  // Sage green border
}
```

## Navigation Flow

### RootNavigator Logic

Located in: `src/navigation/RootNavigator.tsx`

```tsx
{!isLoggedIn ? (
  // Not logged in - Show login screens
  <>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="LineLoginWebView" component={LineLoginWebView} />
  </>
) : (
  // Logged in - Show main app screens
  <>
    <Stack.Screen name="Main" component={DrawerNavigator} />
    <Stack.Screen name="Detail" component={DetailScreen} />
    <Stack.Screen name="ShareDetail" component={ShareDetailScreen} />
  </>
)}
```

**Key Points:**
- Navigation is automatically controlled by `isLoggedIn` state
- No manual navigation needed after login
- When `isLoggedIn` changes to `true`, RootNavigator re-renders and shows Main stack
- When `isLoggedIn` changes to `false`, RootNavigator re-renders and shows Login stack

## Authentication Check on App Launch

Located in: `src/contexts/AuthContext.tsx`

```tsx
useEffect(() => {
  checkAuthStatus();
}, []);

const checkAuthStatus = async () => {
  try {
    setLoading(true);
    const authenticated = await isAuthenticated();

    if (authenticated) {
      // Try to get current user from API
      const currentUser = await getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true);
      } else {
        // If API call fails, try to get stored user
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    setIsLoggedIn(false);
    setUser(null);
  } finally {
    setLoading(false);
  }
};
```

**Process:**
1. Check if auth token exists in AsyncStorage
2. Try to fetch current user from API (validates token)
3. If API fails, fallback to stored user in AsyncStorage
4. Update `isLoggedIn` and `user` state
5. RootNavigator reacts to state change

## Logout Flow

```
User clicks logout
    ↓
AuthContext.logout()
    ↓
authService.logout()
    ↓
1. Clear AsyncStorage:
   - Remove 'auth_token'
   - Remove 'user'
   - Remove 'line_oauth_state'
   - Remove 'line_auth_code'
    ↓
2. Sign out from Google SDK (if applicable)
    ↓
3. Return to AuthContext
    ↓
4. Update state:
   - user: null
   - isLoggedIn: false
    ↓
5. RootNavigator detects isLoggedIn = false
    ↓
6. Automatically switches to Login stack
    ↓
7. User sees LoginScreen
```

## Error Handling

### Google Login Errors

| Error Code | Description | User Message |
|------------|-------------|--------------|
| `SIGN_IN_CANCELLED` | User cancelled the sign-in | "Sign in cancelled" |
| `IN_PROGRESS` | Sign-in already in progress | "Sign in already in progress" |
| `PLAY_SERVICES_NOT_AVAILABLE` | Google Play Services unavailable | "Play Services not available" |

### LINE Login Errors

| Scenario | Handling |
|----------|----------|
| Channel ID not configured | Alert: "LINE login requires backend configuration" |
| Backend URL unavailable | Alert: "Cannot connect to backend" |
| User cancelled | Silent - no alert shown |
| OAuth code exchange failed | Alert with error message from backend |

## Security Considerations

1. **CSRF Protection**: LINE OAuth uses state parameter for CSRF protection
2. **Token Storage**: Auth tokens stored in AsyncStorage (encrypted on iOS)
3. **Token Validation**: Backend validates all OAuth codes and tokens
4. **Secure WebView**: LINE login uses WebView with HTTPS only
5. **State Cleanup**: OAuth state cleaned up after login/error

## Testing

### Demo Login

For testing without actual OAuth:
```tsx
dummyLogin() // Creates a mock user with provider: 'google'
```

Located in: `src/contexts/AuthContext.tsx`

Creates a demo user:
- id: 'dummy-user-123'
- email: 'dummy@example.com'
- name: 'Demo User'
- avatar: '' (empty - will show Google icon)
- provider: 'google'

## Files Reference

| File | Purpose |
|------|---------|
| `src/services/authService.ts` | Authentication API calls and Google/LINE SDK integration |
| `src/contexts/AuthContext.tsx` | Global auth state management |
| `src/screens/LoginScreen.tsx` | Login UI and OAuth initiation |
| `src/screens/LineLoginWebView.tsx` | LINE OAuth WebView handler |
| `src/screens/HomeScreen.tsx` | Profile icon display |
| `src/navigation/RootNavigator.tsx` | Auth-based navigation routing |

## Environment Variables

Required in `.env` file:

```
# Google Sign-In
GOOGLE_WEB_CLIENT_ID=your-google-web-client-id

# LINE Login
LINE_CHANNEL_ID=your-line-channel-id

# Backend API
API_BASE_URL=http://localhost:8080/api/v1
```

## Debug Logging

Enable detailed auth logging in HomeScreen:

```tsx
console.log('========== HomeScreen Auth Debug ==========');
console.log('isLoggedIn:', isLoggedIn);
console.log('user:', JSON.stringify(user, null, 2));
console.log('user.avatar:', user?.avatar);
console.log('user.provider:', user?.provider);
console.log('Has avatar:', user?.avatar && user.avatar !== '');
console.log('Is google:', user?.provider === 'google');
console.log('Is line:', user?.provider === 'line');
console.log('==========================================');
```

This logs the complete auth state and helps debug icon display issues.
