---
name: new-feature
description: Start, build and finish a cv-game feature end to end, keeping docs/FEATURES.md as the source of truth. Use when asked to add/implement/build a feature, to pick up a planned (📋) feature, or to record a new feature idea.
---

# New feature workflow

`docs/FEATURES.md` lists every feature with its status. A feature moves through
💡 Idea → 📋 Planned → 🚧 In progress → ✅ Done, and this skill handles every step.

## Just recording an idea?

Add it to `docs/FEATURES.md` with the next free ID in its area (never reuse one): a summary
row plus a short detail block (What / To do), with status 💡 or 📋. Don't write code. Done.

## 1. Register it

- Look in `docs/FEATURES.md` for an existing entry (planned or partial). Reuse its ID.
- Otherwise create one with the next free ID in its area.
- Set the status to 🚧.

## 2. Agree the scope

- Read `docs/GAME_DESIGN.md` and the section the entry's "Design" line points to. Check that
  the feature fits the story, rules and tone. If it doesn't, raise it before coding.
- Read the code the feature touches and the entry's "Existing pieces" / "To do".
- Check `CLAUDE.md` conventions. In particular: the server is authoritative, logic stays
  out of Pixi so it can be tested, and grid positions go through `IsometricConverter`.
- If the scope or approach is ambiguous, ask the user before coding. For anything bigger than
  a small change, propose a short plan first.

## 3. Build it

- Keep changes scoped to the feature.
- Put new rules on the server too if they affect what players can do.

## 4. Test it

Follow the `write-tests` skill (`.claude/skills/write-tests/SKILL.md`): pick the lowest level
that catches the bug, and add rejection tests for server rules. Prove the tests can fail.

## 5. Verify

Run the `verify` skill. It chooses `npm run check` and/or `npm run test:e2e` depending on
the change, and you report the real results.

## 6. Document it

Run the `update-docs` skill:

- The entry becomes ✅ (or stays 🚧 with "To do" updated if partial).
- Update "How it works", "Code", "Tests" and "Limits".
- Add a CHANGELOG `[Unreleased]` entry with the feature ID.
- Update the README summary if visitors would notice the change.

Don't commit unless the user asks.
