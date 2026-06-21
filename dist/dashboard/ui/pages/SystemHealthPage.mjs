// src/dashboard/ui/pages/SystemHealthPage.tsx
import fs from "fs";
import path from "path";

// src/dashboard/ui/components/Card.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Card({ title, action, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "ta-card ta-section", children: [
    /* @__PURE__ */ jsxs("div", { className: "ta-card-header", children: [
      /* @__PURE__ */ jsx("h2", { children: title }),
      action
    ] }),
    /* @__PURE__ */ jsx("div", { className: "ta-card-body", children })
  ] });
}

// src/dashboard/ui/pages/SystemHealthPage.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
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
  const contentPath = path.join(cwd, contentDir);
  const contentExists = fs.existsSync(contentPath);
  let mdxCount = 0;
  if (contentExists) {
    let countMdx2 = function(dir) {
      let n = 0;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) n += countMdx2(path.join(dir, e.name));
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
  const dataPath = path.join(cwd, dataDir);
  checks.push({
    label: `Data directory (${dataDir})`,
    status: fs.existsSync(dataPath) ? "ok" : "warning",
    note: !fs.existsSync(dataPath) ? "Run `npx third-audience init`" : void 0
  });
  const visitsPath = path.join(cwd, dataDir, "ta-visits.jsonl");
  const citPath = path.join(cwd, dataDir, "ta-citations.jsonl");
  const visitLines = fs.existsSync(visitsPath) ? fs.readFileSync(visitsPath, "utf-8").split("\n").filter(Boolean).length : 0;
  const citLines = fs.existsSync(citPath) ? fs.readFileSync(citPath, "utf-8").split("\n").filter(Boolean).length : 0;
  checks.push({ label: "ta-visits.jsonl", status: "ok", note: `${visitLines.toLocaleString()} records` });
  checks.push({ label: "ta-citations.jsonl", status: "ok", note: `${citLines.toLocaleString()} records` });
  const cachePath = path.join(cwd, dataDir, "ta-cache");
  const cacheExists = fs.existsSync(cachePath);
  const cacheFiles = cacheExists ? fs.readdirSync(cachePath).filter((f) => f.endsWith(".json")).length : 0;
  checks.push({ label: "Cache directory", status: "ok", note: `${cacheFiles} entries` });
  checks.push({
    label: "THIRD_AUDIENCE_SECRET",
    status: process.env.THIRD_AUDIENCE_SECRET ? "ok" : "warning",
    note: !process.env.THIRD_AUDIENCE_SECRET ? "Not set \u2014 dashboard is open to anyone" : "Set"
  });
  const middlewarePath = path.join(cwd, "middleware.ts");
  checks.push({
    label: "middleware.ts",
    status: fs.existsSync(middlewarePath) ? "ok" : "warning",
    note: !fs.existsSync(middlewarePath) ? "Not found \u2014 .md URLs and /llms.txt may not route correctly" : void 0
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
  return /* @__PURE__ */ jsxs2("div", { children: [
    /* @__PURE__ */ jsx2("h1", { className: "ta-page-title", children: "System Health" }),
    /* @__PURE__ */ jsx2("p", { className: "ta-page-subtitle", children: "Diagnostics and configuration status" }),
    /* @__PURE__ */ jsx2("div", { className: "ta-card ta-section", style: { borderLeft: `4px solid ${STATUS_COLOR[overall]}` }, children: /* @__PURE__ */ jsxs2("div", { className: "ta-card-body", style: { display: "flex", alignItems: "center", gap: 14 }, children: [
      /* @__PURE__ */ jsx2("span", { style: { fontSize: 28 }, children: STATUS_ICON[overall] }),
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2("div", { style: { fontWeight: 600, fontSize: 15 }, children: OVERALL_MSG[overall] }),
        /* @__PURE__ */ jsxs2("div", { style: { color: "var(--ta-gray-600)", fontSize: 13 }, children: [
          checks.filter((c) => c.status === "ok").length,
          "/",
          checks.length,
          " checks passing"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx2(Card, { title: "System Checks", children: /* @__PURE__ */ jsxs2("table", { className: "ta-table", children: [
      /* @__PURE__ */ jsx2("thead", { children: /* @__PURE__ */ jsxs2("tr", { children: [
        /* @__PURE__ */ jsx2("th", { children: "Check" }),
        /* @__PURE__ */ jsx2("th", { children: "Status" }),
        /* @__PURE__ */ jsx2("th", { children: "Notes" })
      ] }) }),
      /* @__PURE__ */ jsx2("tbody", { children: checks.map((c) => /* @__PURE__ */ jsxs2("tr", { children: [
        /* @__PURE__ */ jsx2("td", { style: { fontWeight: 500 }, children: c.label }),
        /* @__PURE__ */ jsx2("td", { children: /* @__PURE__ */ jsx2("span", { className: `ta-badge ta-badge--${c.status === "ok" ? "green" : c.status === "warning" ? "orange" : "red"}`, children: c.status }) }),
        /* @__PURE__ */ jsx2("td", { style: { color: "var(--ta-gray-600)", fontSize: 13 }, children: c.note ?? "\u2014" })
      ] }, c.label)) })
    ] }) }),
    /* @__PURE__ */ jsx2(Card, { title: "Package Info", children: /* @__PURE__ */ jsxs2("div", { style: { display: "grid", gridTemplateColumns: "160px 1fr", gap: "8px 0", fontSize: 13 }, children: [
      /* @__PURE__ */ jsx2("span", { style: { color: "var(--ta-gray-600)" }, children: "Package" }),
      /* @__PURE__ */ jsx2("span", { children: /* @__PURE__ */ jsx2("code", { children: "third-audience-mdx" }) }),
      /* @__PURE__ */ jsx2("span", { style: { color: "var(--ta-gray-600)" }, children: "Node.js" }),
      /* @__PURE__ */ jsx2("span", { children: /* @__PURE__ */ jsx2("code", { children: process.versions.node }) }),
      /* @__PURE__ */ jsx2("span", { style: { color: "var(--ta-gray-600)" }, children: "Content dir" }),
      /* @__PURE__ */ jsx2("span", { children: /* @__PURE__ */ jsx2("code", { children: process.env.TA_CONTENT_DIR ?? "content" }) }),
      /* @__PURE__ */ jsx2("span", { style: { color: "var(--ta-gray-600)" }, children: "Data dir" }),
      /* @__PURE__ */ jsx2("span", { children: /* @__PURE__ */ jsx2("code", { children: process.env.TA_DATA_DIR ?? "data" }) }),
      /* @__PURE__ */ jsx2("span", { style: { color: "var(--ta-gray-600)" }, children: "Dashboard" }),
      /* @__PURE__ */ jsx2("span", { children: /* @__PURE__ */ jsx2("code", { children: "/third-audience/" }) })
    ] }) }),
    /* @__PURE__ */ jsx2(Card, { title: "Quick Links", children: /* @__PURE__ */ jsx2("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 }, children: [
      { href: "/llms.txt", label: "/llms.txt" },
      { href: "/sitemap-ai.xml", label: "/sitemap-ai.xml" },
      { href: "/okf/", label: "/okf/" },
      { href: "/okf/index.md", label: "/okf/index.md" }
    ].map((link) => /* @__PURE__ */ jsxs2("a", { href: link.href, target: "_blank", rel: "noreferrer", className: "ta-btn ta-btn--ghost", children: [
      link.label,
      " \u2197"
    ] }, link.href)) }) })
  ] });
}
export {
  SystemHealthPage
};
//# sourceMappingURL=SystemHealthPage.mjs.map