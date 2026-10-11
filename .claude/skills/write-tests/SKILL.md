---
name: write-tests
description: Write or update tests for cv-game following the project's testing conventions (unit / integration / e2e). Use whenever adding a feature, fixing a bug, changing server rules, or when asked to "add tests", "test this", "cover X" or "write a regression test".
---

# Write tests for cv-game

The full conventions are in `tests/README.md`. Read it first if you haven't this session.
This skill is the step-by-step workflow.

## 1. Understand what to protect

- Read the source file(s) under test **completely**, and note the public API.
- List the behaviours: the happy path, edge cases (bounds, 0, fractional grid positions),
  rejections, and side effects (callbacks, broadcasts).
- For a bug fix, the first test reproduces the bug and must **fail before the fix**.

## 2. Pick the level (lowest that can catch the bug)

| Code under test                       | Level / location                                                  |
| ------------------------------------- | ----------------------------------------------------------------- |
| Pure logic, config data               | `tests/unit/<mirror path>.test.ts` (Node)                         |
| Pixi class behaviour, keyboard        | `tests/unit/<mirror path>.test.ts` + happy-dom docblock           |
| `server/rooms/*`                      | `tests/integration/server/<Name>.test.ts`                         |
| `src/network/*` (talks to the server) | `tests/integration/network/<Name>.test.ts`                        |
| A whole visitor journey               | `tests/e2e/<journey>.spec.ts`, only if nothing lower can catch it |

## 3. Write it from the matching template

Reuse the helpers: `tests/helpers/builders.ts`, `keyboard.ts`, `colyseus.ts`, `pixi.ts`,
`tests/e2e/fixtures.ts`. If you need new test data more than once, add a builder.

### Unit (Pixi / DOM)

```ts
// @vitest-environment happy-dom      <- omit for pure logic
import { beforeEach, describe, expect, it } from "vitest";

import { Thing } from "../../../src/game/Thing";

describe("Thing", () => {
  let thing: Thing;

  beforeEach(() => {
    thing = new Thing();
  });

  it("does the expected thing in the normal case", () => {
    thing.act();

    expect(thing.state).toBe("done");
  });

  it.each([
    { input: 0, expected: false, label: "lower bound" },
    { input: 19, expected: true, label: "upper bound" },
  ])("handles the $label", ({ input, expected }) => {
    expect(thing.accepts(input)).toBe(expected);
  });
});
```

### Integration (Colyseus room)

```ts
import { describe, expect, it } from "vitest";

import type { CvRoom } from "../../../server/rooms/CvRoom";
import { useColyseusServer } from "../../helpers/colyseus";

describe("CvRoom <feature>", () => {
  const colyseus = useColyseusServer();

  async function joinRoom() {
    const room = await colyseus().createRoom<CvRoom>("cv", {});
    const client = await colyseus().connectTo(room); // initial state already synced
    const player = () => room.state.players.get(client.sessionId)!;
    return { room, client, player };
  }

  it("accepts a valid message", async () => {
    const { room, client, player } = await joinRoom();

    client.send("move", { column: 6, row: 5 });
    await room.waitForNextMessage();

    expect(player()).toMatchObject({ column: 6, row: 5 });
  });

  it("rejects an invalid message", async () => {
    /* same shape, state unchanged */
  });
});
```

### E2E

```ts
import { expect, openGame, test } from "./fixtures";

test("visitor can <journey>", async ({ page }) => {
  const console = await openGame(page);
  await console.waitForLog("[MULTIPLAYER] Connected");

  // ...interact with page.keyboard / page.mouse...

  expect(console.errors).toEqual([]);
});
```

## 4. Rules that are easy to forget

- Test names are behaviours: `"cannot walk into a blocked tile"`.
- Arrange / Act / Assert with blank lines between them. One behaviour per test.
- Never test private methods. Go through the public API or the server's messages.
- Every new server rule needs a **rejection** test, including malformed payloads.
- Never call `waitForInitialState()` after `connectTo()`: it can hang.
- No `setTimeout` sleeps in Vitest. Use `vi.waitFor`, fake timers or the Colyseus `waitFor*` helpers.
- Pixi/DOM import without the happy-dom docblock → `ReferenceError: window is not defined`.

## 5. Verify before reporting

1. Run just the new file: `npx vitest run <path>` (or `npx playwright test <path>`).
2. **Prove it can fail:** temporarily break the protected code (flip a condition, change a
   constant), confirm the new test fails, then restore the code exactly.
3. For integration tests, run 3 times to rule out flakiness.
4. Run `npm run check`, and `npm run test:coverage` if you touched `src/game` or `server/`.
5. Report the real numbers (tests added, pass/fail, coverage change) and any behaviour you
   found surprising or buggy. Don't silently "fix" the test to match a bug.
