/**
 * Third Audience — Client-side AI Citation Tracker
 *
 * Detects citation clicks from AI platforms via UTM parameters and referrers.
 * Works even when pages are served from cache.
 * Framework-agnostic — include as a <script> tag or import in your layout.
 *
 * Adapted from wordpress-plugin/public/js/citation-tracker.js
 */
(function () {
  'use strict';

  var AI_PLATFORMS = {
    utm: {
      chatgpt:     { name: 'ChatGPT',    sources: ['chatgpt', 'openai'] },
      perplexity:  { name: 'Perplexity', sources: ['perplexity'] },
      claude:      { name: 'Claude',     sources: ['claude', 'anthropic'] },
      gemini:      { name: 'Gemini',     sources: ['gemini', 'bard', 'google-ai'] },
      copilot:     { name: 'Copilot',    sources: ['copilot', 'bing-chat'] },
    },
    referrer: [
      { pattern: /chat\.openai\.com|chatgpt\.com/i,          name: 'ChatGPT' },
      { pattern: /perplexity\.ai/i,                          name: 'Perplexity' },
      { pattern: /claude\.ai/i,                              name: 'Claude' },
      { pattern: /gemini\.google\.com|bard\.google\.com/i,   name: 'Gemini' },
      { pattern: /copilot\.microsoft\.com|bing\.com\/chat/i, name: 'Copilot' },
      { pattern: /you\.com/i,                                name: 'YouChat' },
    ],
  };

  function detectPlatform() {
    // 1. UTM source
    var params = new URLSearchParams(window.location.search);
    var utmSource = (params.get('utm_source') || '').toLowerCase();
    for (var key in AI_PLATFORMS.utm) {
      var p = AI_PLATFORMS.utm[key];
      if (p.sources.some(function (s) { return utmSource.includes(s); })) {
        return { platform: p.name, query: params.get('q') || params.get('query') || null };
      }
    }

    // 2. Referrer
    var ref = document.referrer || '';
    for (var i = 0; i < AI_PLATFORMS.referrer.length; i++) {
      var r = AI_PLATFORMS.referrer[i];
      if (r.pattern.test(ref)) {
        try {
          var refUrl = new URL(ref);
          var query = refUrl.searchParams.get('q') || refUrl.searchParams.get('query') || null;
          return { platform: r.name, query: query };
        } catch (_) {
          return { platform: r.name, query: null };
        }
      }
    }

    return null;
  }

  function send(data) {
    var endpoint = '/api/third-audience/citation';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(data));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(function () {});
    }
  }

  function run() {
    var detection = detectPlatform();
    if (!detection) return;

    send({
      platform: detection.platform,
      query: detection.query,
      url: window.location.pathname,
      referer: document.referrer,
      user_agent: navigator.userAgent,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
