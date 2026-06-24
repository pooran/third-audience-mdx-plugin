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

// src/dashboard/ui/pages/CacheBrowserPage.tsx
var CacheBrowserPage_exports = {};
__export(CacheBrowserPage_exports, {
  CacheBrowserPage: () => CacheBrowserPage
});
module.exports = __toCommonJS(CacheBrowserPage_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var PAGE_SIZE = 50;
function CacheBrowserPage() {
  const [entries, setEntries] = (0, import_react.useState)([]);
  const [total, setTotal] = (0, import_react.useState)(0);
  const [offset, setOffset] = (0, import_react.useState)(0);
  const [search, setSearch] = (0, import_react.useState)("");
  const [searchInput, setSearchInput] = (0, import_react.useState)("");
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  const [actionMsg, setActionMsg] = (0, import_react.useState)(null);
  const load = (0, import_react.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/third-audience/cache-browser?${params}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [offset, search]);
  (0, import_react.useEffect)(() => {
    load();
  }, [load]);
  async function doAction(action, extra = {}) {
    setActionMsg(null);
    const res = await fetch("/api/third-audience/cache-browser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra })
    });
    const data = await res.json();
    if (data.ok) {
      if (action === "clear_expired") setActionMsg(`Cleared ${data.deleted ?? 0} expired entries`);
      else if (action === "clear_all") setActionMsg("All cache entries cleared");
      else if (action === "delete_key") setActionMsg("Entry deleted");
      load();
    }
  }
  function fmt(ms) {
    return new Date(ms).toLocaleString();
  }
  function fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const expiredCount = entries.filter((e) => e.expired).length;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-page", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-page-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "ta-page-title", children: "Cache Browser" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 14, color: "var(--ta-secondary)" }, children: [
        total,
        " cached entries"
      ] }),
      expiredCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 13, color: "#d97706", background: "#fef3c7", padding: "3px 10px", borderRadius: 9999 }, children: [
        expiredCount,
        " expired on this page"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginLeft: "auto", display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ta-btn ta-btn-secondary", onClick: () => doAction("clear_expired"), style: { fontSize: 13 }, children: "Clear expired" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ta-btn ta-btn-danger", onClick: () => {
          if (confirm("Clear ALL cached content? Pages will be re-fetched on next request.")) doAction("clear_all");
        }, style: { fontSize: 13 }, children: "Clear all" })
      ] })
    ] }),
    actionMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: "#dcfce7", color: "#16a34a", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }, children: actionMsg }),
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }, children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          value: searchInput,
          onChange: (e) => setSearchInput(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              setSearch(searchInput);
              setOffset(0);
            }
          },
          placeholder: "Search by URL key\u2026",
          style: { flex: 1, padding: "9px 12px", border: "1.5px solid var(--ta-border)", borderRadius: 8, fontSize: 14, background: "var(--ta-bg)" }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ta-btn ta-btn-secondary", onClick: () => {
        setSearch(searchInput);
        setOffset(0);
      }, children: "Search" }),
      search && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ta-btn ta-btn-secondary", onClick: () => {
        setSearch("");
        setSearchInput("");
        setOffset(0);
      }, children: "Clear" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-body", style: { padding: 0 }, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 40, textAlign: "center", color: "var(--ta-secondary)", fontSize: 14 }, children: "Loading\u2026" }) : entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 40, textAlign: "center", color: "var(--ta-secondary)", fontSize: 14 }, children: search ? "No entries match your search." : "Cache is empty." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { background: "var(--ta-surface)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "URL / Key" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "right", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Size" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Cached" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "left", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Expires" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px", textAlign: "center", color: "var(--ta-secondary)", fontWeight: 600 }, children: "Status" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { padding: "10px 16px" } })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: entries.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { borderTop: "1px solid var(--ta-border)", background: e.expired ? "#fffbeb" : void 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { style: { padding: "10px 16px", maxWidth: 320 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: 12, wordBreak: "break-all" }, children: e.key }),
          e.etag && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: 11, color: "var(--ta-secondary)", marginTop: 2 }, children: [
            "ETag: ",
            e.etag
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap", color: "var(--ta-secondary)" }, children: fmtSize(e.size) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", whiteSpace: "nowrap", color: "var(--ta-secondary)", fontSize: 12 }, children: fmt(e.cachedAt) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", whiteSpace: "nowrap", color: "var(--ta-secondary)", fontSize: 12 }, children: fmt(e.expiresAt) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px", textAlign: "center" }, children: e.expired ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600 }, children: "Expired" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600 }, children: "Fresh" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { padding: "10px 16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            onClick: () => doAction("delete_key", { key: e.key }),
            className: "ta-btn ta-btn-danger",
            style: { fontSize: 12, padding: "4px 10px" },
            children: "Delete"
          }
        ) })
      ] }, e.key)) })
    ] }) }) }),
    totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, marginTop: 16, alignItems: "center", justifyContent: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ta-btn ta-btn-secondary", onClick: () => setOffset((o) => Math.max(0, o - PAGE_SIZE)), disabled: offset === 0, style: { fontSize: 13 }, children: "\u2190 Prev" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 13, color: "var(--ta-secondary)" }, children: [
        "Page ",
        currentPage,
        " of ",
        totalPages
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "ta-btn ta-btn-secondary", onClick: () => setOffset((o) => o + PAGE_SIZE), disabled: offset + PAGE_SIZE >= total, style: { fontSize: 13 }, children: "Next \u2192" })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CacheBrowserPage
});
//# sourceMappingURL=CacheBrowserPage.js.map