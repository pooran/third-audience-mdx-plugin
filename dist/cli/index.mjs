#!/usr/bin/env node

// src/cli/commands/init.ts
import fs from "fs";
import path from "path";
import readline from "readline";
async function init() {
  const cwd = process.cwd();
  console.log("\n\u{1F3AF} third-audience-mdx setup\n");
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    console.error("No package.json found. Run this from your Next.js project root.");
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) {
    console.warn("\u26A0  next not found in package.json \u2014 make sure this is a Next.js project.");
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q, def) => new Promise(
    (r) => rl.question(`${q} (${def}): `, (ans) => r(ans.trim() || def))
  );
  const contentDir = await ask("Content directory (where your .mdx files live)", "content");
  const dataDir = await ask("Data directory (for analytics logs)", "data");
  const secret = await ask("Dashboard secret (leave blank to disable auth in dev)", "");
  rl.close();
  const middlewarePath = path.join(cwd, "middleware.ts");
  if (!fs.existsSync(middlewarePath)) {
    fs.writeFileSync(middlewarePath, `export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'
export const config = { matcher: ['/((?!_next|api).*)'] }
`);
    console.log("\u2705 Created middleware.ts");
  } else {
    console.log("\u26A0  middleware.ts already exists \u2014 add thirdAudienceMiddleware manually.");
  }
  const envPath = path.join(cwd, ".env.local");
  const envLines = [`THIRD_AUDIENCE_SECRET=${secret}`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`];
  const envContent = envLines.join("\n") + "\n";
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log("\u2705 Created .env.local");
  } else {
    fs.appendFileSync(envPath, "\n# Third Audience\n" + envContent);
    console.log("\u2705 Appended to .env.local");
  }
  fs.mkdirSync(path.join(cwd, dataDir, "ta-cache"), { recursive: true });
  const gitignorePath = path.join(cwd, ".gitignore");
  const gitignoreAdditions = `
# Third Audience analytics (local only)
${dataDir}/ta-visits.jsonl
${dataDir}/ta-citations.jsonl
${dataDir}/ta-cache/
`;
  if (fs.existsSync(gitignorePath)) {
    fs.appendFileSync(gitignorePath, gitignoreAdditions);
  } else {
    fs.writeFileSync(gitignorePath, gitignoreAdditions.trimStart());
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
import fs2 from "fs";
import path2 from "path";
async function health() {
  const cwd = process.cwd();
  const checks = [];
  const nodeVersion = process.versions.node;
  const [nodeMajor] = nodeVersion.split(".").map(Number);
  checks.push({ label: `Node.js ${nodeVersion}`, ok: nodeMajor >= 18, note: nodeMajor < 18 ? "requires Node 18+" : void 0 });
  const pkgPath = path2.join(cwd, "package.json");
  checks.push({ label: "package.json", ok: fs2.existsSync(pkgPath) });
  const nextPath = path2.join(cwd, "node_modules", "next");
  checks.push({ label: "next installed", ok: fs2.existsSync(nextPath) });
  const middlewarePath = path2.join(cwd, "middleware.ts");
  checks.push({ label: "middleware.ts", ok: fs2.existsSync(middlewarePath) });
  const contentDir = process.env.TA_CONTENT_DIR ?? "content";
  const contentPath = path2.join(cwd, contentDir);
  const contentExists = fs2.existsSync(contentPath);
  const mdxCount = contentExists ? countFiles(contentPath, [".mdx", ".md"]) : 0;
  checks.push({ label: `contentDir (${contentDir})`, ok: contentExists, note: contentExists ? `${mdxCount} MDX files` : "directory not found" });
  const dataDir = process.env.TA_DATA_DIR ?? "data";
  const dataPath = path2.join(cwd, dataDir);
  checks.push({ label: `dataDir (${dataDir})`, ok: fs2.existsSync(dataPath) });
  const visitsPath = path2.join(cwd, dataDir, "ta-visits.jsonl");
  const citationsPath = path2.join(cwd, dataDir, "ta-citations.jsonl");
  const visitLines = fs2.existsSync(visitsPath) ? countLines(visitsPath) : 0;
  const citationLines = fs2.existsSync(citationsPath) ? countLines(citationsPath) : 0;
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
  for (const entry of fs2.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(path2.join(dir, entry.name), exts);
    else if (exts.some((e) => entry.name.endsWith(e))) count++;
  }
  return count;
}
function countLines(filePath) {
  return fs2.readFileSync(filePath, "utf-8").split("\n").filter(Boolean).length;
}

// src/cli/commands/export.ts
import fs3 from "fs";
import path3 from "path";
async function exportData(args2) {
  const dataDir = process.env.TA_DATA_DIR ?? "data";
  const type = args2[0] ?? "visits";
  const outPath = args2[1] ?? `ta-${type}-export.csv`;
  const file = type === "citations" ? "ta-citations.jsonl" : "ta-visits.jsonl";
  const jsonlPath = path3.join(process.cwd(), dataDir, file);
  if (!fs3.existsSync(jsonlPath)) {
    console.error(`No data found at ${jsonlPath}`);
    process.exit(1);
  }
  const records = fs3.readFileSync(jsonlPath, "utf-8").split("\n").filter(Boolean).map((l) => {
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
  fs3.writeFileSync(outPath, csv);
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
//# sourceMappingURL=index.mjs.map