import type { MdxFile } from './mdx-reader.js'

/**
 * Strips JSX from MDX content and returns clean Markdown
 * suitable for AI crawlers.
 *
 * Removes:
 * - import/export statements
 * - JSX component tags (<ComponentName ... /> and <ComponentName>...</ComponentName>)
 * - Inline expressions {variable} that aren't standard Markdown
 *
 * Preserves:
 * - All standard Markdown (headings, lists, code blocks, links, images)
 * - Frontmatter (serialized as YAML header)
 */
export class MarkdownRenderer {
  render(file: MdxFile): string {
    const header = this.buildFrontmatterHeader(file.frontmatter)
    const body = this.stripJsx(file.rawContent)
    return header ? `${header}\n\n${body}` : body
  }

  private buildFrontmatterHeader(fm: Record<string, unknown>): string {
    const keys = Object.keys(fm)
    if (keys.length === 0) return ''
    const lines = keys
      .filter(k => fm[k] !== undefined && fm[k] !== null)
      .map(k => `${k}: ${this.yamlValue(fm[k])}`)
    return `---\n${lines.join('\n')}\n---`
  }

  private yamlValue(val: unknown): string {
    if (typeof val === 'string') {
      // Quote strings containing special YAML chars
      return /[:#\[\]{},&*?|<>=!%@`]/.test(val) ? `"${val.replace(/"/g, '\\"')}"` : val
    }
    if (val instanceof Date) return val.toISOString()
    if (Array.isArray(val)) return `[${val.map(v => this.yamlValue(v)).join(', ')}]`
    return String(val)
  }

  private stripJsx(content: string): string {
    let out = content

    // Remove import statements: import Foo from '...'  /  import { Foo } from '...'
    out = out.replace(/^import\s+.*?['"].*?['"]\s*\n?/gm, '')

    // Remove export statements at line start (export const, export default, export { })
    out = out.replace(/^export\s+(?:default\s+)?(?:const|let|var|function|class)\s+[\s\S]*?(?=\n(?=[^{]|\n)|\n{2,})/gm, '')
    out = out.replace(/^export\s*\{[^}]*\}\s*(?:from\s+['"][^'"]*['"])?\s*\n?/gm, '')

    // Remove self-closing JSX tags: <Component ... />
    // Must not match HTML img/br/hr which are valid Markdown
    out = out.replace(/<([A-Z][A-Za-z0-9.]*)[^>]*\/>/g, '')

    // Remove JSX block tags: <Component ...>...</Component>
    // Greedy but bounded by matching closing tag
    out = out.replace(/<([A-Z][A-Za-z0-9.]*)[^>]*>[\s\S]*?<\/\1>/g, '')

    // Remove JSX expression blocks { expression } that span a whole line
    out = out.replace(/^\s*\{[^}]+\}\s*\n/gm, '')

    // Collapse multiple blank lines to two
    out = out.replace(/\n{3,}/g, '\n\n')

    return out.trim()
  }
}
