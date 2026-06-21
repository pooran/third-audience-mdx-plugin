// src/dashboard/routes/sitemap-ai-route.ts
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

// src/discovery/sitemap-ai.ts
function generateAiSitemap(files, baseUrl) {
  const base = baseUrl.replace(/\/$/, "");
  const urls = files.map((file) => {
    const fm = file.frontmatter;
    const loc = `${base}/${file.slug}`;
    const lastmod = fm.date ? new Date(fm.date).toISOString().slice(0, 10) : "";
    const title = fm.title ? `
    <title>${escapeXml(String(fm.title))}</title>` : "";
    const desc = fm.description ? `
    <description>${escapeXml(String(fm.description))}</description>` : "";
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
      `    <changefreq>weekly</changefreq>`,
      title,
      desc,
      "  </url>"
    ].filter(Boolean).join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>"
  ].join("\n") + "\n";
}
function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// src/dashboard/routes/sitemap-ai-route.ts
var reader = new MdxReader({ contentDir: path2.join(process.cwd(), process.env.TA_CONTENT_DIR ?? "content") });
async function GET(req) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const files = reader.readAll();
  const content = generateAiSitemap(files, baseUrl);
  return new NextResponse(content, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
export {
  GET
};
//# sourceMappingURL=sitemap-ai-route.mjs.map