// src/core/config.ts
var defaultConfig = {
  contentDir: "content",
  dataDir: "data",
  stripSegments: [],
  storage: { type: "sqlite" },
  dashboard: true,
  dashboardSecret: "",
  notifications: {},
  bots: { allowlist: [], blocklist: [] },
  cache: { ttl: 3600, maxMemoryEntries: 500 }
};
function resolveConfig(partial = {}) {
  return {
    ...defaultConfig,
    ...partial,
    bots: { ...defaultConfig.bots, ...partial.bots },
    cache: { ...defaultConfig.cache, ...partial.cache },
    notifications: { ...defaultConfig.notifications, ...partial.notifications }
  };
}

// src/core/with-third-audience.ts
function withThirdAudience(options = {}, nextConfig = {}) {
  const config = resolveConfig(options);
  return {
    ...nextConfig,
    async headers() {
      const existing = await nextConfig.headers?.() ?? [];
      return [
        ...existing,
        {
          source: "/:path*.md",
          headers: [{ key: "Content-Type", value: "text/markdown; charset=utf-8" }]
        },
        {
          source: "/llms.txt",
          headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }]
        },
        {
          source: "/okf/:path*",
          headers: [{ key: "Content-Type", value: "text/markdown; charset=utf-8" }]
        }
      ];
    },
    env: {
      ...nextConfig.env,
      TA_CONTENT_DIR: config.contentDir,
      TA_DATA_DIR: config.dataDir,
      TA_DASHBOARD_ENABLED: String(config.dashboard),
      TA_STRIP_SEGMENTS: config.stripSegments.join(","),
      TA_STORAGE_TYPE: config.storage.type,
      ..."url" in config.storage ? { TA_STORAGE_URL: config.storage.url } : {}
    }
  };
}

// src/core/middleware.ts
import { NextResponse } from "next/server";
var COOKIE_NAME = "ta_session";
var RESET_COOKIE = "ta_session_reset";
var BOT_UA_PATTERNS = [
  "claudebot",
  "gptbot",
  "chatgpt-user",
  "perplexitybot",
  "google-extended",
  "applebot",
  "ccbot",
  "coherecrawler",
  "ai2bot",
  "bytespider",
  "diffbot",
  "youbot",
  "facebookbot",
  "bingbot",
  "googlebot",
  "slurp",
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "sogou",
  "exabot",
  "ia_archiver",
  "scrapy",
  "curl/",
  "python-requests",
  "go-http-client",
  "okhttp",
  "axios/",
  "got/",
  "node-fetch",
  "undici",
  "wget/",
  "libwww",
  "lwp-",
  "java/",
  "ruby",
  "headlesschrome",
  "phantomjs",
  "selenium",
  "playwright",
  "puppeteer"
];
function isBotUserAgent(ua) {
  const lower = ua.toLowerCase();
  return BOT_UA_PATTERNS.some((p) => lower.includes(p));
}
function thirdAudienceMiddleware(req) {
  const { pathname } = req.nextUrl;
  const accept = req.headers.get("accept") ?? "";
  if (pathname.startsWith("/third-audience") && !pathname.startsWith("/third-audience/login")) {
    const session = req.cookies.get(COOKIE_NAME)?.value;
    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/third-audience/login";
      return NextResponse.redirect(loginUrl);
    }
  }
  if (pathname === "/third-audience/login" && req.nextUrl.searchParams.get("reset") === "1") {
    const resetCookie = req.cookies.get(RESET_COOKIE)?.value;
    const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!resetCookie && !sessionCookie) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/third-audience/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }
  if (pathname === "/third-audience/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/api/third-audience/login";
    return NextResponse.rewrite(url);
  }
  if (pathname.endsWith(".md")) {
    const slug = pathname.slice(0, -3);
    const url = req.nextUrl.clone();
    url.pathname = `/api/third-audience/markdown${slug}`;
    return NextResponse.rewrite(url);
  }
  if (accept.includes("text/markdown")) {
    const url = req.nextUrl.clone();
    url.pathname = `/api/third-audience/markdown${pathname}`;
    return NextResponse.rewrite(url);
  }
  if (pathname.startsWith("/okf")) {
    const url = req.nextUrl.clone();
    const rest = pathname.slice(4);
    url.pathname = `/api/third-audience/okf${rest || "/index"}`;
    return NextResponse.rewrite(url);
  }
  if (pathname === "/llms.txt") {
    const url = req.nextUrl.clone();
    url.pathname = "/api/third-audience/llms-txt";
    return NextResponse.rewrite(url);
  }
  if (pathname === "/sitemap-ai.xml") {
    const url = req.nextUrl.clone();
    url.pathname = "/api/third-audience/sitemap-ai";
    return NextResponse.rewrite(url);
  }
  const ua = req.headers.get("user-agent") ?? "";
  const isApi = pathname.startsWith("/api/");
  const isDashboard = pathname.startsWith("/third-audience");
  const isAsset = pathname.startsWith("/_next") || pathname.includes(".");
  if (isBotUserAgent(ua) && !isApi && !isDashboard && !isAsset) {
    const trackUrl = req.nextUrl.clone();
    trackUrl.pathname = "/api/third-audience/track";
    trackUrl.searchParams.set("_url", pathname);
    fetch(trackUrl.toString(), {
      method: "GET",
      headers: {
        "user-agent": ua,
        "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
        "x-real-ip": req.headers.get("x-real-ip") ?? "",
        "referer": req.headers.get("referer") ?? "",
        "x-ta-original-url": pathname
      }
    }).catch(() => {
    });
  }
  return null;
}

