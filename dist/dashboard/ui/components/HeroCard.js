"use strict";
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

// src/dashboard/ui/components/HeroCard.tsx
var HeroCard_exports = {};
__export(HeroCard_exports, {
  HeroCard: () => HeroCard
});
module.exports = __toCommonJS(HeroCard_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HeroCard
});
//# sourceMappingURL=HeroCard.js.map