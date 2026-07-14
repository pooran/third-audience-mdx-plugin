# Full Parity Check

## 1. Fetch latest reference

```
git -C reference fetch origin
git -C reference status -uno
```

Capture the current local HEAD sha *before* pulling (`git -C reference rev-parse HEAD`).

If already up to date with `origin/main`, skip to step 3 and note there are no
new commits (still worth a report if the checkpoint file predates the current
HEAD — i.e. first run).

Otherwise fast-forward only:
```
git -C reference pull origin main
```
Never `--rebase`, never `reset --hard`. If it can't fast-forward, stop and
tell the user — do not force anything.

## 2. Determine comparison range

Read the checkpoint file `.claude/skills/third-parity-check/.last-checked-sha`
if it exists.

- If it exists and is a valid commit in `reference`'s history: comparison
  range is `<checkpoint-sha>..<new-HEAD>`.
- If it doesn't exist: this is effectively a full rescan — follow
  `workflows/full-rescan.md` instead, then write the checkpoint at the end.

## 3. List what changed in reference

```
git -C reference log --oneline <checkpoint-sha>..HEAD
git -C reference diff --stat <checkpoint-sha>..HEAD
```

Read `reference/CHANGELOG.md` top entries covering this range for
human-readable feature/fix descriptions (the changelog is usually more
descriptive than commit subjects).

## 4. Compare against src/

For each commit/changelog entry in range, determine whether it represents:
- A new admin page / dashboard feature → check `src/dashboard/ui/pages/` and
  `src/dashboard/routes/` for an equivalent
- A detection/classification fix (bot UA, referrer, AI platform signal) →
  check `src/citations/` and `src/core/` (or wherever bot/citation detection
  logic lives — grep for the relevant keyword, e.g. platform name, header
  name, query param)
- A WordPress-hosting-specific fix (cron, save-hooks, security-plugin
  whitelisting, DB auto-repair) → likely **not applicable** to the Next.js
  package; note it as N/A with a one-line reason, don't chase a port

Use direct file reads and grep — do not guess. If the comparison spans many
files or is ambiguous, dispatch a general-purpose Agent to do the file
comparison and report back structured findings, the same way this was done
manually before this skill existed.

## 5. Produce the gap report

Structure, most important first:

```
## Parity Gap Report — reference@<short-sha> vs src (npm vX.Y.Z)

1. [MISSING|BUG|PARTIAL] <short title>
   <2-3 sentences: what reference does, what src does (or doesn't), file:line evidence>

2. ...

N. [OK] <things checked that already have parity — brief, one line each>
```

Flag anything that looks like an inherited bug (src has old/wrong logic that
reference already fixed) distinctly from purely-missing features — those are
higher priority since they're active incorrectness, not just a gap.

## 6. Update checkpoint

After reporting, write the new reference HEAD sha to
`.claude/skills/third-parity-check/.last-checked-sha` (create the file if
missing; this file should be gitignored — check `.gitignore` for an entry,
add one under a "local skill state" section if absent, do not commit the
checkpoint file itself).

## 7. Do not fix anything automatically

This workflow only reports. If the user wants gaps closed, that's a new,
separate task — ask what they'd like to prioritize.
