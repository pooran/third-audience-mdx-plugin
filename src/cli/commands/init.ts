import fs from 'fs'
import path from 'path'
import readline from 'readline'

export async function init(): Promise<void> {
  const cwd = process.cwd()
  console.log('\n🎯 third-audience-mdx setup\n')

  // Detect Next.js
  const pkgPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    console.error('No package.json found. Run this from your Next.js project root.')
    process.exit(1)
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) {
    console.warn('⚠  next not found in package.json — make sure this is a Next.js project.')
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q: string, def: string) => new Promise<string>(r =>
    rl.question(`${q} (${def}): `, ans => r(ans.trim() || def))
  )

  const contentDir = await ask('Content directory (where your .mdx files live)', 'content')
  const dataDir = await ask('Data directory (for analytics logs)', 'data')
  const secret = await ask('Dashboard secret (leave blank to disable auth in dev)', '')
  rl.close()

  // Write middleware.ts if not exists
  const middlewarePath = path.join(cwd, 'middleware.ts')
  if (!fs.existsSync(middlewarePath)) {
    fs.writeFileSync(middlewarePath, `export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'\nexport const config = { matcher: ['/((?!_next|api).*)'] }\n`)
    console.log('✅ Created middleware.ts')
  } else {
    console.log('⚠  middleware.ts already exists — add thirdAudienceMiddleware manually.')
  }

  // Write .env.local additions
  const envPath = path.join(cwd, '.env.local')
  const envLines = [`THIRD_AUDIENCE_SECRET=${secret}`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`]
  const envContent = envLines.join('\n') + '\n'
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent)
    console.log('✅ Created .env.local')
  } else {
    fs.appendFileSync(envPath, '\n# Third Audience\n' + envContent)
    console.log('✅ Appended to .env.local')
  }

  // Create data dir and .gitignore entry
  fs.mkdirSync(path.join(cwd, dataDir, 'ta-cache'), { recursive: true })
  const gitignorePath = path.join(cwd, '.gitignore')
  const gitignoreAdditions = `\n# Third Audience analytics (local only)\n${dataDir}/ta-visits.jsonl\n${dataDir}/ta-citations.jsonl\n${dataDir}/ta-cache/\n`
  if (fs.existsSync(gitignorePath)) {
    fs.appendFileSync(gitignorePath, gitignoreAdditions)
  } else {
    fs.writeFileSync(gitignorePath, gitignoreAdditions.trimStart())
  }
  console.log(`✅ Created ${dataDir}/ and updated .gitignore`)

  console.log(`
✅ Setup complete!

Next steps:
  1. Add to next.config.ts:
       import { withThirdAudience } from 'third-audience-mdx'
       export default withThirdAudience({ contentDir: '${contentDir}', dataDir: '${dataDir}' })

  2. Add API routes in app/api/third-audience/ (see docs)

  3. Visit /third-audience/ for your dashboard
`)
}
