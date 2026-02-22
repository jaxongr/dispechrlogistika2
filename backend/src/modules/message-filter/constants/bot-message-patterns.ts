/**
 * Regex patterns to identify bot-generated messages.
 * Used to filter out automated/bot content from message streams.
 */
export const BOT_MESSAGE_PATTERNS: RegExp[] = [
  // Starts with a slash command (e.g., /start, /help)
  /^\/\w+/,

  // Mentions a bot username (e.g., @somebot)
  /^@\w+bot\b/i,

  // Inline bot patterns
  /inline.*bot/i,
  /bot.*inline/i,

  // Bot result/search output keywords
  /результат|нашёл|найдено|показыва/i,

  // Subscribe/join prompts
  /подписат|подпис|канал|группу|чат/i,

  // Starts with common bot emojis
  /^🤖/,
  /^⚡/,
  /^📊/,

  // Auto-post / auto-mailing keywords
  /автоматическ|автопост|авторассылк/i,
];
