"use strict";
"use client";
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

// src/dashboard/ui/components/Sidebar.tsx
var Sidebar_exports = {};
__export(Sidebar_exports, {
  Sidebar: () => Sidebar
});
module.exports = __toCommonJS(Sidebar_exports);
var import_link = __toESM(require("next/link"));
var import_navigation = require("next/navigation");
var import_jsx_runtime = require("react/jsx-runtime");
var NAV = [
  {
    href: "/third-audience",
    label: "Bot Analytics",
    icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) })
  },
  {
    href: "/third-audience/citations",
    label: "LLM Traffic",
    icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) })
  },
  {
    href: "/third-audience/bots",
    label: "Bot Management",
    icon: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
    ] })
  },
  {
    href: "/third-audience/okf",
    label: "OKF Bundle",
    icon: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "6", cy: "6", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "18", cy: "6", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "6", cy: "18", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "18", cy: "18", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "8", y1: "6", x2: "10", y2: "11" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "16", y1: "6", x2: "14", y2: "11" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "8", y1: "18", x2: "10", y2: "13" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "16", y1: "18", x2: "14", y2: "13" })
    ] })
  },
  {
    href: "/third-audience/health",
    label: "System Health",
    icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M22 12h-4l-3 9L9 3l-3 9H2" }) })
  },
  {
    href: "/third-audience/settings",
    label: "Settings",
    icon: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })
    ] })
  }
];
function Sidebar() {
  const pathname = (0, import_navigation.usePathname)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { className: "ta-sidebar", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "ta-sidebar-brand", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 28 28", fill: "none", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { width: "28", height: "28", rx: "7", fill: "#007aff" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 20l4-8 4 8M10 17h4", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "20", cy: "9", r: "3", fill: "#34c759" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Third Audience" })
    ] }),
    NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      import_link.default,
      {
        href: item.href,
        className: `ta-nav-item${pathname === item.href ? " active" : ""}`,
        children: [
          item.icon,
          item.label
        ]
      },
      item.href
    ))
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Sidebar
});
//# sourceMappingURL=Sidebar.js.map