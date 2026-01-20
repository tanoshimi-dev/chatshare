package utils

import "strings"

// DetectChatTypeFromURL automatically detects the chat type based on the URL
func DetectChatTypeFromURL(url string) string {

	// Check for Claude AI
	if strings.Contains(url, "claude.ai") {
		return "claude"
	}

	// Check for Microsoft Copilot
	if strings.Contains(url, "copilot.microsoft.com") || strings.Contains(url, "bing.com/chat") {
		return "copilot"
	}

	// Check for ChatGPT
	if strings.Contains(url, "chat.openai.com") || strings.Contains(url, "chatgpt.com") {
		return "chatgpt"
	}

	// Check for Google Gemini
	if strings.Contains(url, "gemini.google.com") || strings.Contains(url, "ai.google.dev/gemini") {
		return "gemini"
	}

	// Default to unknown if no match
	return "unknown"
}
