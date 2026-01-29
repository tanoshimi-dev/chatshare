package services

import (
	"fmt"

	"github.com/chatshare/backend/internal/config"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

type EmailService struct {
	cfg *config.Config
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{cfg: cfg}
}

// SendAdminNotification sends an email notification to the admin
func (s *EmailService) SendAdminNotification(subject, htmlContent string) error {
	if s.cfg.SendGridAPIKey == "" {
		// Log but don't fail if SendGrid is not configured
		fmt.Println("SendGrid API key not configured, skipping email notification")
		return nil
	}

	from := mail.NewEmail(s.cfg.FromName, s.cfg.FromEmail)
	to := mail.NewEmail("Admin", s.cfg.AdminEmail)
	message := mail.NewSingleEmail(from, subject, to, "", htmlContent)
	client := sendgrid.NewSendClient(s.cfg.SendGridAPIKey)

	response, err := client.Send(message)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	if response.StatusCode >= 400 {
		return fmt.Errorf("sendgrid error: status %d, body: %s", response.StatusCode, response.Body)
	}

	return nil
}

// SendReportNotification sends a notification about a new content report
func (s *EmailService) SendReportNotification(reporterEmail, reportedEmail, contentType, reason, description string) error {
	subject := fmt.Sprintf("[ChatShare] New Content Report: %s", reason)
	htmlContent := fmt.Sprintf(`
		<h2>New Content Report</h2>
		<p><strong>Reporter:</strong> %s</p>
		<p><strong>Reported User:</strong> %s</p>
		<p><strong>Content Type:</strong> %s</p>
		<p><strong>Reason:</strong> %s</p>
		<p><strong>Description:</strong> %s</p>
		<p>Please review this report within 24 hours as per Apple App Store guidelines.</p>
		<p><a href="%s/admin/reports">View Reports Dashboard</a></p>
	`, reporterEmail, reportedEmail, contentType, reason, description, s.cfg.FrontendURL)

	return s.SendAdminNotification(subject, htmlContent)
}

// SendBlockNotification sends a notification when a user is blocked
func (s *EmailService) SendBlockNotification(blockerEmail, blockedEmail, reason string) error {
	subject := "[ChatShare] User Block Action"
	htmlContent := fmt.Sprintf(`
		<h2>User Block Notification</h2>
		<p><strong>Blocker:</strong> %s</p>
		<p><strong>Blocked User:</strong> %s</p>
		<p><strong>Reason:</strong> %s</p>
		<p>This notification is for your records. No action is required unless abuse is suspected.</p>
	`, blockerEmail, blockedEmail, reason)

	return s.SendAdminNotification(subject, htmlContent)
}

// SendContentFlaggedNotification sends a notification when content is auto-flagged
func (s *EmailService) SendContentFlaggedNotification(userEmail, contentType, contentID, matchedKeyword string) error {
	subject := "[ChatShare] Content Auto-Flagged"
	htmlContent := fmt.Sprintf(`
		<h2>Content Auto-Flagged by Filter</h2>
		<p><strong>User:</strong> %s</p>
		<p><strong>Content Type:</strong> %s</p>
		<p><strong>Content ID:</strong> %s</p>
		<p><strong>Matched Keyword:</strong> %s</p>
		<p>Please review this content for potential policy violations.</p>
		<p><a href="%s/admin/chats">View Admin Dashboard</a></p>
	`, userEmail, contentType, contentID, matchedKeyword, s.cfg.FrontendURL)

	return s.SendAdminNotification(subject, htmlContent)
}
