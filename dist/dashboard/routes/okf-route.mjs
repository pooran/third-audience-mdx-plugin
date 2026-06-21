// src/dashboard/routes/okf-route.ts
import { NextResponse } from "next/server";
import path2 from "path";

// src/core/mdx-reader.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
var MdxReader = class {
  constructor(options) {
    this.contentDir = options.contentDir;
    this.stripSegments = options.stripSegments ?? [];
  }
  /**
   * Remove configured URL-only segments from a slug so it maps to the file
   * layout. e.g. stripSegments ['learn'] turns 'en/learn/hydroponics/x' into
   * 'en/hydroponics/x'. Only whole path segments are removed.
   */
  applyStrip(slug) {
    if (this.stripSegments.length === 0) return slug;
    const drop = new Set(this.stripSegments);
    return slug.split("/").filter((seg) => !drop.has(seg)).join("/");
  }
  /** Read a single MDX file by slug. Returns null if not found. */
  read(slug) {
    const resolved = this.applyStrip(slug);
    const candidates = [
      path.join(this.contentDir, `${resolved}.mdx`),
      path.join(this.contentDir, `${resolved}.md`),
      path.join(this.contentDir, resolved, "index.mdx"),
      path.join(this.contentDir, resolved, "index.md")
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        return this.parseFile(slug, filePath);
      }
    }
    return null;
  }
  /** Read all MDX files recursively. */
  readAll() {
    if (!fs.existsSync(this.contentDir)) return [];
    return this.walkDir(this.contentDir, this.contentDir);
  }
  walkDir(dir, root) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.walkDir(fullPath, root));
      } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
        const relative = path.relative(root, fullPath);
        const slug = relative.replace(/\.(mdx|md)$/, "").replace(/\/index$/, "");
        results.push(this.parseFile(slug, fullPath));
      }
    }
    return results;
  }
  parseFile(slug, filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content: rawContent } = matter(raw);
    return { slug, filePath, frontmatter, rawContent };
  }
};

// src/core/markdown-renderer.ts
var MarkdownRenderer = class {
  render(file) {
    const header = this.buildFrontmatterHeader(file.frontmatter);
    const body = this.stripJsx(file.rawContent);
    return header ? `${header}

${body}` : body;
  }
  buildFrontmatterHeader(fm) {
    const keys = Object.keys(fm);
    if (keys.length === 0) return "";
    const lines = keys.filter((k) => fm[k] !== void 0 && fm[k] !== null).map((k) => `${k}: ${this.yamlValue(fm[k])}`);
    return `---
${lines.join("\n")}
---`;
  }
  yamlValue(val) {
    if (typeof val === "string") {
      return /[:#\[\]{},&*?|<>=!%@`]/.test(val) ? `"${val.replace(/"/g, '\\"')}"` : val;
    }
    if (val instanceof Date) return val.toISOString();
    if (Array.isArray(val)) return `[${val.map((v) => this.yamlValue(v)).join(", ")}]`;
    return String(val);
  }
  stripJsx(content) {
    let out = content;
    out = out.replace(/^import\s+.*?['"].*?['"]\s*\n?/gm, "");
    out = out.replace(/^export\s+(?:default\s+)?(?:const|let|var|function|class)\s+[\s\S]*?(?=\n(?=[^{]|\n)|\n{2,})/gm, "");
    out = out.replace(/^export\s*\{[^}]*\}\s*(?:from\s+['"][^'"]*['"])?\s*\n?/gm, "");
    out = out.replace(/<([A-Z][A-Za-z0-9.]*)[^>]*\/>/g, "");
    out = out.replace(/<([A-Z][A-Za-z0-9.]*)[^>]*>[\s\S]*?<\/\1>/g, "");
    out = out.replace(/^\s*\{[^}]+\}\s*\n/gm, "");
    out = out.replace(/\n{3,}/g, "\n\n");
    return out.trim();
  }
};

// src/okf/okf-bundle.ts
var renderer = new MarkdownRenderer();
function generateOkfIndex(files, baseUrl) {
  const base = baseUrl.replace(/\/$/, "");
  const lines = [
    "# Open Knowledge Format (OKF) Bundle",
    "",
    "This bundle contains all content as clean Markdown files for AI consumption.",
    "",
    "## Contents",
    ""
  ];
  for (const file of files) {
    const fm = file.frontmatter;
    const title = String(fm.title ?? file.slug);
    const desc = fm.description ? ` \u2014 ${String(fm.description)}` : "";
    lines.push(`- [${title}](${base}/okf/${file.slug}.md)${desc}`);
  }
  return lines.join("\n") + "\n";
}
function generateOkfPage(file, allFiles, baseUrl) {
  const markdown = renderer.render(file);
  return rewriteInternalLinks(markdown, allFiles, baseUrl);
}
function rewriteInternalLinks(markdown, allFiles, baseUrl) {
  const slugSet = new Set(allFiles.map((f) => f.slug));
  const base = baseUrl.replace(/\/$/, "");
  return markdown.replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, (match, text, href) => {
    const candidate = href.replace(/^\//, "").replace(/\.md$/, "");
    if (slugSet.has(candidate)) {
      return `[${text}](${base}/okf/${candidate}.md)`;
    }
    return match;
  });
}

// src/dashboard/routes/okf-route.ts
var reader = new MdxReader({ contentDir: path2.join(process.cwd(), process.env.TA_CONTENT_DIR ?? "content") });
async function GET(req, { params }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const allFiles = reader.readAll();
  const { path: pathSegments } = await params;
  const segments = pathSegments ?? [];
  if (segments.length === 0 || segments.length === 1 && (segments[0] === "index.md" || segments[0] === "index")) {
    return new NextResponse(generateOkfIndex(allFiles, baseUrl), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    });
  }
  const slug = segments.join("/").replace(/\.md$/, "");
  const file = allFiles.find((f) => f.slug === slug);
  if (!file) return new NextResponse("Not Found", { status: 404 });
  return new NextResponse(generateOkfPage(file, allFiles, baseUrl), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}
export {
  GET
};
//# sourceMappingURL=okf-route.mjs.map