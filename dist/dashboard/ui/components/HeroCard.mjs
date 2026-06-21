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
export {
  HeroCard
};
//# sourceMappingURL=HeroCard.mjs.map