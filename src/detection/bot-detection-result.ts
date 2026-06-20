export interface BotDetectionResult {
  isBot: boolean
  botName: string | null       // 'ClaudeBot', 'GPTBot', 'PerplexityBot', etc.
  confidence: 'high' | 'medium' | 'low'
  detectionMethod: 'known_pattern' | 'heuristic' | 'auto_learned' | 'none'
  category: 'ai_crawler' | 'search_engine' | 'unknown_bot' | 'human'
  rawUserAgent: string
}
