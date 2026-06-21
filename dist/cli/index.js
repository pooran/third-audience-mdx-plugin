#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/cli/commands/init.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_readline = __toESM(require("readline"));
async function init() {
  const cwd = process.cwd();
  console.log("\n\u{1F3AF} third-audience-mdx setup\n");
  const pkgPath = import_path.default.join(cwd, "package.json");
  if (!import_fs.default.existsSync(pkgPath)) {
    console.error("No package.json found. Run this from your Next.js project root.");
    process.exit(1);
  }
  const pkg = JSON.parse(import_fs.default.readFileSync(pkgPath, "utf-8"));
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) {
    console.warn("\u26A0  next not found in package.json \u2014 make sure this is a Next.js project.");
  }
  const rl = import_readline.default.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q, def) => new Promise(
    (r) => rl.question(`${q} (${def}): `, (ans) => r(ans.trim() || def))
  );
  const contentDir = await ask("Content directory (where your .mdx files live)", "content");
  const dataDir = await ask("Data directory (for analytics logs)", "data");
  const secret = await ask("Dashboard secret (leave blank to disable auth in dev)", "");
  rl.close();
  const middlewarePath = import_path.default.join(cwd, "middleware.ts");
  if (!import_fs.default.existsSync(middlewarePath)) {
    import_fs.default.writeFileSync(middlewarePath, `export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'
export const config = { matcher: ['/((?!_next|api).*)'] }
`);
    console.log("\u2705 Created middleware.ts");
  } else {
    console.log("\u26A0  middleware.ts already exists \u2014 add thirdAudienceMiddleware manually.");
  }
  const envPath = import_path.default.join(cwd, ".env.local");
  const envLines = [`THIRD_AUDIENCE_SECRET=${secret}`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`];
  const envContent = envLines.join("\n") + "\n";
  if (!import_fs.default.existsSync(envPath)) {
    import_fs.default.writeFileSync(envPath, envContent);
    console.log("\u2705 Created .env.local");
  } else {
    import_fs.default.appendFileSync(envPath, "\n# Third Audience\n" + envContent);
    console.log("\u2705 Appended to .env.local");
  }
  import_fs.default.mkdirSync(import_path.default.join(cwd, dataDir, "ta-cache"), { recursive: true });
  const gitignorePath = import_path.default.join(cwd, ".gitignore");
  const gitignoreAdditions = `
# Third Audience analytics (local only)
${dataDir}/ta-visits.jsonl
${dataDir}/ta-citations.jsonl
${dataDir}/ta-cache/
`;
  if (import_fs.default.existsSync(gitignorePath)) {
    import_fs.default.appendFileSync(gitignorePath, gitignoreAdditions);
  } else {
    import_fs.default.writeFileSync(gitignorePath, gitignoreAdditions.trimStart());
  }
  console.log(`\u2705 Created ${dataDir}/ and updated .gitignore`);
  console.log(`
\u2705 Setup complete!

Next steps:
  1. Add to next.config.ts:
       import { withThirdAudience } from 'third-audience-mdx'
       export default withThirdAudience({ contentDir: '${contentDir}', dataDir: '${dataDir}' })

  2. Add API routes in app/api/third-audience/ (see docs)

  3. Visit /third-audience/ for your dashboard
`);
}

// src/cli/commands/health.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
async function health() {
  const cwd = process.cwd();
  const checks = [];
  const nodeVersion = process.versions.node;
  const [nodeMajor] = nodeVersion.split(".").map(Number);
  checks.push({ label: `Node.js ${nodeVersion}`, ok: nodeMajor >= 18, note: nodeMajor < 18 ? "requires Node 18+" : void 0 });
  const pkgPath = import_path2.default.join(cwd, "package.json");
  checks.push({ label: "package.json", ok: import_fs2.default.existsSync(pkgPath) });
  const nextPath = import_path2.default.join(cwd, "node_modules", "next");
  checks.push({ label: "next installed", ok: import_fs2.default.existsSync(nextPath) });
  const middlewarePath = import_path2.default.join(cwd, "middleware.ts");
  checks.push({ label: "middleware.ts", ok: import_fs2.default.existsSync(middlewarePath) });
  const contentDir = process.env.TA_CONTENT_DIR ?? "content";
  const contentPath = import_path2.default.join(cwd, contentDir);
  const contentExists = import_fs2.default.existsSync(contentPath);
  const mdxCount = contentExists ? countFiles(contentPath, [".mdx", ".md"]) : 0;
  checks.push({ label: `contentDir (${contentDir})`, ok: contentExists, note: contentExists ? `${mdxCount} MDX files` : "directory not found" });
  const dataDir = process.env.TA_DATA_DIR ?? "data";
  const dataPath = import_path2.default.join(cwd, dataDir);
  checks.push({ label: `dataDir (${dataDir})`, ok: import_fs2.default.existsSync(dataPath) });
  const visitsPath = import_path2.default.join(cwd, dataDir, "ta-visits.jsonl");
  const citationsPath = import_path2.default.join(cwd, dataDir, "ta-citations.jsonl");
  const visitLines = import_fs2.default.existsSync(visitsPath) ? countLines(visitsPath) : 0;
  const citationLines = import_fs2.default.existsSync(citationsPath) ? countLines(citationsPath) : 0;
  checks.push({ label: "ta-visits.jsonl", ok: true, note: `${visitLines} records` });
  checks.push({ label: "ta-citations.jsonl", ok: true, note: `${citationLines} records` });
  checks.push({ label: "THIRD_AUDIENCE_SECRET", ok: !!process.env.THIRD_AUDIENCE_SECRET, note: !process.env.THIRD_AUDIENCE_SECRET ? "not set (dashboard is open)" : "set" });
  console.log("\n\u{1F3E5} third-audience health check\n");
  for (const c of checks) {
    const icon = c.ok ? "\u2705" : "\u274C";
    const note = c.note ? `  (${c.note})` : "";
    console.log(`  ${icon}  ${c.label}${note}`);
  }
  console.log();
}
function countFiles(dir, exts) {
  let count = 0;
  for (const entry of import_fs2.default.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(import_path2.default.join(dir, entry.name), exts);
    else if (exts.some((e) => entry.name.endsWith(e))) count++;
  }
  return count;
}
function countLines(filePath) {
  return import_fs2.default.readFileSync(filePath, "utf-8").split("\n").filter(Boolean).length;
}

// src/cli/commands/export.ts
var import_fs3 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
async function exportData(args2) {
  const dataDir = process.env.TA_DATA_DIR ?? "data";
  const type = args2[0] ?? "visits";
  const outPath = args2[1] ?? `ta-${type}-export.csv`;
  const file = type === "citations" ? "ta-citations.jsonl" : "ta-visits.jsonl";
  const jsonlPath = import_path3.default.join(process.cwd(), dataDir, file);
  if (!import_fs3.default.existsSync(jsonlPath)) {
    console.error(`No data found at ${jsonlPath}`);
    process.exit(1);
  }
  const records = import_fs3.default.readFileSync(jsonlPath, "utf-8").split("\n").filter(Boolean).map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  }).filter(Boolean);
  if (records.length === 0) {
    console.log("No records to export.");
    return;
  }
  const headers = Object.keys(records[0]);
  const csv = [
    headers.join(","),
    ...records.map((r) => headers.map((h) => csvCell(r[h])).join(","))
  ].join("\n") + "\n";
  import_fs3.default.writeFileSync(outPath, csv);
  console.log(`\u2705 Exported ${records.length} records to ${outPath}`);
}
function csvCell(val) {
  if (val === null || val === void 0) return "";
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// src/cli/index.ts
var [, , command, ...args] = process.argv;
switch (command) {
  case "init":
    init().catch(console.error);
    break;
  case "health":
    health().catch(console.error);
    break;
  case "export":
    exportData(args).catch(console.error);
    break;
  default:
    console.log(`third-audience CLI

Commands:
  init      Set up third-audience-mdx in your Next.js project
  health    Show system health status
  export    Export analytics data as CSV

Usage: npx third-audience <command>`);
}
//# sourceMappingURL=index.js.map