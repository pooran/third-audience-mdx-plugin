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

// src/dashboard/ui/pages/SettingsPage.tsx
var SettingsPage_exports = {};
__export(SettingsPage_exports, {
  SettingsPage: () => SettingsPage
});
module.exports = __toCommonJS(SettingsPage_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function SettingsPage({ maskedKey: initialMasked }) {
  const [masked, setMasked] = (0, import_react.useState)(initialMasked);
  const [revealed, setRevealed] = (0, import_react.useState)(null);
  const [rotating, setRotating] = (0, import_react.useState)(false);
  const [copied, setCopied] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  async function handleRotate() {
    if (!confirm("Rotate the API key? All existing integrations using the current key will stop working immediately.")) return;
    setRotating(true);
    setError(null);
    setRevealed(null);
    try {
      const res = await fetch("/api/third-audience/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRevealed(data.key ?? null);
      setMasked(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRotating(false);
    }
  }
  async function handleCopy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch {
      setError("Copy failed \u2014 please copy manually.");
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-page", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-page-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "ta-page-title", children: "Settings" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card", style: { maxWidth: 640 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "ta-card-title", children: "API Key" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontSize: 14, color: "var(--ta-secondary)", marginBottom: 20 }, children: [
          "Use this key to authenticate headless or external API calls via the",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "X-TA-Api-Key" }),
          " request header. Keep it secret."
        ] }),
        revealed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          background: "#f0fff4",
          border: "1.5px solid #34c759",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 16
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12, fontWeight: 600, color: "#1a7f37", marginBottom: 8 }, children: "New API key \u2014 copy it now, it will not be shown again" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10, alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: {
              flex: 1,
              fontFamily: "monospace",
              fontSize: 13,
              wordBreak: "break-all",
              background: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d2d2d7"
            }, children: revealed }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                className: "ta-btn ta-btn-secondary",
                onClick: () => handleCopy(revealed),
                style: { whiteSpace: "nowrap" },
                children: copied ? "\u2713 Copied" : "Copy"
              }
            )
          ] })
        ] }),
        !revealed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            readOnly: true,
            value: masked ?? "(no key generated)",
            style: {
              flex: 1,
              fontFamily: "monospace",
              fontSize: 13,
              padding: "9px 12px",
              border: "1.5px solid #d2d2d7",
              borderRadius: 10,
              background: "#f5f5f7",
              color: "#1d1d1f"
            }
          }
        ) }),
        error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
          background: "#fff2f2",
          border: "1px solid #ffbaba",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 13,
          color: "#c0392b",
          marginBottom: 16
        }, children: error }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "ta-btn ta-btn-danger",
            onClick: handleRotate,
            disabled: rotating,
            children: rotating ? "Rotating\u2026" : "Rotate API key"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: 12, color: "var(--ta-secondary)", marginTop: 10 }, children: "Rotating generates a new key immediately. The old key stops working at once." })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card", style: { maxWidth: 640, marginTop: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "ta-card-title", children: "Usage" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontSize: 14, color: "var(--ta-secondary)", marginBottom: 12 }, children: [
          "Include the key in the ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "X-TA-Api-Key" }),
          " header on any API request:"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { style: {
          background: "#1d1d1f",
          color: "#f5f5f7",
          borderRadius: 10,
          padding: "14px 16px",
          fontSize: 13,
          overflowX: "auto"
        }, children: `curl https://yoursite.com/api/third-audience/analytics \\
  -H "X-TA-Api-Key: ta_your_key_here"` }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontSize: 13, color: "var(--ta-secondary)", marginTop: 12 }, children: [
          "Or use ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "Authorization: Bearer ta_your_key_here" }),
          " if your HTTP client does not support custom headers."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card", style: { maxWidth: 640, marginTop: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ta-card-header", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "ta-card-title", children: "Dashboard password" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-card-body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: 14, color: "var(--ta-secondary)", marginBottom: 16 }, children: "Change the password used to log in to this dashboard." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: "/third-audience/login?reset=1", className: "ta-btn ta-btn-secondary", children: "Change password" })
      ] })
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SettingsPage
});
//# sourceMappingURL=SettingsPage.js.map