package utils

import "strings"

// DetectChatTypeFromURL automatically detects the chat type based on the URL
func DetectChatTypeFromURL(url string) string {
	url = strings.ToLower(url)

	// Check for Claude AI
	if strings.Contains(url, "claude.ai") {
		return "claude"
	}

	// Check for Microsoft Copilot
	if strings.Contains(url, "copilot.microsoft.com") || strings.Contains(url, "bing.com/chat") {
		return "copilot"
	}

	// Check for ChatGPT (default)
	if strings.Contains(url, "chat.openai.com") || strings.Contains(url, "chatgpt.com") {
		return "chatgpt"
	}

	// Default to ChatGPT if no match
	return "chatgpt"
}
