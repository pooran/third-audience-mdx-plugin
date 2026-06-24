"use client";

// src/dashboard/ui/pages/EmailDigestPage.tsx
import { useState, useEffect } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function EmailDigestPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [result, setResult] = useState(null);
  async function loadStatus() {
    try {
      const res = await fetch("/api/third-audience/digest");
      const data = await res.json();
      setStatus(data);
    } catch {
    }
    setLoading(false);
  }
  useEffect(() => {
    loadStatus();
  }, []);
  async function send(period, force = false) {
    setSending(period);
    setResult(null);
    try {
      const res = await fetch("/api/third-audience/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, force })
      });
      const data = await res.json();
      setResult(data);
      loadStatus();
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setSending(null);
    }
  }
  function fmt(iso) {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString();
  }
  return /* @__PURE__ */ jsxs("div", { className: "ta-page", children: [
    /* @__PURE__ */ jsxs("div", { className: "ta-page-header", children: [
      /* @__PURE__ */ jsx("h1", { className: "ta-page-title", children: "Email Digest" }),
      /* @__PURE__ */ jsx("p", { style: { color: "var(--ta-secondary)", fontSize: 14, margin: 0 }, children: "Trigger digest emails manually or review last-sent timestamps" })
    ] }),
    result && /* @__PURE__ */ jsx("div", { style: {
      background: result.ok && result.sent ? "#dcfce7" : result.ok && !result.sent ? "#fef3c7" : "#fee2e2",
      color: result.ok && result.sent ? "#16a34a" : result.ok && !result.sent ? "#d97706" : "#dc2626",
      padding: "10px 14px",
      borderRadius: 8,
      marginBottom: 20,
      fontSize: 14
    }, children: result.error ?? (result.sent ? "Digest sent successfully." : `Skipped: ${result.reason}`) }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 800 }, children: [
      /* @__PURE__ */ jsxs("div", { className: "ta-card", children: [
        /* @__PURE__ */ jsx("div", { className: "ta-card-header", children: /* @__PURE__ */ jsx("h2", { className: "ta-card-title", children: "Daily Digest" }) }),
        /* @__PURE__ */ jsxs("div", { className: "ta-card-body", children: [
          /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: "var(--ta-secondary)", marginBottom: 4 }, children: "Last sent:" }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 14, fontWeight: 500, marginBottom: 20 }, children: loading ? "\u2026" : fmt(status?.lastSent.daily ?? null) }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "var(--ta-secondary)", marginBottom: 16 }, children: "Covers the last 24 hours of bot visits and AI citations." }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "ta-btn ta-btn-primary",
                onClick: () => send("daily"),
                disabled: sending !== null,
                style: { flex: 1 },
                children: sending === "daily" ? "Sending\u2026" : "Send now"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "ta-btn ta-btn-secondary",
                onClick: () => send("daily", true),
                disabled: sending !== null,
                title: "Force send even if recently sent",
                children: "Force"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ta-card", children: [
        /* @__PURE__ */ jsx("div", { className: "ta-card-header", children: /* @__PURE__ */ jsx("h2", { className: "ta-card-title", children: "Weekly Digest" }) }),
        /* @__PURE__ */ jsxs("div", { className: "ta-card-body", children: [
          /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: "var(--ta-secondary)", marginBottom: 4 }, children: "Last sent:" }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 14, fontWeight: 500, marginBottom: 20 }, children: loading ? "\u2026" : fmt(status?.lastSent.weekly ?? null) }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "var(--ta-secondary)", marginBottom: 16 }, children: "Covers the last 7 days with trend charts and platform breakdowns." }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "ta-btn ta-btn-primary",
                onClick: () => send("weekly"),
                disabled: sending !== null,
                style: { flex: 1 },
                children: sending === "weekly" ? "Sending\u2026" : "Send now"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "ta-btn ta-btn-secondary",
                onClick: () => send("weekly", true),
                disabled: sending !== null,
                title: "Force send even if recently sent",
                children: "Force"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "ta-card", style: { maxWidth: 800, marginTop: 24 }, children: [
      /* @__PURE__ */ jsx("div", { className: "ta-card-header", children: /* @__PURE__ */ jsx("h2", { className: "ta-card-title", children: "Configuration" }) }),
      /* @__PURE__ */ jsxs("div", { className: "ta-card-body", children: [
        /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: "var(--ta-secondary)", marginBottom: 16 }, children: "Emails require either a Brevo API key or SMTP credentials in your environment:" }),
        /* @__PURE__ */ jsx("pre", { style: {
          background: "#1d1d1f",
          color: "#f5f5f7",
          borderRadius: 10,
          padding: "14px 16px",
          fontSize: 13,
          overflowX: "auto"
        }, children: `# Option A \u2014 Brevo transactional API
TA_BREVO_API_KEY=your-api-key

# Option B \u2014 SMTP (works with Brevo relay or any provider)
TA_SMTP_HOST=smtp-relay.brevo.com
TA_SMTP_PORT=587
TA_SMTP_USER=your-login
TA_SMTP_PASS=your-password

# Required for both
TA_NOTIFY_TO=you@example.com
TA_NOTIFY_FROM=Third Audience <alerts@yourdomain.com>` }),
        /* @__PURE__ */ jsxs("p", { style: { fontSize: 13, color: "var(--ta-secondary)", marginTop: 16 }, children: [
          "To automate digests, add a cron job to ",
          /* @__PURE__ */ jsx("code", { children: "vercel.json" }),
          ":"
        ] }),
        /* @__PURE__ */ jsx("pre", { style: {
          background: "#1d1d1f",
          color: "#f5f5f7",
          borderRadius: 10,
          padding: "14px 16px",
          fontSize: 13,
          overflowX: "auto",
          marginTop: 8
        }, children: `{
  "crons": [
    { "path": "/api/third-audience/digest", "schedule": "0 8 * * *" }
  ]
}` })
      ] })
    ] })
  ] });
}
export {
  EmailDigestPage
};
//# sourceMappingURL=EmailDigestPage.mjs.map