package utils

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	SessionCookieName = "chatshare_session"
	SessionMaxAge     = 7 * 24 * 60 * 60 // 7 days in seconds
)

// SetSessionCookie sets a secure session cookie
func SetSessionCookie(c *gin.Context, token string, maxAge int, secure bool) {
	c.SetCookie(
		SessionCookieName,
		token,
		maxAge,
		"/",
		"",
		secure, // Set to true in production with HTTPS
		true,   // HttpOnly - prevents JavaScript access
	)
}

// GetSessionCookie retrieves the session cookie
func GetSessionCookie(c *gin.Context) (string, error) {
	return c.Cookie(SessionCookieName)
}

// ClearSessionCookie removes the session cookie
func ClearSessionCookie(c *gin.Context) {
	c.SetCookie(
		SessionCookieName,
		"",
		-1,
		"/",
		"",
		false,
		true,
	)
}

// SetSameSiteCookie sets a cookie with SameSite attribute for better security
func SetSameSiteCookie(c *gin.Context, name, value string, maxAge int, path, domain string, secure, httpOnly bool, sameSite http.SameSite) {
	cookie := &http.Cookie{
		Name:     name,
		Value:    value,
		MaxAge:   maxAge,
		Path:     path,
		Domain:   domain,
		Secure:   secure,
		HttpOnly: httpOnly,
		SameSite: sameSite,
	}
	http.SetCookie(c.Writer, cookie)
}

// SetAuthCookie sets an authentication cookie with secure defaults
func SetAuthCookie(c *gin.Context, token string, isProduction bool) {
	maxAge := int(7 * 24 * time.Hour / time.Second) // 7 days

	SetSameSiteCookie(
		c,
		SessionCookieName,
		token,
		maxAge,
		"/",
		"",
		isProduction, // Secure flag (HTTPS only in production)
		true,         // HttpOnly
		http.SameSiteLaxMode,
	)
}
