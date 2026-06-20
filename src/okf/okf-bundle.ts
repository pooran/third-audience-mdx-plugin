import type { MdxFile } from '../core/mdx-reader.js'
import { MarkdownRenderer } from '../core/markdown-renderer.js'

const renderer = new MarkdownRenderer()

export interface OkfGraphNode {
  id: string
  title: string
  type: string
  url: string
}

export interface OkfGraphEdge {
  source: string
  target: string
}

export interface OkfGraphData {
  nodes: OkfGraphNode[]
  edges: OkfGraphEdge[]
}

/**
 * Builds the knowledge graph data for the OKF viewer.
 * Nodes = content pages; edges = internal links between them.
 * Trims to top 100 most-connected nodes (matching WP plugin behaviour).
 */
export function buildOkfGraph(files: MdxFile[], baseUrl: string): OkfGraphData {
  const base = baseUrl.replace(/\/$/, '')
  const slugSet = new Set(files.map(f => f.slug))

  // Build slug → markdown map for link extraction
  const mdMap = new Map<string, string>()
  for (const file of files) {
    mdMap.set(file.slug, renderer.render(file))
  }

  // Count degrees to pick top 100
  const degrees = new Map<string, number>(files.map(f => [f.slug, 0]))
  const rawEdges: OkfGraphEdge[] = []

  for (const file of files) {
    const md = mdMap.get(file.slug) ?? ''
    const linkRe = /\[([^\]]+)\]\((\/[^)]+)\)/g
    let m: RegExpExecArray | null
    while ((m = linkRe.exec(md)) !== null) {
      const candidate = m[2].replace(/^\//, '').replace(/\.md$/, '')
      if (slugSet.has(candidate) && candidate !== file.slug) {
        rawEdges.push({ source: file.slug, target: candidate })
        degrees.set(file.slug, (degrees.get(file.slug) ?? 0) + 1)
        degrees.set(candidate, (degrees.get(candidate) ?? 0) + 1)
      }
    }
  }

  // Top 100 nodes by degree
  const top100 = files
    .slice()
    .sort((a, b) => (degrees.get(b.slug) ?? 0) - (degrees.get(a.slug) ?? 0))
    .slice(0, 100)
  const topSet = new Set(top100.map(f => f.slug))

  const nodes: OkfGraphNode[] = top100.map(f => ({
    id: f.slug,
    title: String(f.frontmatter.title ?? f.slug),
    type: String(f.frontmatter.type ?? 'WebPage'),
    url: `${base}/${f.slug}`,
  }))

  const edges = rawEdges.filter(e => topSet.has(e.source) && topSet.has(e.target))

  return { nodes, edges }
}

/** Generates the /okf/index.md manifest listing all content. */
export function generateOkfIndex(files: MdxFile[], baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '')
  const lines = [
    '# Open Knowledge Format (OKF) Bundle',
    '',
    'This bundle contains all content as clean Markdown files for AI consumption.',
    '',
    '## Contents',
    '',
  ]

  for (const file of files) {
    const fm = file.frontmatter
    const title = String(fm.title ?? file.slug)
    const desc = fm.description ? ` — ${String(fm.description)}` : ''
    lines.push(`- [${title}](${base}/okf/${file.slug}.md)${desc}`)
  }

  return lines.join('\n') + '\n'
}

/** Renders a single MDX file for OKF, with internal links rewritten to .md siblings. */
export function generateOkfPage(file: MdxFile, allFiles: MdxFile[], baseUrl: string): string {
  const markdown = renderer.render(file)
  return rewriteInternalLinks(markdown, allFiles, baseUrl)
}

/**
 * Rewrites internal links to point at sibling .md files in the OKF bundle.
 * e.g. [link](/blog/post) → [link](/okf/blog/post.md)
 */
function rewriteInternalLinks(markdown: string, allFiles: MdxFile[], baseUrl: string): string {
  const slugSet = new Set(allFiles.map(f => f.slug))
  const base = baseUrl.replace(/\/$/, '')

  return markdown.replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, (match, text, href) => {
    // Strip leading slash and any trailing .md to get candidate slug
    const candidate = href.replace(/^\//, '').replace(/\.md$/, '')
    if (slugSet.has(candidate)) {
      return `[${text}](${base}/okf/${candidate}.md)`
    }
    return match
  })
}
