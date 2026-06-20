import type { MdxFile } from '../core/mdx-reader.js'
import { MarkdownRenderer } from '../core/markdown-renderer.js'

const renderer = new MarkdownRenderer()

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
