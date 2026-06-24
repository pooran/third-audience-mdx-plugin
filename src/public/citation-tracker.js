/**
 * Third Audience — Client-side AI Citation Tracker
 *
 * Detects citation clicks from AI platforms via UTM parameters, referrers,
 * and Google AI Overview heuristics (srsltid / udm=14 landing params).
 * Framework-agnostic — include as a <script> tag or import in your layout.
 */
(function () {
  'use strict';

  var REFERRER_PLATFORMS = [
    { pattern: /chat\.openai\.com|chatgpt\.com/i,          name: 'ChatGPT' },
    { pattern: /perplexity\.ai/i,                          name: 'Perplexity' },
    { pattern: /claude\.ai|anthropic\.com/i,               name: 'Claude' },
    { pattern: /gemini\.google\.com|bard\.google\.com/i,   name: 'Gemini' },
    { pattern: /copilot\.microsoft\.com|bing\.com\/chat/i, name: 'Copilot' },
    { pattern: /you\.com/i,                                name: 'You.com' },
    { pattern: /phind\.com/i,                              name: 'Phind' },
    { pattern: /kagi\.com/i,                               name: 'Kagi' },
    { pattern: /search\.openai\.com/i,                     name: 'SearchGPT' },
    { pattern: /grok\.x\.ai|x\.ai\/grok/i,                name: 'Grok' },
    { pattern: /poe\.com/i,                                name: 'Poe' },
    { pattern: /character\.ai/i,                           name: 'Character.AI' },
    { pattern: /mistral\.ai|chat\.mistral\.ai/i,           name: 'Mistral' },
    { pattern: /meta\.ai|ai\.meta\.com/i,                  name: 'Meta AI' },
    { pattern: /huggingface\.co\/chat/i,                   name: 'HuggingChat' },
    { pattern: /search\.brave\.com/i,                      name: 'Brave Leo' },
    { pattern: /liner\.app/i,                              name: 'Liner' },
    { pattern: /andisearch\.com/i,                         name: 'Andi' },
  ];

  var UTM_PLATFORMS = [
    { sources: ['chatgpt', 'openai'],      name: 'ChatGPT' },
    { sources: ['perplexity'],             name: 'Perplexity' },
    { sources: ['claude', 'anthropic'],    name: 'Claude' },
    { sources: ['gemini', 'bard'],         name: 'Gemini' },
    { sources: ['copilot', 'bing-chat'],   name: 'Copilot' },
    { sources: ['searchgpt'],              name: 'SearchGPT' },
    { sources: ['grok'],                   name: 'Grok' },
    { sources: ['metaai', 'meta-ai'],      name: 'Meta AI' },
  ];

  function detectPlatform() {
    var params = new URLSearchParams(window.location.search);
    var ref = document.referrer || '';
    var utmSource = (params.get('utm_source') || '').toLowerCase();

    // 1. Google AI Overview — srsltid param or udm=14, referrer is google or absent
    var fromGoogle = /google\./i.test(ref) || ref === '';
    if (fromGoogle && (params.has('srsltid') || params.get('udm') === '14')) {
      return { platform: 'Google AI Overview', query: params.get('q') };
    }

    // 2. UTM source (ChatGPT, Claude strip referrers; use utm_source instead)
    if (utmSource) {
      for (var i = 0; i < UTM_PLATFORMS.length; i++) {
        var up = UTM_PLATFORMS[i];
        for (var j = 0; j < up.sources.length; j++) {
          if (utmSource.indexOf(up.sources[j]) !== -1) {
            return { platform: up.name, query: params.get('q') || null };
          }
        }
      }
    }

    // 3. Referrer matching
    for (var k = 0; k < REFERRER_PLATFORMS.length; k++) {
      var rp = REFERRER_PLATFORMS[k];
      if (rp.pattern.test(ref)) {
        // Special case: DuckDuckGo only counts if AI chat path
        if (rp.name === 'DuckDuckGo AI' && !/duckai|ai_/i.test(ref)) continue;
        // Bing: /search path = organic, skip
        if (/bing\.com/i.test(ref) && /\/search/i.test(ref) && !/\/chat/i.test(ref)) continue;
        try {
          var refUrl = new URL(ref);
          var query = refUrl.searchParams.get('q') || refUrl.searchParams.get('query') || null;
          return { platform: rp.name, query: query };
        } catch (_) {
          return { platform: rp.name, query: null };
        }
      }
    }

    return null;
  }

  function send(data) {
    var endpoint = '/api/third-audience/citation';
    var body = JSON.stringify(data);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
      }).catch(function () {});
    }
  }

  function run() {
    // Skip if already fired this page view (SPA navigation guard)
    if (window.__taFired) return;
    window.__taFired = true;

    var detection = detectPlatform();
    if (!detection) return;

    send({
      platform: detection.platform,
      query: detection.query,
      url: window.location.pathname + window.location.search,
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
