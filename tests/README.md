# Testing conventions

Three levels, from fast and narrow to slow and broad. Write the **lowest level that can
catch the bug**.

| Level           | Folder               | Runner     | Environment                   | Speed | Command                    |
| --------------- | -------------------- | ---------- | ----------------------------- | ----- | -------------------------- |
| **Unit**        | `tests/unit/`        | Vitest     | Node (happy-dom when needed)  | ~1 s  | `npm run test:unit`        |
| **Integration** | `tests/integration/` | Vitest     | Node + real Colyseus server   | ~3 s  | `npm run test:integration` |
| **E2E**         | `tests/e2e/`         | Playwright | Real Chromium + Vite + server | ~10 s | `npm run test:e2e`         |

```bash
npm test               # unit + integration (part of `npm run check`)
npm run test:watch     # unit tests in watch mode while coding
npm run test:coverage  # unit + integration with coverage thresholds -> coverage/index.html
npm run test:e2e       # starts the server and Vite itself
npm run test:all       # everything, as CI does
npx vitest run tests/unit/game/Player.test.ts -t "diagonal"   # one file / one test
```

## Which level?

| You changed…                                          | Test with…                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Pure logic (grid maths, collisions, rules, config)    | **Unit**, Node environment                                                      |
| A Pixi class's behaviour (movement, camera, entities) | **Unit** with `// @vitest-environment happy-dom`                                |
| A server room, a message handler, a schema            | **Integration**: real server, real clients                                      |
| Client ↔ server networking code                       | **Integration**: real `MultiplayerClient` vs. real server                       |
| Scene wiring (`MainScene`)                            | **Unit** with happy-dom, network faked with `vi.mock` (see `MainScene.test.ts`) |
| A full user journey                                   | **E2E**, sparingly                                                              |
| Pure rendering (colours, shapes, layout)              | Nothing automated: check it by eye with `npm run dev`                           |

## File layout and naming

- Tests mirror the source tree: `src/game/Player.ts` → `tests/unit/game/Player.test.ts`,
  `shared/world.ts` → `tests/unit/shared/world.test.ts`,
  `server/rooms/CvRoom.ts` → `tests/integration/server/CvRoom.test.ts`.
- Vitest files end in `.test.ts`. Playwright files end in `.spec.ts`, so neither runner
  picks up the other's files.
- Shared helpers live in `tests/helpers/` (Vitest) and `tests/e2e/fixtures.ts` (Playwright).

## Writing a test

- **One behaviour per test.** Name it as a sentence about behaviour, not implementation:
  `"cannot walk into a blocked tile"`, not `"test canWalkTo returns false"`.
- **Arrange / Act / Assert**, separated by blank lines.
- **Test through the public API.** Never call private methods or cast to reach them.
  If something is hard to test from outside, the design probably needs to change.
- **Tables over copy-paste:** use `it.each([...])` with named object rows and `$field` in
  the title for input variations (see `IsometricConverter.test.ts`).
- **Test data builders** from `tests/helpers/builders.ts`: start from valid defaults and
  override only what the test is about (`aBuildingDefinition({ width: 4 })`).
- **Name the magic numbers:** `const STEP = 3 / 60` beats `0.05`.
- **No real timers, no sleeps** in Vitest. Use `vi.waitFor` / `vi.useFakeTimers()`, or
  Colyseus's `room.waitForNextMessage()` / `waitForNextPatch()`.
- **Mocks only at boundaries** (the renderer, network failures, `console`). Prefer a real
  collaborator or a tiny fake object (`{ width, height } as Renderer`) over `vi.mock`.
  Mocks, stubs and spies are restored automatically after each test.
- Silence expected console output with
  `vi.spyOn(console, "error").mockImplementation(() => {})`, then assert it was called.

## Unit tests

- Default environment is **Node**. Any file that imports Pixi or touches `window` must start
  with `// @vitest-environment happy-dom`.
- Keyboard input: `pressKey("ArrowRight")` / `releaseKey(...)` from `tests/helpers/keyboard.ts`.
- Colours a Pixi `Graphics` was drawn with: `drawnColours(graphics)` from `tests/helpers/pixi.ts`.

## Integration tests

- Call `const colyseus = useColyseusServer()` at the top of the `describe`. It boots the real
  server once per file on a per-worker port and disposes rooms after every test.
- `colyseus().createRoom<CvRoom>("cv", {})` then `colyseus().connectTo(room)`. `connectTo`
  already waits for the initial state, so **don't** call `waitForInitialState()` after it:
  it waits for the _next_ change and can hang.
- After `client.send(...)`, `await room.waitForNextMessage()` before asserting server state.
  To check what _other clients_ see, `await otherClient.waitForNextPatch()`.
- **Every server rule gets a rejection test**, including malformed payloads (NaN, strings,
  missing fields). The server is authoritative, so assume clients can be modified to cheat.
- To isolate one rule, arrange the state directly on the server (`player().column = 0`).
- `useColyseusServer` stubs `SPAM_FLIES=false` before each test, so no spam email (F-063) hits a
  visitor by surprise. A spam test turns it on with `vi.stubEnv("SPAM_FLIES", "true")`.

## E2E tests

- `openGame(page, identity?)` goes past the arrival panel (F-012), with the given name and
  company or the random default, and returns a `ConsoleRecorder`. The game is a canvas, so the `[MULTIPLAYER]`,
  `[REMOTE]` and `[DEV]` console logs are how we observe it. **Renaming those log messages breaks
  E2E tests.**
- Every E2E test asserts `console.errors` is empty.
- The e2e server runs with `DEV_WANDERS=false` and `SPAM_FLIES=false` (`playwright.config.ts`):
  the dev stands still and no spam email flies, so screenshot comparisons only change when a
  visitor moves.
- Use the `newVisitor()` fixture for each extra visitor: it opens a page in its own browser
  context and closes it after the test, even a failed one.
- E2E runs with one worker (`playwright.config.ts`): every spec shares one server and room,
  so tests in parallel see each other's visitors and can fill the room.
- E2E starts its own server and Vite on dedicated ports (2577 and 5183) and never reuses
  a running one, so `npm run dev` / `npm run server` can stay up and old code is never
  tested. If a run says a port is already used, an interrupted run left a server behind:
  stop it.
- To open a building, use `buildingButton(page, "SKILLS")` from `fixtures.ts`: Tab puts a real
  button over each building. Press Enter on it, or click the canvas at its bounding box.
- happy-dom doesn't apply CSS, so check layout (visibility, sizes, scrolling) in E2E.
- Keep E2E for journeys only: a few tests, not one per feature.

## Coverage

Thresholds in `vitest.config.ts` are **floors**: CI fails below them. Raise them when coverage
improves; never lower them to make a change pass. Only `Game.ts` (needs real WebGL) is left to E2E; the
placeholder scenes still count towards coverage.

## Checking a test is useful

A test that can't fail is worse than none. After writing one, break the code it protects
(flip a condition, change a constant), confirm the test fails with a clear message, then
restore the code.
