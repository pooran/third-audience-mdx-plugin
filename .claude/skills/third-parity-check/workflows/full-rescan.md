# Full Rescan

Use when there's no checkpoint file, or the user explicitly wants a from-scratch
comparison instead of an incremental diff.

## 1. Fetch latest reference (same as full-parity-check step 1)

```
git -C reference fetch origin
git -C reference status -uno
git -C reference pull origin main   # only if behind, fast-forward only
```

## 2. Inventory both sides

**Reference (WordPress plugin):**
- Read `reference/CHANGELOG.md` in full for complete feature history
- Read `reference/admin/class-ta-admin.php` for the registered admin page/menu list
- List `reference/admin/views/*.php` and `reference/includes/*.php`

**src (npm package):**
- List `src/dashboard/ui/pages/*.tsx`
- List `src/dashboard/routes/*.ts`
- List `src/core/` and `src/citations/` (or wherever detection logic lives)

## 3. Dispatch a comparison agent

This is a lot of ground to cover — dispatch a `general-purpose` Agent with:
- Both directory paths
- The known feature inventory bootstrap: dashboard pages, detection/classification
  logic (bot UA parsing, referrer/platform detection, query-param signals like
  `udm=`, `srsltid`), content delivery (OKF, llms.txt, sitemap-ai, markdown
  serving), notifications (email digest), competitor benchmarking, cache
  browser, settings/health pages
- Instruction to read `reference/CHANGELOG.md` fully, cross-reference every
  WP feature against an npm equivalent, and flag: MISSING, BUG (npm has stale/
  wrong logic that WP already fixed), PARTIAL, OK
- Read-only — no file modifications
- Report back under 600 words, prioritized, with file:line evidence

## 4. Produce the gap report

Same format as `full-parity-check.md` step 5.

## 5. Write the checkpoint

Write current `reference` HEAD sha to
`.claude/skills/third-parity-check/.last-checked-sha` so future runs can use
the faster incremental `full-parity-check` workflow.
