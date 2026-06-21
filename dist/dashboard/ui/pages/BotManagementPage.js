"use strict";
"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/dashboard/ui/pages/BotManagementPage.tsx
var BotManagementPage_exports = {};
__export(BotManagementPage_exports, {
  BotManagementPage: () => BotManagementPage
});
module.exports = __toCommonJS(BotManagementPage_exports);
var import_react = require("react");

// src/dashboard/ui/components/Card.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function Card({ title, action, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card ta-section", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: title }),
      action
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-body", children })
  ] });
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

// src/dashboard/ui/pages/BotManagementPage.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function BotManagementPage({ config }) {
  const [allowlist, setAllowlist] = (0, import_react.useState)(config.allowlist);
  const [blocklist, setBlocklist] = (0, import_react.useState)(config.blocklist);
  const [trackUnknown, setTrackUnknown] = (0, import_react.useState)(config.track_unknown);
  const [newAllow, setNewAllow] = (0, import_react.useState)("");
  const [newBlock, setNewBlock] = (0, import_react.useState)("");
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [saved, setSaved] = (0, import_react.useState)(false);
  async function save() {
    setSaving(true);
    await fetch("/api/third-audience/bots-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowlist, blocklist, track_unknown: trackUnknown })
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2e3);
  }
  const AI_CRAWLERS = KNOWN_BOTS.filter((b) => b.category === "ai_crawler");
  const SEARCH_ENGINES = KNOWN_BOTS.filter((b) => b.category === "search_engine");
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: "ta-page-title", children: "Bot Management" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ta-page-subtitle", children: "Configure which bots to track or block" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Card, { title: "Known AI Crawlers", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { className: "ta-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "Bot" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "User-Agent Pattern" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "Category" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tbody", { children: [
        AI_CRAWLERS.map((b) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: b.name }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: b.patterns[0].source }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ta-badge ta-badge--blue", children: "AI Crawler" }) })
        ] }, b.name)),
        SEARCH_ENGINES.map((b) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: b.name }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: b.patterns[0].source }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ta-badge ta-badge--gray", children: "Search Engine" }) })
        ] }, b.name))
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Card, { title: "Allowlist", action: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          value: newAllow,
          onChange: (e) => setNewAllow(e.target.value),
          placeholder: "Bot name or UA pattern",
          style: { padding: "6px 10px", borderRadius: 6, border: "1px solid var(--ta-gray-200)", fontSize: 13, width: 200 }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ta-btn ta-btn--primary", onClick: () => {
        if (newAllow) {
          setAllowlist((l) => [...l, newAllow]);
          setNewAllow("");
        }
      }, children: "Add" })
    ] }), children: allowlist.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { color: "var(--ta-gray-500)", fontSize: 13 }, children: "No overrides. All detected bots are tracked." }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { style: { listStyle: "none", display: "flex", flexWrap: "wrap", gap: 8 }, children: allowlist.map((name) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { style: { display: "flex", alignItems: "center", gap: 6, background: "rgba(52,199,89,0.1)", borderRadius: 6, padding: "4px 10px", fontSize: 13 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ta-dot ta-dot--green" }),
      name,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => setAllowlist((l) => l.filter((x) => x !== name)), style: { background: "none", border: "none", cursor: "pointer", color: "var(--ta-gray-500)", marginLeft: 4 }, children: "\xD7" })
    ] }, name)) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Card, { title: "Blocklist", action: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          value: newBlock,
          onChange: (e) => setNewBlock(e.target.value),
          placeholder: "Bot name or UA pattern",
          style: { padding: "6px 10px", borderRadius: 6, border: "1px solid var(--ta-gray-200)", fontSize: 13, width: 200 }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ta-btn ta-btn--danger", onClick: () => {
        if (newBlock) {
          setBlocklist((l) => [...l, newBlock]);
          setNewBlock("");
        }
      }, children: "Block" })
    ] }), children: blocklist.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { color: "var(--ta-gray-500)", fontSize: 13 }, children: "No blocked bots." }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { style: { listStyle: "none", display: "flex", flexWrap: "wrap", gap: 8 }, children: blocklist.map((name) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { style: { display: "flex", alignItems: "center", gap: 6, background: "rgba(255,59,48,0.1)", borderRadius: 6, padding: "4px 10px", fontSize: 13 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ta-dot ta-dot--red" }),
      name,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => setBlocklist((l) => l.filter((x) => x !== name)), style: { background: "none", border: "none", cursor: "pointer", color: "var(--ta-gray-500)", marginLeft: 4 }, children: "\xD7" })
    ] }, name)) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Card, { title: "Unknown Bots", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          type: "checkbox",
          checked: trackUnknown,
          onChange: (e) => setTrackUnknown(e.target.checked),
          style: { width: 16, height: 16 }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "Track unknown bots (bots detected by heuristics, not in the known list)" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "ta-btn ta-btn--primary", onClick: save, disabled: saving, children: saving ? "Saving\u2026" : "Save Configuration" }),
      saved && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--ta-green)", fontSize: 13 }, children: "\u2713 Saved" })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BotManagementPage
});
//# sourceMappingURL=BotManagementPage.js.map