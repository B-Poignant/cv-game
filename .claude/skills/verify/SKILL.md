---
name: verify
description: Run cv-game's full verification and report the real results before saying a task is done. Use at the end of any code change, before a commit or release, or when asked to "check", "verify", "make sure it works" or "run the tests".
---

# Verify a change

Other skills (`new-feature`, `fix-bug`, `write-tests`, `release`) end with this one.

## 1. Pick the depth

| Change                                                | Run                                        |
| ----------------------------------------------------- | ------------------------------------------ |
| Docs / Markdown only                                  | `npx prettier --check .`                   |
| Logic in `src/` or `server/`                          | `npm run check`                            |
| Visible in the game, networking, scenes, `index.html` | `npm run check` **and** `npm run test:e2e` |
| `src/game/**` or `server/**` coverage might drop      | add `npm run test:coverage`                |
| Before a commit/release, or dependencies changed      | `npm run test:all` and `npm run build`     |

## 2. Run it

```bash
npm run check          # typecheck + lint + format:check + unit + integration
npm run test:e2e       # Playwright starts the server and Vite itself (ports 2567, 5173)
npm run test:coverage  # fails if below the thresholds in vitest.config.ts
npm run build          # production build (tsc + vite)
```

If formatting fails, run `npm run format` and re-check. Don't hand-format.

## 3. When something fails

- Read the actual error. Fix the cause, not the symptom.
- **Never** weaken a test, lower a coverage threshold, add `// @ts-ignore` / `eslint-disable`,
  or use `.skip` to get green. If a test looks wrong, say so and explain why.
- A failure that passes on re-run is flaky. Run that file 3–5 times
  (`npx vitest run <file>`), find the race, and report it. Don't ignore it.
- E2E port already in use: a dev server is probably running. Local runs reuse it
  (`reuseExistingServer`), but a stale `npm run server` from old code gives misleading results.

## 4. Report

State the outcome plainly, with the real numbers: "check ✅ (94 tests), e2e ✅ (3), coverage
54% (thresholds met)". Name anything you skipped and why. Never claim a check passed if you
didn't run it.
