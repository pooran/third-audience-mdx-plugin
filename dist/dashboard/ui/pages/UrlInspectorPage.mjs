"use client";

// src/dashboard/ui/pages/UrlInspectorPage.tsx
import { useState, useCallback } from "react";

// src/dashboard/ui/components/HeroCard.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function HeroCard({ label, value, meta, color = "blue", icon }) {
  return /* @__PURE__ */ jsxs("div", { className: `ta-hero-card ta-hero-card--${color}`, children: [
    /* @__PURE__ */ jsx("div", { className: "ta-hero-icon", children: icon }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "ta-hero-label", children: label }),
      /* @__PURE__ */ jsx("div", { className: "ta-hero-value", children: value }),
      meta && /* @__PURE__ */ jsx("div", { className: "ta-hero-meta", children: meta })
    ] })
  ] });
}

// src/dashboard/ui/components/Card.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Card({ title, action, children }) {
  return /* @__PURE__ */ jsxs2("div", { className: "ta-card ta-section", children: [
    /* @__PURE__ */ jsxs2("div", { className: "ta-card-header", children: [
      /* @__PURE__ */ jsx2("h2", { children: title }),
      action
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "ta-card-body", children })
  ] });
}

// src/dashboard/ui/components/VisitsChart.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function VisitsChart({ data, height = 160 }) {
  if (!data.length) {
    return /* @__PURE__ */ jsx3("div", { className: "ta-empty", children: /* @__PURE__ */ jsx3("p", { children: "No visit data yet." }) });
  }
  const max = Math.max(...data.map((d) => d.visits), 1);
  const barWidth = Math.max(4, Math.floor(560 / data.length) - 2);
  const showLabel = data.length <= 14;
  return /* @__PURE__ */ jsx3("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsx3(
    "svg",
    {
      width: "100%",
      viewBox: `0 0 ${Math.max(data.length * (barWidth + 2), 560)} ${height + 40}`,
      style: { display: "block", minWidth: 320 },
      children: data.map((d, i) => {
        const barH = Math.max(2, Math.round(d.visits / max * height));
        const x = i * (barWidth + 2);
        const y = height - barH;
        return /* @__PURE__ */ jsxs3("g", { children: [
          /* @__PURE__ */ jsx3(
            "rect",
            {
              x,
              y,
              width: barWidth,
              height: barH,
              rx: 3,
              fill: "var(--ta-blue)",
              opacity: 0.85,
              children: /* @__PURE__ */ jsx3("title", { children: `${d.date}: ${d.visits} visits` })
            }
          ),
          showLabel && /* @__PURE__ */ jsxs3(
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
import { Fragment, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
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
  const [url, setUrl] = useState("");
  const [preset, setPreset] = useState("30d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const inspect = useCallback(async () => {
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
  return /* @__PURE__ */ jsxs4("div", { className: "ta-page", children: [
    /* @__PURE__ */ jsxs4("div", { className: "ta-page-header", children: [
      /* @__PURE__ */ jsx4("h1", { className: "ta-page-title", children: "URL Inspector" }),
      /* @__PURE__ */ jsx4("p", { style: { color: "var(--ta-secondary)", fontSize: 14, margin: 0 }, children: "See how often a specific page has been cited by AI platforms" })
    ] }),
    /* @__PURE__ */ jsx4("div", { className: "ta-card", style: { marginBottom: 20 }, children: /* @__PURE__ */ jsxs4("div", { className: "ta-card-body", children: [
      /* @__PURE__ */ jsx4("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Page URL or path *" }),
      /* @__PURE__ */ jsxs4("div", { style: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsx4(
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
        /* @__PURE__ */ jsx4("button", { className: "ta-btn ta-btn-primary", onClick: inspect, disabled: loading || !url.trim(), children: loading ? "Inspecting\u2026" : "Inspect" })
      ] }),
      /* @__PURE__ */ jsx4("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Date range" }),
      /* @__PURE__ */ jsxs4("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }, children: [
        ["7d", "30d", "90d", "alltime", "custom"].map((p) => /* @__PURE__ */ jsx4(
          "button",
          {
            onClick: () => setPreset(p),
            className: preset === p ? "ta-btn ta-btn-primary" : "ta-btn ta-btn-secondary",
            style: { fontSize: 13, padding: "6px 12px" },
            children: p === "7d" ? "7 days" : p === "30d" ? "30 days" : p === "90d" ? "90 days" : p === "alltime" ? "All time" : "Custom"
          },
          p
        )),
        preset === "custom" && /* @__PURE__ */ jsxs4(Fragment, { children: [
          /* @__PURE__ */ jsx4(
            "input",
            {
              type: "date",
              value: dateFrom,
              onChange: (e) => setDateFrom(e.target.value),
              style: { padding: "7px 10px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 13, background: "var(--ta-bg)" }
            }
          ),
          /* @__PURE__ */ jsx4("span", { style: { color: "var(--ta-secondary)", fontSize: 13 }, children: "to" }),
          /* @__PURE__ */ jsx4(
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
    error && /* @__PURE__ */ jsx4("div", { style: { background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }, children: error }),
    !searched && !loading && /* @__PURE__ */ jsx4("div", { className: "ta-card", children: /* @__PURE__ */ jsx4("div", { className: "ta-empty", children: /* @__PURE__ */ jsx4("p", { children: "Enter a URL above and click Inspect to see its citation history." }) }) }),
    loading && /* @__PURE__ */ jsx4("div", { className: "ta-card", children: /* @__PURE__ */ jsx4("div", { className: "ta-empty", children: /* @__PURE__ */ jsx4("p", { children: "Loading\u2026" }) }) }),
    !loading && searched && result?.empty && /* @__PURE__ */ jsx4("div", { className: "ta-card", children: /* @__PURE__ */ jsx4("div", { className: "ta-empty", children: /* @__PURE__ */ jsx4("p", { children: "No citations recorded for this URL yet." }) }) }),
    !loading && result && !result.empty && /* @__PURE__ */ jsxs4(Fragment, { children: [
      /* @__PURE__ */ jsxs4("div", { className: "ta-hero-grid", children: [
        /* @__PURE__ */ jsx4(
          HeroCard,
          {
            label: "Total Citations",
            value: result.total.toLocaleString(),
            meta: result.mode ? `mode: ${result.mode}` : void 0,
            color: "blue",
            icon: /* @__PURE__ */ jsx4("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx4("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) })
          }
        ),
        /* @__PURE__ */ jsx4(
          HeroCard,
          {
            label: "Top Platform",
            value: result.topPlatform ?? "\u2014",
            meta: result.topCount !== void 0 ? `${result.topCount} citations (${result.topPct}%)` : void 0,
            color: "green",
            icon: /* @__PURE__ */ jsxs4("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
              /* @__PURE__ */ jsx4("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
              /* @__PURE__ */ jsx4("polyline", { points: "22 4 12 14.01 9 11.01" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx4(
          HeroCard,
          {
            label: "Unique Platforms",
            value: result.llmCount ?? 0,
            meta: "distinct AI platforms",
            color: "teal",
            icon: /* @__PURE__ */ jsxs4("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
              /* @__PURE__ */ jsx4("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
              /* @__PURE__ */ jsx4("polyline", { points: "14 2 14 8 20 8" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx4(
          HeroCard,
          {
            label: result.peakLabel ?? "Peak",
            value: result.peak ?? "\u2014",
            meta: result.peakV !== void 0 ? `${result.peakV} citations` : void 0,
            color: "orange",
            icon: /* @__PURE__ */ jsxs4("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
              /* @__PURE__ */ jsx4("circle", { cx: "12", cy: "12", r: "10" }),
              /* @__PURE__ */ jsx4("polyline", { points: "12 6 12 12 16 14" })
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsx4(Card, { title: "Citation Trend", children: /* @__PURE__ */ jsx4(VisitsChart, { data: chartData }) }),
      /* @__PURE__ */ jsxs4("div", { className: "ta-grid-2", children: [
        /* @__PURE__ */ jsx4(Card, { title: "Platform Breakdown", children: !result.platforms || result.platforms.length === 0 ? /* @__PURE__ */ jsx4("div", { className: "ta-empty", children: /* @__PURE__ */ jsx4("p", { children: "No platform data." }) }) : /* @__PURE__ */ jsx4("div", { children: result.platforms.map((p) => /* @__PURE__ */ jsxs4("div", { style: { marginBottom: 12 }, children: [
          /* @__PURE__ */ jsxs4("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }, children: [
            /* @__PURE__ */ jsx4("span", { style: { fontWeight: 500 }, children: p.platform }),
            /* @__PURE__ */ jsxs4("span", { style: { color: "var(--ta-secondary)" }, children: [
              p.count,
              " (",
              p.pct,
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ jsx4("div", { style: { background: "var(--ta-surface)", borderRadius: 6, height: 8, overflow: "hidden" }, children: /* @__PURE__ */ jsx4("div", { style: { width: `${p.pct}%`, background: "var(--ta-blue)", height: "100%", borderRadius: 6 } }) })
        ] }, p.platform)) }) }),
        /* @__PURE__ */ jsx4(Card, { title: "History", children: !result.hist || result.hist.length === 0 ? /* @__PURE__ */ jsx4("div", { className: "ta-empty", children: /* @__PURE__ */ jsx4("p", { children: "No historical data." }) }) : /* @__PURE__ */ jsx4("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs4("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
          /* @__PURE__ */ jsx4("thead", { children: /* @__PURE__ */ jsxs4("tr", { children: [
            /* @__PURE__ */ jsx4("th", { style: { padding: "8px 10px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Period" }),
            /* @__PURE__ */ jsx4("th", { style: { padding: "8px 10px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Count" }),
            /* @__PURE__ */ jsx4("th", { style: { padding: "8px 10px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "vs Prev" }),
            /* @__PURE__ */ jsx4("th", { style: { padding: "8px 10px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Top Platform" })
          ] }) }),
          /* @__PURE__ */ jsx4("tbody", { children: result.hist.slice().reverse().map((h, i) => /* @__PURE__ */ jsxs4("tr", { style: { borderTop: "1px solid var(--ta-border)" }, children: [
            /* @__PURE__ */ jsx4("td", { style: { padding: "8px 10px" }, children: h.label }),
            /* @__PURE__ */ jsx4("td", { style: { padding: "8px 10px", textAlign: "right" }, children: h.count }),
            /* @__PURE__ */ jsx4("td", { style: { padding: "8px 10px", textAlign: "right", color: h.vsPrev === null ? "var(--ta-secondary)" : h.vsPrev > 0 ? "#16a34a" : h.vsPrev < 0 ? "#dc2626" : "var(--ta-secondary)" }, children: h.vsPrev === null ? "\u2014" : h.vsPrev > 0 ? `+${h.vsPrev}` : h.vsPrev }),
            /* @__PURE__ */ jsx4("td", { style: { padding: "8px 10px" }, children: h.topPlatform })
          ] }, `${h.label}-${i}`)) })
        ] }) }) })
      ] })
    ] })
  ] });
}
export {
  UrlInspectorPage
};
//# sourceMappingURL=UrlInspectorPage.mjs.map