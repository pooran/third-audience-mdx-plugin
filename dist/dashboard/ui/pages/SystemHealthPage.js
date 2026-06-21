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

// src/dashboard/ui/pages/SystemHealthPage.tsx
var SystemHealthPage_exports = {};
__export(SystemHealthPage_exports, {
  SystemHealthPage: () => SystemHealthPage
});
module.exports = __toCommonJS(SystemHealthPage_exports);
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

// src/dashboard/ui/pages/SystemHealthPage.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function runHealthChecks() {
  const cwd = process.cwd();
  const checks = [];
  const [major] = process.versions.node.split(".").map(Number);
  checks.push({
    label: `Node.js ${process.versions.node}`,
    status: major >= 18 ? "ok" : "error",
    note: major < 18 ? "Requires Node 18+" : void 0
  });
  const contentDir = process.env.TA_CONTENT_DIR ?? "content";
  const contentPath = import_path.default.join(cwd, contentDir);
  const contentExists = import_fs.default.existsSync(contentPath);
  let mdxCount = 0;
  if (contentExists) {
    let countMdx2 = function(dir) {
      let n = 0;
      for (const e of import_fs.default.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) n += countMdx2(import_path.default.join(dir, e.name));
        else if (e.name.endsWith(".mdx") || e.name.endsWith(".md")) n++;
      }
      return n;
    };
    var countMdx = countMdx2;
    mdxCount = countMdx2(contentPath);
  }
  checks.push({
    label: `Content directory (${contentDir})`,
    status: contentExists ? "ok" : "warning",
    note: contentExists ? `${mdxCount} MDX files` : "Not found \u2014 set TA_CONTENT_DIR"
  });
  const dataDir = process.env.TA_DATA_DIR ?? "data";
  const dataPath = import_path.default.join(cwd, dataDir);
  checks.push({
    label: `Data directory (${dataDir})`,
    status: import_fs.default.existsSync(dataPath) ? "ok" : "warning",
    note: !import_fs.default.existsSync(dataPath) ? "Run `npx third-audience init`" : void 0
  });
  const visitsPath = import_path.default.join(cwd, dataDir, "ta-visits.jsonl");
  const citPath = import_path.default.join(cwd, dataDir, "ta-citations.jsonl");
  const visitLines = import_fs.default.existsSync(visitsPath) ? import_fs.default.readFileSync(visitsPath, "utf-8").split("\n").filter(Boolean).length : 0;
  const citLines = import_fs.default.existsSync(citPath) ? import_fs.default.readFileSync(citPath, "utf-8").split("\n").filter(Boolean).length : 0;
  checks.push({ label: "ta-visits.jsonl", status: "ok", note: `${visitLines.toLocaleString()} records` });
  checks.push({ label: "ta-citations.jsonl", status: "ok", note: `${citLines.toLocaleString()} records` });
  const cachePath = import_path.default.join(cwd, dataDir, "ta-cache");
  const cacheExists = import_fs.default.existsSync(cachePath);
  const cacheFiles = cacheExists ? import_fs.default.readdirSync(cachePath).filter((f) => f.endsWith(".json")).length : 0;
  checks.push({ label: "Cache directory", status: "ok", note: `${cacheFiles} entries` });
  checks.push({
    label: "THIRD_AUDIENCE_SECRET",
    status: process.env.THIRD_AUDIENCE_SECRET ? "ok" : "warning",
    note: !process.env.THIRD_AUDIENCE_SECRET ? "Not set \u2014 dashboard is open to anyone" : "Set"
  });
  const middlewarePath = import_path.default.join(cwd, "middleware.ts");
  checks.push({
    label: "middleware.ts",
    status: import_fs.default.existsSync(middlewarePath) ? "ok" : "warning",
    note: !import_fs.default.existsSync(middlewarePath) ? "Not found \u2014 .md URLs and /llms.txt may not route correctly" : void 0
  });
  const hasErrors = checks.some((c) => c.status === "error");
  const hasWarnings = checks.some((c) => c.status === "warning");
  const overall = hasErrors ? "error" : hasWarnings ? "warning" : "ok";
  return { checks, overall };
}
var STATUS_ICON = { ok: "\u2705", warning: "\u26A0\uFE0F", error: "\u274C" };
var STATUS_COLOR = {
  ok: "var(--ta-green)",
  warning: "var(--ta-orange)",
  error: "var(--ta-red)"
};
var OVERALL_MSG = {
  ok: "All systems operational",
  warning: "Some optional features may be limited",
  error: "Action required: system requirements not met"
};
async function SystemHealthPage() {
  const { checks, overall } = runHealthChecks();
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: "ta-page-title", children: "System Health" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "ta-page-subtitle", children: "Diagnostics and configuration status" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ta-card ta-section", style: { borderLeft: `4px solid ${STATUS_COLOR[overall]}` }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "ta-card-body", style: { display: "flex", alignItems: "center", gap: 14 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 28 }, children: STATUS_ICON[overall] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontWeight: 600, fontSize: 15 }, children: OVERALL_MSG[overall] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { color: "var(--ta-gray-600)", fontSize: 13 }, children: [
          checks.filter((c) => c.status === "ok").length,
          "/",
          checks.length,
          " checks passing"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Card, { title: "System Checks", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { className: "ta-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "Check" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "Status" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: "Notes" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: checks.map((c) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: { fontWeight: 500 }, children: c.label }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `ta-badge ta-badge--${c.status === "ok" ? "green" : c.status === "warning" ? "orange" : "red"}`, children: c.status }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: { color: "var(--ta-gray-600)", fontSize: 13 }, children: c.note ?? "\u2014" })
      ] }, c.label)) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Card, { title: "Package Info", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "160px 1fr", gap: "8px 0", fontSize: 13 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--ta-gray-600)" }, children: "Package" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: "third-audience-mdx" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--ta-gray-600)" }, children: "Node.js" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: process.versions.node }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--ta-gray-600)" }, children: "Content dir" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: process.env.TA_CONTENT_DIR ?? "content" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--ta-gray-600)" }, children: "Data dir" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: process.env.TA_DATA_DIR ?? "data" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--ta-gray-600)" }, children: "Dashboard" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: "/third-audience/" }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Card, { title: "Quick Links", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 }, children: [
      { href: "/llms.txt", label: "/llms.txt" },
      { href: "/sitemap-ai.xml", label: "/sitemap-ai.xml" },
      { href: "/okf/", label: "/okf/" },
      { href: "/okf/index.md", label: "/okf/index.md" }
    ].map((link) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("a", { href: link.href, target: "_blank", rel: "noreferrer", className: "ta-btn ta-btn--ghost", children: [
      link.label,
      " \u2197"
    ] }, link.href)) }) })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SystemHealthPage
});
//# sourceMappingURL=SystemHealthPage.js.map