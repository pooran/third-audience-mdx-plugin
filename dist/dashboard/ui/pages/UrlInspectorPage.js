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

// src/dashboard/ui/pages/UrlInspectorPage.tsx
var UrlInspectorPage_exports = {};
__export(UrlInspectorPage_exports, {
  UrlInspectorPage: () => UrlInspectorPage
});
module.exports = __toCommonJS(UrlInspectorPage_exports);
var import_react = require("react");

// src/dashboard/ui/components/HeroCard.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function HeroCard({ label, value, meta, color = "blue", icon }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `ta-hero-card ta-hero-card--${color}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-hero-icon", children: icon }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-hero-label", children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-hero-value", children: value }),
      meta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-hero-meta", children: meta })
    ] })
  ] });
}

// src/dashboard/ui/components/Card.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function Card({ title, action, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ta-card ta-section", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ta-card-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: title }),
      action
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ta-card-body", children })
  ] });
}

// src/dashboard/ui/components/VisitsChart.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function VisitsChart({ data, height = 160 }) {
  if (!data.length) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "ta-empty", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "No visit data yet." }) });
  }
  const max = Math.max(...data.map((d) => d.visits), 1);
  const barWidth = Math.max(4, Math.floor(560 / data.length) - 2);
  const showLabel = data.length <= 14;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "svg",
    {
      width: "100%",
      viewBox: `0 0 ${Math.max(data.length * (barWidth + 2), 560)} ${height + 40}`,
      style: { display: "block", minWidth: 320 },
      children: data.map((d, i) => {
        const barH = Math.max(2, Math.round(d.visits / max * height));
        const x = i * (barWidth + 2);
        const y = height - barH;
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "rect",
            {
              x,
              y,
              width: barWidth,
              height: barH,
              rx: 3,
              fill: "var(--ta-blue)",
              opacity: 0.85,
              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("title", { children: `${d.date}: ${d.visits} visits` })
            }
          ),
          showLabel && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "text",
            {
              x: x + barWidth / 2,
              y: height + 16,
              textAnchor: "middle",
              fontSize: 9,
              fill: "var(--ta-gray-500)",
              children: [
                d.date.slice(5),
                " "
              ]
            }
          )
        ] }, d.date);
      })
    }
  ) });
}

