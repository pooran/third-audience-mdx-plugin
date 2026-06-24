import { getStore } from '../storage/get-store.js'
import { notifyCitationAlerts } from '../notifications/alert-sender.js'
import type { CitationRecord } from './citation-tracker.js'

export interface CitationAlert {
  type: 'first_citation' | 'new_platform' | 'citation_spike' | 'high_performing_page'
  platform: string
  url?: string
  message: string
  timestamp: string
}

export class CitationAlerts {
  async check(newRecord: CitationRecord): Promise<CitationAlert[]> {
    const alerts: CitationAlert[] = []
    const store = getStore()

    const allRecords = await store.getAllCitations()
    const platformHistory = allRecords.filter(r => r.platform === newRecord.platform)

    if (platformHistory.length === 1) {
      alerts.push({
        type: 'first_citation',
        platform: newRecord.platform,
        url: newRecord.url,
        message: `First citation from ${newRecord.platform}!`,
        timestamp: newRecord.timestamp,
      })
    }

    const since30d = new Date(Date.now() - 30 * 24 * 3_600_000).toISOString()
    const recent30d = await store.getCitations(since30d)
    const recentPlatforms = new Set(recent30d.map(r => r.platform))
    if (!recentPlatforms.has(newRecord.platform) && platformHistory.length > 1) {
      alerts.push({
        type: 'new_platform',
        platform: newRecord.platform,
        message: `${newRecord.platform} is citing your content again after a long absence.`,
        timestamp: newRecord.timestamp,
      })
    }

    const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString()
    const history24h = await store.getCitations(since24h)
    const hourly = history24h.filter(r => r.platform === newRecord.platform)
    const baseline = hourly.length > 0 ? hourly.length / 24 : 0
    const lastHourCount = hourly.filter(r =>
      new Date(r.timestamp).getTime() > Date.now() - 3_600_000
    ).length
    if (baseline > 2 && lastHourCount > baseline * 3) {
      alerts.push({
        type: 'citation_spike',
        platform: newRecord.platform,
        url: newRecord.url,
        message: `Citation spike from ${newRecord.platform}: ${lastHourCount} in last hour (baseline: ${Math.round(baseline)}/hr)`,
        timestamp: newRecord.timestamp,
      })
    }

    // Fire email notifications async — never block the request path
    notifyCitationAlerts(newRecord).catch(() => {})

    return alerts
  }
}
