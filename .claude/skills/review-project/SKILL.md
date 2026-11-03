---
name: review-project
description: Review the whole cv-game codebase (not a diff) for bugs, security holes, broken conventions, weak tests and docs drift, slice by slice, and write one prioritised report. Use when asked to "review the project", "review everything", "audit the code", or before a release. Reports only; fixes come after, one by one.
---

# Review the whole project

`/code-review` reviews a diff and `project-auditor` checks the organisation (docs ↔ code,
conventions, Claude setup). This skill reviews the **existing code itself**, with the
project's own rules. It never fixes anything: it writes a report, the owner triages it, and
each accepted finding is fixed with `fix-bug` (or `new-feature` / `write-tests`).

## 1. Automated baseline (free, first)

```bash
npm run check          # typecheck + lint + format + unit + integration
npm run test:coverage  # coverage per folder vs the thresholds
npm audit --omit=dev   # runtime dependency advisories
```

Record the real numbers. Anything red here is a finding by itself; don't hand-review what a
tool already flags.

## 2. Review slice by slice

Read every source file of a slice in full, plus whatever it calls directly. Slices are cut by
risk, not only by folder. Do them in this order (highest risk first):

| #   | Slice                                                  | Look for first                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | `server/` + `shared/`                                  | Every client message typed `unknown` and validated (finite numbers, ranges, strings bounded); no throw on bad input; rules enforced server-side, not only on the client; rate limits / cooldowns; per-client state cleaned on leave; timers cleared on dispose; `shared/` free of `src/`, `server/`, DOM, Node and Pixi imports |
| B   | `src/network/`                                         | Game still playable when the server is down or drops (F-023); reconnect / leave paths; listeners unsubscribed; stale state after a reconnect; schema types imported with `import type` only                                                                                                                                     |
| C   | `src/game/` + `src/scenes/` + `src/game/minigames/`    | Pixi cleanup (`destroy()` removes listeners, ticker callbacks, timers); iso maths only through `IsometricConverter`; `zIndex` only in `updateDepth`; bounds via `isInsideGrid` / `isInsideMap`; no fields shadowing Pixi names; logic that should be Pixi-free and tested                                                       |
| D   | `src/ui/` + `src/cvPage/` + `src/content/` + `config/` | No `innerHTML` with CV or player text (and escaping in `cvPage/` string building); `[hidden]` vs `display` rules in `style.css`; focus back to the canvas; ARIA and keyboard access; theme colours not hard-coded, 4.5:1 label contrast                                                                                         |
| E   | `tests/`                                               | Tests assert behaviour, not implementation; each server rule has a rejection test; no sleeps / timing races in integration and e2e; no `.skip` / `.only`; helpers used instead of copy-paste                                                                                                                                    |

For every slice also check the general rules from `docs/CODE_STYLE.md`: no `any`, no `!` in
source, handled promises, no magic numbers in logic, files over ~200 lines doing two jobs.

## 3. Cross-cutting flows

Bugs that slice reviews miss live between slices. Follow each flow in
`docs/ARCHITECTURE.md` › "Data flow" end to end (client input → network → `CvRoom` → state →
client), at least: movement, catch + pitch, intel cards, spam, playing a minigame. Ask at each
hop: what if this message is forged, duplicated, late, or arrives after the player left?

## 4. Organisation

Run the `project-auditor` agent (docs drift, feature registry, conventions, Claude setup) and
merge its findings into the report rather than repeating its checks by hand.

## 5. Report

Write `docs/reviews/YYYY-MM-DD.md` (today's date):

```markdown
# Project review — YYYY-MM-DD

Baseline: check ✅ (N tests), coverage X% (thresholds met), npm audit: N advisories.

## 🔴 Bugs and security (wrong behaviour, exploitable)

- **[A] Short title** — `server/rooms/CvRoom.ts:123`. What's wrong, and a concrete failure
  scenario (inputs → result). _Fix:_ one line. _Skill:_ `fix-bug`.

## 🟠 Debts (works today, will bite)

## 🟡 Nice to have

## In good shape
```

Rules for findings:

- Cite `file:line` and give a **concrete failure scenario**. If you can't describe one, it's
  🟡 at most, or not a finding.
- Verify before writing: re-read the code, check that a guard isn't elsewhere (the server, a
  caller, a test). Drop what doesn't survive.
- Don't report what `docs/FEATURES.md` "Limits" or ARCHITECTURE.md "Known architectural
  debts" already list, unless it got worse. Point to them instead.
- One finding per root cause; list the other places with the same pattern under it.

End in chat with the counts per severity, the top 3 to fix first, and the report path. Don't
start fixing until the owner has picked findings.
