---
name: update-docs
description: Sync the project docs (docs/FEATURES.md, README.md, CHANGELOG.md, CLAUDE.md, tests/README.md) with the code after a feature or an important change. Use after finishing a feature, changing tooling/commands/structure/conventions, when the docs-reminder hook fires, or when asked to "update the docs/readme/changelog".
---

# Update the docs

The docs must describe the code **as it is now**. Change only what the code change affects,
keeping each doc's existing tone and format.

For a large change (several features, or a restructure), hand the work to the `docs-keeper`
agent so it doesn't fill the main conversation. For a small change, do it directly.

## 1. Find what changed

```bash
git status --short
git diff --stat
git diff -- src server package.json "*.config.ts"
git log --oneline -10    # once there are commits: what landed since the last doc update
```

Read the changed code itself, not just the diff, until you understand the behaviour.

## 2. Classify each change

| Kind                         | Examples                                       | Docs to touch                                                                            |
| ---------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **New feature**              | building opens a panel, new interaction        | `docs/FEATURES.md` (new or updated entry), README "Features"/"Status", CHANGELOG "Added" |
| **Feature changed**          | new rule, new limit, status 🚧→✅              | `docs/FEATURES.md` (status, "How it works", "Limits"), CHANGELOG "Changed"               |
| **Bug fix** visible to users | collision bug, crash                           | CHANGELOG "Fixed"; FEATURES "Limits" if it was listed there                              |
| **Feature removed**          |                                                | move the entry to FEATURES "Removed", CHANGELOG "Removed", README                        |
| **Command / script**         | new npm script, port change                    | README "Scripts"/"Getting started", CLAUDE.md "Commands"                                 |
| **Structure**                | new folder, file moved                         | README "Project structure", CLAUDE.md "Layout", FEATURES "Code" paths                    |
| **Test infrastructure**      | new helper, new level, threshold change        | `tests/README.md`, `.claude/skills/write-tests/SKILL.md`                                 |
| **Convention / gotcha**      | new rule for code, a trap discovered           | CLAUDE.md "Conventions"/"Gotchas"                                                        |
| **Design / story**           | new rule, changed loop, answered open question | `docs/GAME_DESIGN.md` (and the FEATURES entries it affects)                              |
| **Nothing to document**      | internal refactor, tests only, formatting      | none: say so in one line and stop                                                        |

## 3. Edit the docs

### `docs/FEATURES.md`

- New feature: take the next free ID in its area (never reuse one). Add a row to the summary
  table **and** a detail block with What / How it works / Code / Tests / Limits, using the
  same format as the existing entries.
- Status: ✅ only if the code **and** its tests exist. Implemented but untested →
  ✅ with "Tests: none (gap)", or 🚧 if it's incomplete.
- Keep every "Code" path and "Tests" path true. Check them with Glob.

### `CHANGELOG.md`

- Add bullets under `## [Unreleased]` in the right group (Added / Changed / Fixed / Removed).
  Create the group if it's missing.
- Write for a reader, not a commit log: "F-030: clicking a building opens its CV panel."
  Prefix with the feature ID when there is one.

### `README.md`

- Keep "Status", the "Features" summary, "Scripts" and "Project structure" in sync.
  The detailed feature list lives in FEATURES.md, so don't duplicate it.

### `CLAUDE.md` / `tests/README.md`

- Only when commands, layout, conventions or test infrastructure changed.

## 4. Finish

1. `npx prettier --write <the docs you edited>`
2. Report in a few lines which docs changed and why, plus anything noticed along the way:
   test gaps, docs that were already wrong, or code that contradicts the docs. Don't fix
   code from this skill; report it instead.
