import fs from 'fs'
import path from 'path'

export async function exportData(args: string[]): Promise<void> {
  const dataDir = process.env.TA_DATA_DIR ?? 'data'
  const type = args[0] ?? 'visits'
  const outPath = args[1] ?? `ta-${type}-export.csv`

  const file = type === 'citations' ? 'ta-citations.jsonl' : 'ta-visits.jsonl'
  const jsonlPath = path.join(process.cwd(), dataDir, file)

  if (!fs.existsSync(jsonlPath)) {
    console.error(`No data found at ${jsonlPath}`)
    process.exit(1)
  }

  const records = fs.readFileSync(jsonlPath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(l => { try { return JSON.parse(l) } catch { return null } })
    .filter(Boolean)

  if (records.length === 0) {
    console.log('No records to export.')
    return
  }

  const headers = Object.keys(records[0])
  const csv = [
    headers.join(','),
    ...records.map(r => headers.map(h => csvCell(r[h])).join(',')),
  ].join('\n') + '\n'

  fs.writeFileSync(outPath, csv)
  console.log(`✅ Exported ${records.length} records to ${outPath}`)
}

function csvCell(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
