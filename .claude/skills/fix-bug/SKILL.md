---
name: fix-bug
description: Fix a bug in cv-game the reliable way, by reproducing it with a failing test first. Use when something is broken, wrong, crashes, desyncs, or when asked to "fix", "debug" or "investigate" a problem.
---

# Fix a bug

## 1. Reproduce and understand

- Get the exact symptom: what was expected, what happened, the steps, and any console output.
- Find the root cause by reading the code path end to end. For multiplayer bugs, follow
  client → `MultiplayerClient` → `CvRoom` → state sync → `RemotePlayersManager`.
- Check `docs/FEATURES.md`: the "Limits" of the feature may already describe this
  behaviour. A known limitation is a missing feature, not a bug, so use `new-feature`.
- If the cause is uncertain, say what you know and what you're assuming before you change code.

## 2. Write the failing regression test first

Follow the `write-tests` skill to pick the level. Name the test after the correct behaviour
("cannot walk into a blocked tile"), not after the bug. Run it and **confirm it fails for the
right reason**. If you can't reproduce the bug in a test, explain why before going further.

## 3. Fix the cause

- Make the smallest change that fixes the root cause. Don't refactor nearby code in the same change.
- If the bug is in a client-side rule, check whether the server enforces it too (and the reverse).
- The bug might also exist elsewhere (same pattern copied). Search for it with Grep and mention it.

## 4. Verify

- The new test passes, and so does everything else: run the `verify` skill.
- Add e2e if the bug could only be seen in the real game.

## 5. Document

Run `update-docs`. That means a CHANGELOG "Fixed" entry (with the feature ID if there is one),
and updated FEATURES "Limits" if the bug was listed there. Add a CLAUDE.md "Gotchas" line if
the bug came from a trap someone could fall into again (as with Pixi's `width`/`height`).
