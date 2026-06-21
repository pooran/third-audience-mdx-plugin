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
export {
  Card
};
//# sourceMappingURL=Card.mjs.map