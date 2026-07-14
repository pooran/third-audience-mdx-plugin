---
name: third-parity-check
description: Use to check feature/bugfix parity between the third-audience-mdx npm package (src/) and the WordPress reference plugin (reference/). Fetches latest reference commits, diffs against the last recorded checkpoint, and produces a prioritized gap report.
---

<essential_principles>
## How This Skill Works

Two related codebases live in this repo:

- `src/` — the npm package `third-audience-mdx` (Next.js/TypeScript port)
- `reference/` — a separate git repo (submodule-style checkout) of the original
  WordPress plugin, source of truth for feature/bugfix history. Remote:
  `https://github.com/spcaeo/third-audience-wordpress-plugin`

The WordPress plugin is under active development. Its `CHANGELOG.md` and git
log are the canonical record of features and bugfixes. This skill's job is to
notice when `reference/` has moved and tell you what, if anything, `src/`
needs to catch up on.

### Checkpoint file
The last-compared commit SHA is stored in
`.claude/skills/third-parity-check/.last-checked-sha` (gitignored — local
state only, not shared across machines). If missing, compare against the
full `CHANGELOG.md` instead of a commit range.

### This is read-only analysis
Never modify `reference/` beyond `git fetch`/`git pull` (fast-forward only —
never rebase/reset). Never modify `src/` as part of this skill — it only
reports gaps. Fixing gaps is a separate, explicit task the user asks for
after reviewing the report.

### Project rules apply
No database changes. No mock data. Stay inside this project folder.
</essential_principles>

<intake>
What would you like to do?

1. **Full parity check** (default) — fetch latest reference, diff since last checkpoint, produce gap report
2. **Fetch only** — just pull the reference repo and show what commits landed, no comparison
3. **Full rescan** — ignore the checkpoint, do a complete feature-by-feature comparison from scratch (slower, more thorough — use after a long gap or if the checkpoint looks stale)

**Wait for response, or proceed with option 1 if invoked from `/parity-check` with no arguments.**
</intake>

<routing>
| Response | Workflow |
|----------|----------|
| 1, "full", "check", default | `workflows/full-parity-check.md` |
| 2, "fetch", "pull", "latest" | `workflows/fetch-only.md` |
| 3, "rescan", "full rescan", "from scratch" | `workflows/full-rescan.md` |

**After reading the workflow, follow it exactly.**
</routing>
