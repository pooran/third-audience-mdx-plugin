import type { BotDetectionResult } from './bot-detection-result.js'
import { KNOWN_BOTS } from './known-patterns.js'

export interface DetectBotInput {
  userAgent: string
  /** Optional: headers map for heuristic checks */
  headers?: Record<string, string | string[] | undefined>
  /** Optional: IP address */
  ip?: string
}

/**
 * Three-layer bot detection pipeline:
 * 1. Known pattern matching (O(n) UA string match)
 * 2. Heuristic signals (missing headers, headless indicators)
 * 3. Auto-learner flag (unknown UAs that behave bot-like)
 */
export function detectBot(input: DetectBotInput): BotDetectionResult {
  const ua = input.userAgent ?? ''

  // Layer 1: known pattern match
  for (const bot of KNOWN_BOTS) {
    for (const pattern of bot.patterns) {
      if (pattern.test(ua)) {
        return {
          isBot: true,
          botName: bot.name,
          confidence: 'high',
          detectionMethod: 'known_pattern',
          category: bot.category,
          rawUserAgent: ua,
        }
      }
    }
  }

  // Layer 2: heuristics
  const heuristicResult = checkHeuristics(ua, input.headers ?? {})
  if (heuristicResult) return { ...heuristicResult, rawUserAgent: ua }

  // Layer 3: auto-learner — flag suspicious unknown UAs for review
  if (looksLikeBotUa(ua)) {
    return {
      isBot: true,
      botName: null,
      confidence: 'low',
      detectionMethod: 'auto_learned',
      category: 'unknown_bot',
      rawUserAgent: ua,
    }
  }

  return {
    isBot: false,
    botName: null,
    confidence: 'high',
    detectionMethod: 'none',
    category: 'human',
    rawUserAgent: ua,
  }
}

function checkHeuristics(
  ua: string,
  headers: Record<string, string | string[] | undefined>
): Omit<BotDetectionResult, 'rawUserAgent'> | null {
  // Headless Chrome signals
  if (/headlesschrome/i.test(ua)) {
    return { isBot: true, botName: 'HeadlessChrome', confidence: 'medium', detectionMethod: 'heuristic', category: 'unknown_bot' }
  }
  if (/phantomjs/i.test(ua)) {
    return { isBot: true, botName: 'PhantomJS', confidence: 'high', detectionMethod: 'heuristic', category: 'unknown_bot' }
  }
  if (/selenium/i.test(ua)) {
    return { isBot: true, botName: 'Selenium', confidence: 'high', detectionMethod: 'heuristic', category: 'unknown_bot' }
  }

  // Empty or very short UA is suspicious
  if (ua.trim().length < 10) {
    return { isBot: true, botName: null, confidence: 'low', detectionMethod: 'heuristic', category: 'unknown_bot' }
  }

  // Missing typical browser headers
  const hasAcceptLang = !!headers['accept-language']
  const hasAcceptEncoding = !!headers['accept-encoding']
  if (!hasAcceptLang && !hasAcceptEncoding) {
    return { isBot: true, botName: null, confidence: 'low', detectionMethod: 'heuristic', category: 'unknown_bot' }
  }

  return null
}

function looksLikeBotUa(ua: string): boolean {
  return (
    /bot|crawler|spider|scraper|fetch|http|python|curl|java|ruby|go-http|node/i.test(ua) &&
    !/chrome|firefox|safari|edge|opera/i.test(ua)
  )
}