// src/dashboard/ui/pages/UrlInspectorPage.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function presetRange(preset) {
  if (preset === "alltime" || preset === "custom") return null;
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const to = /* @__PURE__ */ new Date();
  const from = /* @__PURE__ */ new Date();
  from.setDate(from.getDate() - days);
  return { date_from: isoDate(from), date_to: isoDate(to) };
}
function UrlInspectorPage() {
  const [url, setUrl] = (0, import_react.useState)("");
  const [preset, setPreset] = (0, import_react.useState)("30d");
  const [dateFrom, setDateFrom] = (0, import_react.useState)("");
  const [dateTo, setDateTo] = (0, import_react.useState)("");
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [result, setResult] = (0, import_react.useState)(null);
  const [searched, setSearched] = (0, import_react.useState)(false);
  const inspect = (0, import_react.useCallback)(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ url: url.trim() });
      const range = preset === "custom" ? { date_from: dateFrom, date_to: dateTo } : presetRange(preset);
      if (range?.date_from) params.set("date_from", range.date_from);
      if (range?.date_to) params.set("date_to", range.date_to);
      const res = await fetch(`/api/third-audience/url-inspector?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [url, preset, dateFrom, dateTo]);
  const chartData = (result?.trendLabels ?? []).map((label, i) => ({
    date: label,
    visits: result?.trendValues?.[i] ?? 0
  }));
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "ta-page", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "ta-page-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { className: "ta-page-title", children: "URL Inspector" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { color: "var(--ta-secondary)", fontSize: 14, margin: 0 }, children: "See how often a specific page has been cited by AI platforms" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "ta-card", style: { marginBottom: 20 }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "ta-card-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Page URL or path *" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            value: url,
            onChange: (e) => setUrl(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") inspect();
            },
            placeholder: "https://example.com/industries/ or /industries/",
            style: { flex: "1 1 320px", padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)", boxSizing: "border-box" }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "ta-btn ta-btn-primary", onClick: inspect, disabled: loading || !url.trim(), children: loading ? "Inspecting\u2026" : "Inspect" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Date range" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }, children: [
        ["7d", "30d", "90d", "alltime", "custom"].map((p) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            onClick: () => setPreset(p),
            className: preset === p ? "ta-btn ta-btn-primary" : "ta-btn ta-btn-secondary",
            style: { fontSize: 13, padding: "6px 12px" },
            children: p === "7d" ? "7 days" : p === "30d" ? "30 days" : p === "90d" ? "90 days" : p === "alltime" ? "All time" : "Custom"
          },
          p
        )),
        preset === "custom" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "date",
              value: dateFrom,
              onChange: (e) => setDateFrom(e.target.value),
              style: { padding: "7px 10px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 13, background: "var(--ta-bg)" }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { color: "var(--ta-secondary)", fontSize: 13 }, children: "to" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "date",
              value: dateTo,
              onChange: (e) => setDateTo(e.target.value),
              style: { padding: "7px 10px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 13, background: "var(--ta-bg)" }
            }
          )
        ] })
      ] })
    ] }) }),
    error && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }, children: error }),
    !searched && !loading && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "ta-card", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "ta-empty", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: "Enter a URL above and click Inspect to see its citation history." }) }) }),
    loading && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "ta-card", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "ta-empty", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: "Loading\u2026" }) }) }),
    !loading && searched && result?.empty && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "ta-card", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "ta-empty", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: "No citations recorded for this URL yet." }) }) }),
    !loading && result && !result.empty && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "ta-hero-grid", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          HeroCard,
          {
            label: "Total Citations",
            value: result.total.toLocaleString(),
            meta: result.mode ? `mode: ${result.mode}` : void 0,
            color: "blue",
            icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          HeroCard,
          {
            label: "Top Platform",
            value: result.topPlatform ?? "\u2014",
            meta: result.topCount !== void 0 ? `${result.topCount} citations (${result.topPct}%)` : void 0,
            color: "green",
            icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "22 4 12 14.01 9 11.01" })
            ] })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          HeroCard,
          {
            label: "Unique Platforms",
            value: result.llmCount ?? 0,
            meta: "distinct AI platforms",
            color: "teal",
            icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "14 2 14 8 20 8" })
            ] })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          HeroCard,
          {
            label: result.peakLabel ?? "Peak",
            value: result.peak ?? "\u2014",
            meta: result.peakV !== void 0 ? `${result.peakV} citations` : void 0,
            color: "orange",
            icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "12", cy: "12", r: "10" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "12 6 12 12 16 14" })
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Card, { title: "Citation Trend", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(VisitsChart, { data: chartData }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "ta-grid-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Card, { title: "Platform Breakdown", children: !result.platforms || result.platforms.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "ta-empty", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: "No platform data." }) }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { children: result.platforms.map((p) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { marginBottom: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontWeight: 500 }, children: p.platform }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { style: { color: "var(--ta-secondary)" }, children: [
              p.count,
              " (",
              p.pct,
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { background: "var(--ta-surface)", borderRadius: 6, height: 8, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { width: `${p.pct}%`, background: "var(--ta-blue)", height: "100%", borderRadius: 6 } }) })
        ] }, p.platform)) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Card, { title: "History", children: !result.hist || result.hist.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "ta-empty", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: "No historical data." }) }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { style: { padding: "8px 10px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Period" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { style: { padding: "8px 10px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Count" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { style: { padding: "8px 10px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "vs Prev" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { style: { padding: "8px 10px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Top Platform" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("tbody", { children: result.hist.slice().reverse().map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("tr", { style: { borderTop: "1px solid var(--ta-border)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { style: { padding: "8px 10px" }, children: h.label }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { style: { padding: "8px 10px", textAlign: "right" }, children: h.count }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { style: { padding: "8px 10px", textAlign: "right", color: h.vsPrev === null ? "var(--ta-secondary)" : h.vsPrev > 0 ? "#16a34a" : h.vsPrev < 0 ? "#dc2626" : "var(--ta-secondary)" }, children: h.vsPrev === null ? "\u2014" : h.vsPrev > 0 ? `+${h.vsPrev}` : h.vsPrev }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { style: { padding: "8px 10px" }, children: h.topPlatform })
          ] }, `${h.label}-${i}`)) })
        ] }) }) })
      ] })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UrlInspectorPage
});
//# sourceMappingURL=UrlInspectorPage.js.map