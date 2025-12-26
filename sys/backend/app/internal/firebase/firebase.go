package firebase

import (
	"context"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

type FirebaseService struct {
	app        *firebase.App
	authClient *auth.Client
}

func NewFirebaseService(credentialsPath string) (*FirebaseService, error) {
	ctx := context.Background()

	var opt option.ClientOption
	if credentialsPath != "" {
		opt = option.WithCredentialsFile(credentialsPath)
	} else {
		// Use default credentials (for Google Cloud environments)
		opt = option.WithoutAuthentication()
	}

	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return nil, err
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		return nil, err
	}

	log.Println("Firebase Admin SDK initialized successfully")

	return &FirebaseService{
		app:        app,
		authClient: authClient,
	}, nil
}

// CreateOrUpdateUser creates a new Firebase user or updates existing one
func (f *FirebaseService) CreateOrUpdateUser(ctx context.Context, uid, email, displayName, photoURL string, emailVerified bool) error {
	params := (&auth.UserToCreate{}).
		UID(uid).
		Email(email).
		DisplayName(displayName).
		PhotoURL(photoURL).
		EmailVerified(emailVerified)

	// Try to create user
	_, err := f.authClient.CreateUser(ctx, params)
	if err != nil {
		// If user already exists, update instead
		if auth.IsUserNotFound(err) == false {
			updateParams := (&auth.UserToUpdate{}).
				Email(email).
				DisplayName(displayName).
				PhotoURL(photoURL).
				EmailVerified(emailVerified)

			_, err = f.authClient.UpdateUser(ctx, uid, updateParams)
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}

	return nil
}

// GetUser retrieves a user by UID
func (f *FirebaseService) GetUser(ctx context.Context, uid string) (*auth.UserRecord, error) {
	return f.authClient.GetUser(ctx, uid)
}

// GetUserByEmail retrieves a user by email
func (f *FirebaseService) GetUserByEmail(ctx context.Context, email string) (*auth.UserRecord, error) {
	return f.authClient.GetUserByEmail(ctx, email)
}

// DeleteUser deletes a user by UID
func (f *FirebaseService) DeleteUser(ctx context.Context, uid string) error {
	return f.authClient.DeleteUser(ctx, uid)
}

// CreateCustomToken creates a custom token for authentication
func (f *FirebaseService) CreateCustomToken(ctx context.Context, uid string, claims map[string]interface{}) (string, error) {
	return f.authClient.CustomTokenWithClaims(ctx, uid, claims)
}

// VerifyIDToken verifies a Firebase ID token
func (f *FirebaseService) VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error) {
	return f.authClient.VerifyIDToken(ctx, idToken)
}

// SetCustomUserClaims sets custom claims for a user
func (f *FirebaseService) SetCustomUserClaims(ctx context.Context, uid string, claims map[string]interface{}) error {
	return f.authClient.SetCustomUserClaims(ctx, uid, claims)
}