// src/detection/known-patterns.ts
var KNOWN_BOTS = [
  // AI Crawlers
  { name: "ClaudeBot", category: "ai_crawler", patterns: [/claudebot/i, /claude-web/i] },
  { name: "GPTBot", category: "ai_crawler", patterns: [/gptbot/i] },
  { name: "ChatGPT-User", category: "ai_crawler", patterns: [/chatgpt-user/i] },
  { name: "PerplexityBot", category: "ai_crawler", patterns: [/perplexitybot/i] },
  { name: "Googlebot-AI", category: "ai_crawler", patterns: [/google-extended/i, /googleother/i] },
  { name: "FacebookBot", category: "ai_crawler", patterns: [/facebookbot/i] },
  { name: "Applebot-Extended", category: "ai_crawler", patterns: [/applebot-extended/i] },
  { name: "YouBot", category: "ai_crawler", patterns: [/youbot/i] },
  { name: "CCBot", category: "ai_crawler", patterns: [/ccbot/i] },
  { name: "CohereCrawler", category: "ai_crawler", patterns: [/cohere-ai/i] },
  { name: "AI2Bot", category: "ai_crawler", patterns: [/ai2bot/i] },
  { name: "Bytespider", category: "ai_crawler", patterns: [/bytespider/i] },
  { name: "Diffbot", category: "ai_crawler", patterns: [/diffbot/i] },
  // Search Engines
  { name: "Googlebot", category: "search_engine", patterns: [/googlebot/i] },
  { name: "Bingbot", category: "search_engine", patterns: [/bingbot/i, /msnbot/i] },
  { name: "DuckDuckBot", category: "search_engine", patterns: [/duckduckbot/i] },
  { name: "Baiduspider", category: "search_engine", patterns: [/baiduspider/i] },
  { name: "YandexBot", category: "search_engine", patterns: [/yandexbot/i] },
  { name: "Sogou", category: "search_engine", patterns: [/sogou/i] },
  { name: "Exabot", category: "search_engine", patterns: [/exabot/i] },
  { name: "ia_archiver", category: "search_engine", patterns: [/ia_archiver/i] }
];

// src/detection/bot-detection-pipeline.ts
function detectBot(input) {
  const ua = input.userAgent ?? "";
  for (const bot of KNOWN_BOTS) {
    for (const pattern of bot.patterns) {
      if (pattern.test(ua)) {
        return {
          isBot: true,
          botName: bot.name,
          confidence: "high",
          detectionMethod: "known_pattern",
          category: bot.category,
          rawUserAgent: ua
        };
      }
    }
  }
  const heuristicResult = checkHeuristics(ua, input.headers ?? {});
  if (heuristicResult) return { ...heuristicResult, rawUserAgent: ua };
  if (looksLikeBotUa(ua)) {
    return {
      isBot: true,
      botName: null,
      confidence: "low",
      detectionMethod: "auto_learned",
      category: "unknown_bot",
      rawUserAgent: ua
    };
  }
  return {
    isBot: false,
    botName: null,
    confidence: "high",
    detectionMethod: "none",
    category: "human",
    rawUserAgent: ua
  };
}
function checkHeuristics(ua, headers) {
  if (/headlesschrome/i.test(ua)) {
    return { isBot: true, botName: "HeadlessChrome", confidence: "medium", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  if (/phantomjs/i.test(ua)) {
    return { isBot: true, botName: "PhantomJS", confidence: "high", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  if (/selenium/i.test(ua)) {
    return { isBot: true, botName: "Selenium", confidence: "high", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  if (ua.trim().length < 10) {
    return { isBot: true, botName: null, confidence: "low", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  const hasAcceptLang = !!headers["accept-language"];
  const hasAcceptEncoding = !!headers["accept-encoding"];
  const claimsBrowser = /chrome|firefox|safari|edge|opera|gecko|applewebkit/i.test(ua);
  if (!hasAcceptLang && !hasAcceptEncoding && !claimsBrowser) {
    return { isBot: true, botName: null, confidence: "low", detectionMethod: "heuristic", category: "unknown_bot" };
  }
  return null;
}
function looksLikeBotUa(ua) {
  return /bot|crawler|spider|scraper|fetch|http|python|curl|java|ruby|go-http|node/i.test(ua) && !/chrome|firefox|safari|edge|opera/i.test(ua);
}
export {
  detectBot,
  thirdAudienceMiddleware,
  withThirdAudience
};
//# sourceMappingURL=index.mjs.map