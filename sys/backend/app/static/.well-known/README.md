# Apple App Site Association

This directory contains the `apple-app-site-association` file for iOS Universal Links and Web Credentials.

## File Location
- Path: `static/.well-known/apple-app-site-association`
- Endpoint: `https://backend.chatshare.dev/.well-known/apple-app-site-association`

## How to Update

You can edit the `apple-app-site-association` file directly **without rebuilding the backend**. The server will read the file on each request.

### Steps:
1. Edit `static/.well-known/apple-app-site-association`
2. Update your Team ID and Bundle ID
3. Save the file
4. The changes take effect immediately (no restart needed)

## Configuration

Replace the following values in the JSON file:

- `YOUR_TEAM_ID`: Your Apple Developer Team ID (10 characters, e.g., "ABCDE12345")
- `YOUR_BUNDLE_ID`: Your iOS app Bundle Identifier (e.g., "com.chatshare.app")

### Example:
```json
{
  "applinks": {
    "details": [
      {
        "appIDs": [
          "ABCDE12345.com.chatshare.app"
        ],
        "components": [
          {
            "/": "*",
            "comment": "Matches all paths"
          }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": [
      "ABCDE12345.com.chatshare.app"
    ]
  }
}
```

## Path Configuration

The current configuration matches **all paths** (`"/"` : `"*"`). You can customize this to match specific paths:

### Example: Match specific paths
```json
"components": [
  {
    "/": "/chats/*",
    "comment": "Matches all chat URLs"
  },
  {
    "/": "/users/*",
    "comment": "Matches all user profile URLs"
  }
]
```

### Example: Exclude paths
```json
"components": [
  {
    "/": "*",
    "exclude": true,
    "comment": "Exclude admin paths"
  },
  {
    "/": "/admin/*"
  }
]
```

## Testing

Test the endpoint with:
```bash
curl https://backend.chatshare.dev/.well-known/apple-app-site-association
```

Or validate with Apple's CDN Content Delivery Network:
```bash
curl https://app-site-association.cdn-apple.com/a/v1/backend.chatshare.dev
```

## Documentation

- [Apple Universal Links Documentation](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content)
- [AASA File Format](https://developer.apple.com/documentation/bundleresources/applinks)
