---
name: commit
description: Commit (and, when asked, push) cv-game changes safely, with the same checks every time: scope, secrets, git identity, verification, docs and the message format. Use whenever asked to commit, push, "save the work" or open a PR.
---

# Commit and push

Commit only when the user asks. Push only when they ask for that too: a push publishes the
code (and, in a public repo, the owner's CV and contact details) and starts CI.

## 1. Look at what would go in

```bash
git status --short
git diff --stat            # tracked changes
git ls-files -o --exclude-standard   # new files
```

- Keep the commit to one change. Files that belong to something else stay out (ask if
  unsure). Never use `git add -A` blindly on a messy tree: add paths.
- Nothing generated or local: `node_modules/`, `dist/`, `build/`, `coverage/`,
  `test-results/`, `.env*`, `.claude/settings.local.json`, `CLAUDE.local.md`, editor folders.
  If one shows up, fix `.gitignore` instead of skipping it by hand.

## 2. Check for secrets and large files

```bash
git ls-files -o --exclude-standard -m | xargs grep -lInE "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][^'\"]{8,}"
git ls-files -o --exclude-standard -m | xargs du -k | sort -rn | head
```

- Any hit: stop and show the user. A secret pushed once stays in the history.
- Files over ~1 MB (besides `package-lock.json`) need a reason. The CV PDF (F-043) is
  expected; anything else, ask.
- `src/content/cv.ts`, `src/content/contact.ts` and the CV PDF are the owner's real data.
  They're meant to be shown, but say so before the first push to a public repo.

## 3. Check the git identity

```bash
git config user.name && git config user.email
```

If either is empty, stop. Don't invent one: ask the user to run
`! git config --global user.name "…"` and `user.email` (an address linked to their GitHub
account, or GitHub's `…@users.noreply.github.com` one to keep it private).

## 4. Verify

Run the `verify` skill at the "before a commit" depth: `npm run check`, `npm run test:all`
and `npm run build`, all green. For a docs-only commit, `npx prettier --check .` is enough.
Never commit with a failing check, and never use `--no-verify`.

## 5. Docs

Code changes need their docs in the same commit: run `update-docs` if `CHANGELOG.md`
`[Unreleased]` or `docs/FEATURES.md` don't cover the change yet.

## 6. Branch

- The very first commit goes on `main`.
- After that, ask whether to commit on `main` or on a branch (`feat/F-0xx-short-name`,
  `fix/short-name`, `docs/short-name`, `chore/short-name`) and open a PR.

## 7. Commit

Message: a short imperative subject (≤ 72 chars), the feature ID first when there is one,
then a blank line and a body saying what changed and why. End with the attribution trailer
from the session's instructions.

```bash
git add <paths>
git commit -F - <<'EOF'
F-043: add the CV PDF to the reward panel

A good pitch now offers the owner's CV as a download next to the LinkedIn link.

Co-Authored-By: …
EOF
```

If a pre-commit hook fails, fix the cause and make a **new** commit; never `--amend` a
commit that's already pushed.

## 8. Push (only when asked)

```bash
git remote -v                       # first push: git remote add origin https://github.com/B-Poignant/cv-game.git
git push -u origin <branch>
```

- Never force-push `main`. On a rejected push, `git pull --rebase` and re-run step 4.
- The first push opens a browser login (Git Credential Manager); `gh` isn't required.
- After pushing, tell the user CI has started (`.github/workflows/ci.yml`) and where to
  watch it: `https://github.com/B-Poignant/cv-game/actions`.

## 9. Report

The commit hash and subject, the branch, what was verified (real numbers), and whether it
was pushed. Name anything left out of the commit.
