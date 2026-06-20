import type { MdxFile } from '../core/mdx-reader.js'

/** Generates /sitemap-ai.xml from MDX files. */
export function generateAiSitemap(files: MdxFile[], baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '')
  const urls = files.map(file => {
    const fm = file.frontmatter
    const loc = `${base}/${file.slug}`
    const lastmod = fm.date ? new Date(fm.date as string).toISOString().slice(0, 10) : ''
    const title = fm.title ? `\n    <title>${escapeXml(String(fm.title))}</title>` : ''
    const desc = fm.description ? `\n    <description>${escapeXml(String(fm.description))}</description>` : ''
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
      `    <changefreq>weekly</changefreq>`,
      title,
      desc,
      '  </url>',
    ].filter(Boolean).join('\n')
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n') + '\n'
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
