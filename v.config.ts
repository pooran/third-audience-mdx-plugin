import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli/index.ts',
    'src/dashboard/routes/*.ts',
    'src/dashboard/auth.ts',
    'src/dashboard/admin-store.ts',
    'src/dashboard/ui/components/Sidebar.tsx',
    'src/dashboard/ui/components/Card.tsx',
    'src/dashboard/ui/components/HeroCard.tsx',
    'src/dashboard/ui/components/VisitsChart.tsx',
    'src/dashboard/ui/pages/BotAnalyticsPage.tsx',
    'src/dashboard/ui/pages/LlmTrafficPage.tsx',
    'src/dashboard/ui/pages/BotManagementPage.tsx',
    'src/dashboard/ui/pages/SettingsPage.tsx',
    'src/dashboard/ui/pages/SystemHealthPage.tsx',
    'src/dashboard/ui/pages/OkfPage.tsx',
    'src/dashboard/ui/pages/CompetitorBenchmarkingPage.tsx',
    'src/dashboard/ui/pages/CacheBrowserPage.tsx',
    'src/dashboard/ui/pages/EmailDigestPage.tsx',
    'src/dashboard/ui/pages/UrlInspectorPage.tsx',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  jsx: 'react-jsx',
  esbuildOptions(options) {
    options.external = ['next', 'react', 'react-dom', 'next/server', 'next/navigation', 'next/headers', 'better-sqlite3', 'pg']
  },
  // Copy CSS file as-is to dist
  async onSuccess() {
    const { execSync } = await import('child_process')
    execSync('mkdir -p dist/dashboard/ui && cp src/dashboard/ui/globals.css dist/dashboard/ui/globals.css')
  },
})
