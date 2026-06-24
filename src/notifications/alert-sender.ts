import { sendMail, isMailConfigured } from './mailer.js'
import {
  firstBotVisitEmail,
  firstCitationEmail,
  newPlatformEmail,
  citationSpikeEmail,
  digestEmail,
} from './email-templates.js'
import { buildDigest, wasDigestSentRecently, markDigestSent } from './digest.js'
import { getStore } from '../storage/get-store.js'
import type { CitationRecord } from '../citations/citation-tracker.js'
import type { VisitRecord } from '../analytics/visit-tracker.js'

// ── First bot visit ──────────────────────────────────────────────────────────

export async function notifyFirstBotVisit(visit: VisitRecord): Promise<void> {
  if (!isMailConfigured()) return

  const store = getStore()
  const botName = visit.bot_name ?? visit.bot_category
  const kvKey = `first_bot_visit_${botName.toLowerCase().replace(/\s+/g, '_')}`
  const alreadySent = await store.getKv(kvKey)
  if (alreadySent) return

  const visits = await store.getVisits(new Date(0).toISOString())
  const visitsForBot = visits.filter(v => (v.bot_name ?? v.bot_category) === botName)
  if (visitsForBot.length > 1) {
    // Not actually first visit — mark seen and skip
    await store.setKv(kvKey, 'seen')
    return
  }

  const { subject, html } = firstBotVisitEmail({
    botName,
    url: visit.url,
    country: visit.country ?? null,
  })
  await sendMail({ to: '', subject, html })
  await store.setKv(kvKey, new Date().toISOString())
}

// ── Citation alerts ──────────────────────────────────────────────────────────

export async function notifyCitationAlerts(record: CitationRecord): Promise<void> {
  if (!isMailConfigured()) return

  const store = getStore()
  const allCitations = await store.getAllCitations()
  const forPlatform = allCitations.filter(c => c.platform === record.platform)

  // First citation ever from this platform
  if (forPlatform.length === 1) {
    const kvKey = `first_citation_${record.platform.toLowerCase().replace(/\s+/g, '_')}`
    const alreadySent = await store.getKv(kvKey)
    if (!alreadySent) {
      const { subject, html } = firstCitationEmail({
        platform: record.platform,
        url: record.url,
        query: record.query,
      })
      await sendMail({ to: '', subject, html })
      await store.setKv(kvKey, new Date().toISOString())
    }
    return
  }

  // New platform (seen before, but not in last 30 days)
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const recent30d = allCitations.filter(c => c.platform === record.platform && c.timestamp >= since30d)
  if (recent30d.length === 1) {
    const kvKey = `new_platform_alert_${record.platform.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 7)}`
    const alreadySent = await store.getKv(kvKey)
    if (!alreadySent) {
      const { subject, html } = newPlatformEmail({ platform: record.platform, url: record.url })
      await sendMail({ to: '', subject, html })
      await store.setKv(kvKey, new Date().toISOString())
    }
    return
  }

  // Citation spike — more than 3x baseline in last hour, with minimum 3 citations baseline
  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const last24h = allCitations.filter(c => c.platform === record.platform && c.timestamp >= since24h)
  const baselinePerHr = last24h.length / 24
  const lastHour = last24h.filter(c => new Date(c.timestamp).getTime() > Date.now() - 3_600_000)
  if (baselinePerHr >= 3 && lastHour.length > baselinePerHr * 3) {
    // Rate-limit spike alerts: once per 4h per platform
    const kvKey = `spike_alert_${record.platform.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 13)}`
    const alreadySent = await store.getKv(kvKey)
    if (!alreadySent) {
      const { subject, html } = citationSpikeEmail({
        platform: record.platform,
        count: lastHour.length,
        baseline: baselinePerHr,
        url: record.url,
      })
      await sendMail({ to: '', subject, html })
      await store.setKv(kvKey, new Date().toISOString())
    }
  }
}

// ── Digest ───────────────────────────────────────────────────────────────────

export async function sendDigest(period: 'daily' | 'weekly'): Promise<{ sent: boolean; reason?: string }> {
  if (!isMailConfigured()) return { sent: false, reason: 'mail not configured' }

  if (await wasDigestSentRecently(period)) {
    return { sent: false, reason: `${period} digest already sent recently` }
  }

  const data = await buildDigest(period)
  const { subject, html } = digestEmail(data)
  await sendMail({ to: '', subject, html })
  await markDigestSent(period)
  return { sent: true }
}
