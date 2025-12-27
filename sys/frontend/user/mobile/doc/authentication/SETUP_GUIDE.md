# ChatShare App Setup Guide

Your React Native app with drawer navigation has been configured! The app includes:

## Features Implemented

- ✅ Drawer navigation with sage green theme (#A8B896)
- ✅ Main screen with cream/beige background (#F5F5DC)
- ✅ Header with hamburger menu and notification bell icon
- ✅ Bottom action bar with share and heart/favorite icons
- ✅ Custom drawer with back arrow
- ✅ Material Icons integration

## Running the App

### For Android:

```bash
# Start Metro bundler
npm start

# In a new terminal, run Android
npm run android
```

### For iOS:

```bash
# Install iOS dependencies
cd ios
pod install
cd ..

# Run iOS
npm run ios
```

## Project Structure

```
chatshare/
├── src/
│   ├── screens/
│   │   └── HomeScreen.tsx         # Main screen with header and bottom bar
│   └── navigation/
│       ├── DrawerNavigator.tsx     # Drawer navigation setup
│       └── CustomDrawerContent.tsx # Custom drawer with sage green theme
├── App.tsx                         # App entry point
└── ...
```

## Customization

### Colors

The app uses a clean, minimal color scheme:

- **Sage Green**: `#A8B896` (drawer background, borders)
- **Cream/Beige**: `#F5F5DC` (main screen background)
- **Dark Gray**: `#333` (text and icons)

To change colors, update the StyleSheet sections in:

- `src/screens/HomeScreen.tsx`
- `src/navigation/CustomDrawerContent.tsx`

### Adding Menu Items

Edit `src/navigation/CustomDrawerContent.tsx` to add more menu items in the drawer.

### Adding Content

Add your main content in `src/screens/HomeScreen.tsx` within the `content` View.

## Troubleshooting

If you encounter issues:

1. **Clear cache and rebuild**:

   ```bash
   npm start -- --reset-cache
   ```

2. **For Android build errors**:

   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

3. **For iOS build errors**:
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   npm run ios
   ```

## Next Steps

- Add more screens (Profile, Settings, etc.)
- Implement navigation between screens
- Add actual content to the main screen
- Connect to backend APIs
- Add authentication

Happy coding! 🚀
