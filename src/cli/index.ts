#!/usr/bin/env node
import { init } from './commands/init.js'
import { health } from './commands/health.js'
import { exportData } from './commands/export.js'

const [,, command, ...args] = process.argv

switch (command) {
  case 'init':
    init().catch(console.error)
    break
  case 'health':
    health().catch(console.error)
    break
  case 'export':
    exportData(args).catch(console.error)
    break
  default:
    console.log(`third-audience CLI

Commands:
  init      Set up third-audience-mdx in your Next.js project
  health    Show system health status
  export    Export analytics data as CSV

Usage: npx third-audience <command>`)
}
