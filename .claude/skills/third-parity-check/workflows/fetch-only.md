# Fetch Only

1. Run:
   ```
   git -C reference fetch origin
   git -C reference status -uno
   ```
2. If already up to date, tell the user and stop.
3. If behind, fast-forward pull (never force, never rebase):
   ```
   git -C reference pull origin main
   ```
4. Show the new commits:
   ```
   git -C reference log --oneline <old-sha>..<new-sha>
   ```
   (get `<old-sha>` from the `status -uno` output before pulling, or from
   `git -C reference reflog -1` immediately after if not captured)
5. Report the commit list to the user, one line per commit, in plain language
   (translate terse commit subjects into what changed, similar to how you'd
   summarize a changelog entry). Do not run the full comparison — that's a
   separate workflow.
