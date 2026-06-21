"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/dashboard/routes/okf-route.ts
var okf_route_exports = {};
__export(okf_route_exports, {
  GET: () => GET
});
module.exports = __toCommonJS(okf_route_exports);
var import_server = require("next/server");
var import_path2 = __toESM(require("path"));

// src/core/mdx-reader.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_gray_matter = __toESM(require("gray-matter"));
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
      import_path.default.join(this.contentDir, `${resolved}.mdx`),
      import_path.default.join(this.contentDir, `${resolved}.md`),
      import_path.default.join(this.contentDir, resolved, "index.mdx"),
      import_path.default.join(this.contentDir, resolved, "index.md")
    ];
    for (const filePath of candidates) {
      if (import_fs.default.existsSync(filePath)) {
        return this.parseFile(slug, filePath);
      }
    }
    return null;
  }
  /** Read all MDX files recursively. */
  readAll() {
    if (!import_fs.default.existsSync(this.contentDir)) return [];
    return this.walkDir(this.contentDir, this.contentDir);
  }
  walkDir(dir, root) {
    const results = [];
    for (const entry of import_fs.default.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = import_path.default.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.walkDir(fullPath, root));
      } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
        const relative = import_path.default.relative(root, fullPath);
        const slug = relative.replace(/\.(mdx|md)$/, "").replace(/\/index$/, "");
        results.push(this.parseFile(slug, fullPath));
      }
    }
    return results;
  }
  parseFile(slug, filePath) {
    const raw = import_fs.default.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content: rawContent } = (0, import_gray_matter.default)(raw);
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
var reader = new MdxReader({ contentDir: import_path2.default.join(process.cwd(), process.env.TA_CONTENT_DIR ?? "content") });
async function GET(req, { params }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const allFiles = reader.readAll();
  const { path: pathSegments } = await params;
  const segments = pathSegments ?? [];
  if (segments.length === 0 || segments.length === 1 && (segments[0] === "index.md" || segments[0] === "index")) {
    return new import_server.NextResponse(generateOkfIndex(allFiles, baseUrl), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    });
  }
  const slug = segments.join("/").replace(/\.md$/, "");
  const file = allFiles.find((f) => f.slug === slug);
  if (!file) return new import_server.NextResponse("Not Found", { status: 404 });
  return new import_server.NextResponse(generateOkfPage(file, allFiles, baseUrl), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GET
});
//# sourceMappingURL=okf-route.js.map