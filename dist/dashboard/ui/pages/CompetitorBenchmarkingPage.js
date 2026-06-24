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

// src/dashboard/ui/pages/CompetitorBenchmarkingPage.tsx
var CompetitorBenchmarkingPage_exports = {};
__export(CompetitorBenchmarkingPage_exports, {
  CompetitorBenchmarkingPage: () => CompetitorBenchmarkingPage
});
module.exports = __toCommonJS(CompetitorBenchmarkingPage_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var ALL_PLATFORMS = [
  "ChatGPT",
  "Perplexity",
  "Claude",
  "Gemini",
  "Copilot",
  "You.com",
  "Phind",
  "Kagi",
  "SearchGPT",
  "Grok",
  "Bing AI",
  "Poe",
  "Character.AI",
  "Mistral",
  "Meta AI",
  "HuggingChat",
  "Brave Leo",
  "DuckDuckGo AI",
  "Liner",
  "Andi",
  "Google AI Overview"
];
function CompetitorBenchmarkingPage() {
  const [tab, setTab] = (0, import_react.useState)("analytics");
  const [competitors, setCompetitors] = (0, import_react.useState)([]);
  const [rows, setRows] = (0, import_react.useState)([]);
  const [analytics, setAnalytics] = (0, import_react.useState)(null);
  const [total, setTotal] = (0, import_react.useState)(0);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  const [filterPlatform, setFilterPlatform] = (0, import_react.useState)("");
  const [filterCompetitor, setFilterCompetitor] = (0, import_react.useState)("");
  const [newUrl, setNewUrl] = (0, import_react.useState)("");
  const [newName, setNewName] = (0, import_react.useState)("");
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [form, setForm] = (0, import_react.useState)({
    competitor_url: "",
    test_prompt: "",
    ai_platform: "ChatGPT",
    cited_rank: "",
    test_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    test_notes: ""
  });
  const [submitting, setSubmitting] = (0, import_react.useState)(false);
  const [submitOk, setSubmitOk] = (0, import_react.useState)(false);
  const load = (0, import_react.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterPlatform) params.set("ai_platform", filterPlatform);
      if (filterCompetitor) params.set("competitor_url", filterCompetitor);
      const res = await fetch(`/api/third-audience/benchmark?${params}`);
      const data = await res.json();
      setCompetitors(data.competitors ?? []);
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
      setAnalytics(data.analytics ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filterPlatform, filterCompetitor]);
  (0, import_react.useEffect)(() => {
    load();
  }, [load]);
  async function addCompetitor() {
    if (!newUrl.trim() || !newName.trim()) return;
    setSaving(true);
    const updated = [...competitors, { url: newUrl.trim(), name: newName.trim() }];
    await fetch("/api/third-audience/benchmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_competitors", competitors: updated })
    });
    setNewUrl("");
    setNewName("");
    setSaving(false);
    load();
  }
  async function removeCompetitor(url) {
    const updated = competitors.filter((c) => c.url !== url);
    await fetch("/api/third-audience/benchmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_competitors", competitors: updated })
    });
    load();
  }
  async function submitTest() {
    if (!form.competitor_url || !form.test_prompt || !form.ai_platform) return;
    setSubmitting(true);
    const comp = competitors.find((c) => c.url === form.competitor_url);
    await fetch("/api/third-audience/benchmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record",
        record: {
          ...form,
          competitor_name: comp?.name ?? "",
          cited_rank: form.cited_rank ? Number(form.cited_rank) : null
        }
      })
    });
    setSubmitting(false);
    setSubmitOk(true);
    setForm((f) => ({ ...f, test_prompt: "", cited_rank: "", test_notes: "" }));
    setTimeout(() => setSubmitOk(false), 3e3);
    load();
  }
  async function deleteRow(id) {
    await fetch("/api/third-audience/benchmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id })
    });
    load();
  }
  const citationBadge = (rate) => {
    const color = rate >= 60 ? "#16a34a" : rate >= 30 ? "#d97706" : "#dc2626";
    const bg = rate >= 60 ? "#dcfce7" : rate >= 30 ? "#fef3c7" : "#fee2e2";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { background: bg, color, padding: "2px 8px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }, children: [
      rate,
      "%"
    ] });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-page", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-page-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "ta-page-title", children: "Competitor Benchmarking" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { color: "var(--ta-secondary)", fontSize: 14, margin: 0 }, children: "Track how often competitors are cited by AI platforms compared to your site" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--ta-border)", paddingBottom: 0 }, children: ["analytics", "tests", "add_test", "manage"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setTab(t), style: {
      padding: "8px 16px",
      border: "none",
      background: "none",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: tab === t ? 600 : 400,
      color: tab === t ? "var(--ta-accent)" : "var(--ta-secondary)",
      borderBottom: tab === t ? "2px solid var(--ta-accent)" : "2px solid transparent",
      marginBottom: -1
    }, children: t === "analytics" ? "Analytics" : t === "tests" ? "Test Results" : t === "add_test" ? "Add Test" : "Manage Competitors" }, t)) }),
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }, children: error }),
    loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "var(--ta-secondary)", fontSize: 14 }, children: "Loading\u2026" }),
    !loading && tab === "analytics" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: competitors.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card-body", style: { textAlign: "center", padding: 48 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { color: "var(--ta-secondary)", marginBottom: 16 }, children: "No competitors added yet." }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ta-btn ta-btn-primary", onClick: () => setTab("manage"), children: "Add competitors" })
    ] }) }) : analytics && analytics.competitors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card", style: { marginBottom: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "ta-card-title", children: "Citation Rate by Competitor" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-body", style: { padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { background: "var(--ta-surface)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Competitor" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Tests" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Cited" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Rate" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Avg Rank" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: analytics.competitors.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { borderTop: "1px solid var(--ta-border)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { style: { padding: "10px 16px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 500 }, children: c.name }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12, color: "var(--ta-secondary)" }, children: c.url })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "right" }, children: c.total }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "right" }, children: c.cited }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "right" }, children: citationBadge(c.citationRate) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "right", color: "var(--ta-secondary)" }, children: c.avgRank !== null ? `#${c.avgRank}` : "\u2014" })
          ] }, c.url)) })
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "ta-card-title", children: "Citation Rate by Platform" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-body", style: { padding: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { background: "var(--ta-surface)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Platform" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Tests" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Cited" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Rate" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: analytics.platforms.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { borderTop: "1px solid var(--ta-border)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", fontWeight: 500 }, children: p.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "right" }, children: p.total }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "right" }, children: p.cited }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "right" }, children: citationBadge(p.citationRate) })
          ] }, p.name)) })
        ] }) })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card-body", style: { textAlign: "center", padding: 48 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { color: "var(--ta-secondary)", marginBottom: 16 }, children: "No test results yet. Add your first test result to see analytics." }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ta-btn ta-btn-primary", onClick: () => setTab("add_test"), children: "Add test result" })
    ] }) }) }),
    !loading && tab === "tests" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            value: filterCompetitor,
            onChange: (e) => setFilterCompetitor(e.target.value),
            style: { padding: "8px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "All competitors" }),
              competitors.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: c.url, children: c.name }, c.url))
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            value: filterPlatform,
            onChange: (e) => setFilterPlatform(e.target.value),
            style: { padding: "8px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "All platforms" }),
              ALL_PLATFORMS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: p, children: p }, p))
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 13, color: "var(--ta-secondary)", alignSelf: "center" }, children: [
          total,
          " results"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-body", style: { padding: 0 }, children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 40, textAlign: "center", color: "var(--ta-secondary)", fontSize: 14 }, children: "No test results found." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { background: "var(--ta-surface)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Date" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Competitor" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Platform" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Prompt" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "center", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Cited" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "center", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Rank" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px" } })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { borderTop: "1px solid var(--ta-border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", whiteSpace: "nowrap", color: "var(--ta-secondary)" }, children: r.test_date }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { style: { padding: "10px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 500 }, children: r.competitor_name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 11, color: "var(--ta-secondary)" }, children: r.competitor_url })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", whiteSpace: "nowrap" }, children: r.ai_platform }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { style: { padding: "10px 16px", maxWidth: 260 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: r.test_prompt, children: r.test_prompt }),
            r.test_notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 11, color: "var(--ta-secondary)", marginTop: 2 }, children: r.test_notes })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "center" }, children: r.cited_rank !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }, children: "Yes" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }, children: "No" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "center", color: "var(--ta-secondary)" }, children: r.cited_rank !== null ? `#${r.cited_rank}` : "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => deleteRow(r.id), className: "ta-btn ta-btn-danger", style: { fontSize: 12, padding: "4px 10px" }, children: "Delete" }) })
        ] }, r.id)) })
      ] }) }) })
    ] }),
    !loading && tab === "add_test" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card", style: { maxWidth: 640 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "ta-card-title", children: "Record Test Result" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: 14, color: "var(--ta-secondary)", marginBottom: 20 }, children: "Run the prompt manually in the AI platform, then record the result here." }),
        submitOk && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: "#dcfce7", color: "#16a34a", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }, children: "Result recorded successfully." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Competitor *" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            value: form.competitor_url,
            onChange: (e) => setForm((f) => ({ ...f, competitor_url: e.target.value })),
            style: { width: "100%", padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)", marginBottom: 16 },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "Select competitor\u2026" }),
              competitors.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: c.url, children: [
                c.name,
                " (",
                c.url,
                ")"
              ] }, c.url))
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "AI Platform *" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "select",
          {
            value: form.ai_platform,
            onChange: (e) => setForm((f) => ({ ...f, ai_platform: e.target.value })),
            style: { width: "100%", padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)", marginBottom: 16 },
            children: ALL_PLATFORMS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: p, children: p }, p))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Test Prompt *" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "textarea",
          {
            value: form.test_prompt,
            onChange: (e) => setForm((f) => ({ ...f, test_prompt: e.target.value })),
            placeholder: "e.g. What is the best tool for tracking AI citations?",
            rows: 3,
            style: { width: "100%", padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Was competitor cited?" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "select",
              {
                value: form.cited_rank,
                onChange: (e) => setForm((f) => ({ ...f, cited_rank: e.target.value })),
                style: { width: "100%", padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)" },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: "Not cited" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "1", children: "Cited \u2014 rank #1" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "2", children: "Cited \u2014 rank #2" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "3", children: "Cited \u2014 rank #3" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "4", children: "Cited \u2014 rank #4" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "5", children: "Cited \u2014 rank #5" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Test Date *" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "date",
                value: form.test_date,
                onChange: (e) => setForm((f) => ({ ...f, test_date: e.target.value })),
                style: { width: "100%", padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)", boxSizing: "border-box" }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Notes" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            value: form.test_notes,
            onChange: (e) => setForm((f) => ({ ...f, test_notes: e.target.value })),
            placeholder: "Optional notes about this test",
            style: { width: "100%", padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)", boxSizing: "border-box", marginBottom: 20 }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "ta-btn ta-btn-primary",
            onClick: submitTest,
            disabled: submitting || !form.competitor_url || !form.test_prompt,
            children: submitting ? "Saving\u2026" : "Save result"
          }
        )
      ] })
    ] }),
    !loading && tab === "manage" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { maxWidth: 640 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card", style: { marginBottom: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "ta-card-title", children: "Add Competitor" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card-body", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "URL *" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  value: newUrl,
                  onChange: (e) => setNewUrl(e.target.value),
                  placeholder: "https://competitor.com",
                  style: { width: "100%", padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)", boxSizing: "border-box" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }, children: "Name *" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  value: newName,
                  onChange: (e) => setNewName(e.target.value),
                  placeholder: "Competitor Name",
                  style: { width: "100%", padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)", boxSizing: "border-box" }
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ta-btn ta-btn-primary", onClick: addCompetitor, disabled: saving || !newUrl.trim() || !newName.trim(), children: saving ? "Saving\u2026" : "Add competitor" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { className: "ta-card-title", children: [
          "Competitors (",
          competitors.length,
          ")"
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-body", style: { padding: 0 }, children: competitors.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 32, textAlign: "center", color: "var(--ta-secondary)", fontSize: 14 }, children: "No competitors added yet." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: competitors.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { borderTop: "1px solid var(--ta-border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { style: { padding: "12px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 500 }, children: c.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12, color: "var(--ta-secondary)" }, children: c.url })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "12px 16px", textAlign: "right" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => removeCompetitor(c.url), className: "ta-btn ta-btn-danger", style: { fontSize: 12, padding: "4px 10px" }, children: "Remove" }) })
        ] }, c.url)) }) }) })
      ] })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CompetitorBenchmarkingPage
});
//# sourceMappingURL=CompetitorBenchmarkingPage.js.map