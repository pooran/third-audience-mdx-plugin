import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface MdxFile {
  slug: string       // relative path without extension, e.g. 'blog/my-post'
  filePath: string   // absolute path to .mdx file
  frontmatter: Record<string, unknown>
  rawContent: string // body after frontmatter
}

export interface MdxReaderOptions {
  contentDir: string // absolute path to content directory
}

export class MdxReader {
  private contentDir: string

  constructor(options: MdxReaderOptions) {
    this.contentDir = options.contentDir
  }

  /** Read a single MDX file by slug. Returns null if not found. */
  read(slug: string): MdxFile | null {
    const candidates = [
      path.join(this.contentDir, `${slug}.mdx`),
      path.join(this.contentDir, `${slug}.md`),
      path.join(this.contentDir, slug, 'index.mdx'),
      path.join(this.contentDir, slug, 'index.md'),
    ]

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        return this.parseFile(slug, filePath)
      }
    }

    return null
  }

  /** Read all MDX files recursively. */
  readAll(): MdxFile[] {
    if (!fs.existsSync(this.contentDir)) return []
    return this.walkDir(this.contentDir, this.contentDir)
  }

  private walkDir(dir: string, root: string): MdxFile[] {
    const results: MdxFile[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...this.walkDir(fullPath, root))
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        const relative = path.relative(root, fullPath)
        const slug = relative.replace(/\.(mdx|md)$/, '').replace(/\/index$/, '')
        results.push(this.parseFile(slug, fullPath))
      }
    }
    return results
  }

  private parseFile(slug: string, filePath: string): MdxFile {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content: rawContent } = matter(raw)
    return { slug, filePath, frontmatter, rawContent }
  }
}
