import fs from 'fs'
import path from 'path'

export async function health(): Promise<void> {
  const cwd = process.cwd()
  const checks: Array<{ label: string; ok: boolean; note?: string }> = []

  // Node version
  const nodeVersion = process.versions.node
  const [nodeMajor] = nodeVersion.split('.').map(Number)
  checks.push({ label: `Node.js ${nodeVersion}`, ok: nodeMajor >= 18, note: nodeMajor < 18 ? 'requires Node 18+' : undefined })

  // package.json
  const pkgPath = path.join(cwd, 'package.json')
  checks.push({ label: 'package.json', ok: fs.existsSync(pkgPath) })

  // next installed
  const nextPath = path.join(cwd, 'node_modules', 'next')
  checks.push({ label: 'next installed', ok: fs.existsSync(nextPath) })

  // middleware.ts
  const middlewarePath = path.join(cwd, 'middleware.ts')
  checks.push({ label: 'middleware.ts', ok: fs.existsSync(middlewarePath) })

  // content dir
  const contentDir = process.env.TA_CONTENT_DIR ?? 'content'
  const contentPath = path.join(cwd, contentDir)
  const contentExists = fs.existsSync(contentPath)
  const mdxCount = contentExists
    ? countFiles(contentPath, ['.mdx', '.md'])
    : 0
  checks.push({ label: `contentDir (${contentDir})`, ok: contentExists, note: contentExists ? `${mdxCount} MDX files` : 'directory not found' })

  // data dir
  const dataDir = process.env.TA_DATA_DIR ?? 'data'
  const dataPath = path.join(cwd, dataDir)
  checks.push({ label: `dataDir (${dataDir})`, ok: fs.existsSync(dataPath) })

  // JSONL files
  const visitsPath = path.join(cwd, dataDir, 'ta-visits.jsonl')
  const citationsPath = path.join(cwd, dataDir, 'ta-citations.jsonl')
  const visitLines = fs.existsSync(visitsPath) ? countLines(visitsPath) : 0
  const citationLines = fs.existsSync(citationsPath) ? countLines(citationsPath) : 0
  checks.push({ label: 'ta-visits.jsonl', ok: true, note: `${visitLines} records` })
  checks.push({ label: 'ta-citations.jsonl', ok: true, note: `${citationLines} records` })

  // dashboard secret
  checks.push({ label: 'THIRD_AUDIENCE_SECRET', ok: !!process.env.THIRD_AUDIENCE_SECRET, note: !process.env.THIRD_AUDIENCE_SECRET ? 'not set (dashboard is open)' : 'set' })

  console.log('\n🏥 third-audience health check\n')
  for (const c of checks) {
    const icon = c.ok ? '✅' : '❌'
    const note = c.note ? `  (${c.note})` : ''
    console.log(`  ${icon}  ${c.label}${note}`)
  }
  console.log()
}

function countFiles(dir: string, exts: string[]): number {
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name), exts)
    else if (exts.some(e => entry.name.endsWith(e))) count++
  }
  return count
}

function countLines(filePath: string): number {
  return fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean).length
}
