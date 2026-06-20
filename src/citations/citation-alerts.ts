import fs from 'fs'
import path from 'path'
import type { CitationRecord } from './citation-tracker.js'

export interface CitationAlert {
  type: 'first_citation' | 'new_platform' | 'citation_spike' | 'high_performing_page'
  platform: string
  url?: string
  message: string
  timestamp: string
}

export class CitationAlerts {
  private dataDir: string

  constructor(dataDir = process.env.TA_DATA_DIR ?? 'data') {
    this.dataDir = dataDir
  }

  /** Call after appending a new citation record. Returns any triggered alerts. */
  check(newRecord: CitationRecord): CitationAlert[] {
    const alerts: CitationAlert[] = []
    const history = this.loadRecent(24) // last 24h

    // First citation from this platform ever
    const platformHistory = this.loadAll().filter(r => r.platform === newRecord.platform)
    if (platformHistory.length === 1) {
      alerts.push({
        type: 'first_citation',
        platform: newRecord.platform,
        url: newRecord.url,
        message: `First citation from ${newRecord.platform}!`,
        timestamp: newRecord.timestamp,
      })
    }

    // New platform not seen in last 30 days
    const recentPlatforms = new Set(this.loadRecent(30 * 24).map(r => r.platform))
    if (!recentPlatforms.has(newRecord.platform) && platformHistory.length > 1) {
      alerts.push({
        type: 'new_platform',
        platform: newRecord.platform,
        message: `${newRecord.platform} is citing your content again after a long absence.`,
        timestamp: newRecord.timestamp,
      })
    }

    // Citation spike: >3× the hourly baseline
    const hourly = history.filter(r => r.platform === newRecord.platform)
    const baseline = hourly.length > 0 ? hourly.length / 24 : 0
    const lastHourCount = history.filter(r =>
      r.platform === newRecord.platform &&
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

    return alerts
  }

  private loadAll(): CitationRecord[] {
    return this.loadLines(Infinity)
  }

  private loadRecent(hours: number): CitationRecord[] {
    return this.loadLines(hours)
  }

  private loadLines(hours: number): CitationRecord[] {
    const filePath = path.join(this.dataDir, 'ta-citations.jsonl')
    if (!fs.existsSync(filePath)) return []
    const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString()
    return fs.readFileSync(filePath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map(l => { try { return JSON.parse(l) as CitationRecord } catch { return null } })
      .filter((r): r is CitationRecord => r !== null && (hours === Infinity || r.timestamp >= cutoff))
  }
}
