/** Known AI crawler and search engine user-agent patterns. */
export interface KnownBot {
  name: string
  category: 'ai_crawler' | 'search_engine'
  patterns: RegExp[]
}

export const KNOWN_BOTS: KnownBot[] = [
  // AI Crawlers
  { name: 'ClaudeBot',        category: 'ai_crawler',    patterns: [/claudebot/i, /claude-web/i] },
  { name: 'GPTBot',           category: 'ai_crawler',    patterns: [/gptbot/i] },
  { name: 'ChatGPT-User',     category: 'ai_crawler',    patterns: [/chatgpt-user/i] },
  { name: 'PerplexityBot',    category: 'ai_crawler',    patterns: [/perplexitybot/i] },
  { name: 'Googlebot-AI',     category: 'ai_crawler',    patterns: [/google-extended/i, /googleother/i] },
  { name: 'FacebookBot',      category: 'ai_crawler',    patterns: [/facebookbot/i] },
  { name: 'Applebot-Extended',category: 'ai_crawler',    patterns: [/applebot-extended/i] },
  { name: 'YouBot',           category: 'ai_crawler',    patterns: [/youbot/i] },
  { name: 'CCBot',            category: 'ai_crawler',    patterns: [/ccbot/i] },
  { name: 'CohereCrawler',    category: 'ai_crawler',    patterns: [/cohere-ai/i] },
  { name: 'AI2Bot',           category: 'ai_crawler',    patterns: [/ai2bot/i] },
  { name: 'Bytespider',       category: 'ai_crawler',    patterns: [/bytespider/i] },
  { name: 'Diffbot',          category: 'ai_crawler',    patterns: [/diffbot/i] },

  // Search Engines
  { name: 'Googlebot',        category: 'search_engine', patterns: [/googlebot/i] },
  { name: 'Bingbot',          category: 'search_engine', patterns: [/bingbot/i, /msnbot/i] },
  { name: 'DuckDuckBot',      category: 'search_engine', patterns: [/duckduckbot/i] },
  { name: 'Baiduspider',      category: 'search_engine', patterns: [/baiduspider/i] },
  { name: 'YandexBot',        category: 'search_engine', patterns: [/yandexbot/i] },
  { name: 'Sogou',            category: 'search_engine', patterns: [/sogou/i] },
  { name: 'Exabot',           category: 'search_engine', patterns: [/exabot/i] },
  { name: 'ia_archiver',      category: 'search_engine', patterns: [/ia_archiver/i] },
]
