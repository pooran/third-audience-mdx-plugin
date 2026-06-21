"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/dashboard/ui/pages/LlmTrafficPage.tsx
var LlmTrafficPage_exports = {};
__export(LlmTrafficPage_exports, {
  LlmTrafficPage: () => LlmTrafficPage
});
module.exports = __toCommonJS(LlmTrafficPage_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));

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

// src/dashboard/ui/components/HeroCard.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function HeroCard({ label, value, meta, color = "blue", icon }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `ta-hero-card ta-hero-card--${color}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ta-hero-icon", children: icon }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ta-hero-label", children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ta-hero-value", children: value }),
      meta && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ta-hero-meta", children: meta })
    ] })
  ] });
}

// src/dashboard/ui/pages/LlmTrafficPage.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var PLATFORM_COLORS = {
  ChatGPT: "green",
  Perplexity: "blue",
  Claude: "orange",
  Gemini: "teal",
  Copilot: "blue",
  default: "gray"
};
function loadCitations(days = 30) {
  const dataDir = process.env.TA_DATA_DIR ?? "data";
  const filePath = import_path.default.join(process.cwd(), dataDir, "ta-citations.jsonl");
  if (!import_fs.default.existsSync(filePath)) return [];
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();
  return import_fs.default.readFileSync(filePath, "utf-8").split("\n").filter(Boolean).map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  }).filter((r) => r !== null && r.timestamp >= cutoffStr);
}
function groupBy(arr, key) {
  const map = /* @__PURE__ */ new Map();
  for (const item of arr) {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
}
async function LlmTrafficPage() {
  const records = loadCitations(30);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const todayCount = records.filter((r) => r.timestamp.startsWith(today)).length;
  const byPlatform = groupBy(records, (r) => r.platform);
  const byPage = groupBy(records, (r) => r.url);
  const byQuery = groupBy(records.filter((r) => r.query), (r) => r.query).slice(0, 10);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h1", { className: "ta-page-title", children: "LLM Traffic" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "ta-page-subtitle", children: "Citation clicks from AI platforms (last 30 days)" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "ta-hero-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        HeroCard,
        {
          label: "Total Citations",
          value: records.length.toLocaleString(),
          meta: `${todayCount} today`,
          color: "blue",
          icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        HeroCard,
        {
          label: "AI Platforms",
          value: byPlatform.length,
          meta: "distinct sources",
          color: "green",
          icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: "2", y1: "12", x2: "22", y2: "12" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })
          ] })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        HeroCard,
        {
          label: "Pages Cited",
          value: byPage.length,
          meta: "unique URLs cited",
          color: "orange",
          icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polyline", { points: "14 2 14 8 20 8" })
          ] })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        HeroCard,
        {
          label: "Top Platform",
          value: byPlatform[0]?.name ?? "\u2014",
          meta: byPlatform[0] ? `${byPlatform[0].count} citations` : "no data yet",
          color: "teal",
          icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" }) })
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "ta-grid-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Card, { title: "By Platform", children: byPlatform.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "ta-empty", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "No citation data yet. Make sure citation-tracker.js is included in your layout." }) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { className: "ta-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "Platform" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "Citations" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "Share" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { children: byPlatform.map((p) => {
          const pct = records.length > 0 ? (p.count / records.length * 100).toFixed(1) : "0";
          const color = PLATFORM_COLORS[p.name] ?? PLATFORM_COLORS.default;
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `ta-badge ta-badge--${color}`, children: p.name }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: p.count }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { style: { fontSize: 12, color: "var(--ta-gray-600)" }, children: [
              pct,
              "%"
            ] })
          ] }, p.name);
        }) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Card, { title: "Top Queries", children: byQuery.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "ta-empty", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "No query data yet. Queries are captured when AI platforms include a search term in the referrer URL." }) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { className: "ta-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "Query" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "Citations" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { children: byQuery.map((q) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { style: { fontFamily: "var(--ta-font-mono)", fontSize: 12 }, children: q.name }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: q.count }) })
        ] }, q.name)) })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Card, { title: "Top Cited Pages", children: byPage.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "ta-empty", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "No pages cited yet." }) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { className: "ta-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "Page" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "Citations" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { children: byPage.slice(0, 20).map((p) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("a", { href: p.name, target: "_blank", rel: "noreferrer", style: { fontFamily: "var(--ta-font-mono)", fontSize: 12 }, children: p.name }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: p.count }) })
      ] }, p.name)) })
    ] }) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LlmTrafficPage
});
//# sourceMappingURL=LlmTrafficPage.js.map