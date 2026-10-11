# Code style

How to write code in cv-game so it stays readable as it grows. The layout and data flow are in
[ARCHITECTURE.md](ARCHITECTURE.md), and tests in [tests/README.md](../tests/README.md).

**Prettier** handles formatting (`npm run format`) and **ESLint** handles most of the rules
below (`npm run lint`, `typescript-eslint` `strictTypeChecked`). The rest is checked in
review. When a rule here and the tools disagree, fix this file.

## Naming

| Kind                               | Style                                    | Example                                 |
| ---------------------------------- | ---------------------------------------- | --------------------------------------- |
| Classes, types, files with a class | `PascalCase`, file named after the class | `RemotePlayer` in `RemotePlayer.ts`     |
| Files of functions / data          | `camelCase`                              | `cvSections.ts`, `themes.ts`            |
| Functions, variables               | `camelCase`, functions start with a verb | `createWorldCollisions`, `isWalkable`   |
| Booleans                           | `is` / `has` / `can` prefix              | `isConnected()`, `canWalkTo()`          |
| Module-level constants             | `UPPER_SNAKE_CASE`                       | `MAP_SIZE`, `PLAYER_SPAWN`, `BUILDINGS` |
| Feature references                 | the ID from FEATURES.md in a comment     | `// F-023`                              |

- **Say which unit a value is in** when it could be ambiguous: `gridPosition` (tiles) vs
  `screenPosition` (pixels), `gridWidth` (tiles) vs `width` (Pixi pixels).
- **Don't reuse Pixi's names.** `Container` already has `name` (deprecated), `label`,
  `width`, `height`, `position`. Use `playerName`, `gridWidth`, `gridPosition` instead.
- The game UI and code are in English. The CV content (`src/content/cv.ts`) is in French.

## TypeScript

`strict` is on (`tsconfig.json`), along with `verbatimModuleSyntax` and
`erasableSyntaxOnly`.

- **No `any`.** At a boundary (network messages, `JSON`, DOM), type the value as `unknown` and
  narrow it, the way `CvRoom.isValidPosition` checks `Number.isFinite` before trusting a
  message.
- **No `!` (non-null assertion) in source code.** Handle the missing case, or throw an error
  that explains it:

  ```ts
  // ✅ src/network/MultiplayerClient.ts
  public getRoom(): Room<CvRoomState> {
    if (!this.room) {
      throw new Error("Multiplayer client is not connected");
    }
    return this.room;
  }
  ```

  Tests may use `!` on a value they expect to exist, since a wrong guess just fails the test.

- **`import type`** for anything used only as a type. It's required when the client imports
  server schema types, so that no server code ends up in the bundle.
- **`readonly`** by default for fields and arrays (`readonly Theme[]`). Drop it only when
  the value really changes.
- Prefer **union types and `as const`** to `enum` (`erasableSyntaxOnly` forbids enums).
- Model data as plain `interface`s or `type`s in `domain/` or `shared/`, and keep classes
  for things with behaviour or a lifecycle.
- **No useless code:** empty constructors, assertions that don't change the type, `?.` on
  values that can't be null. The linter flags all three.

## Functions and classes

- **Pure logic goes outside Pixi.** Rules, maths and decisions live in `shared/`,
  `domain/` or a Pixi-free module, and are unit tested in Node. Pixi classes only draw and
  forward input. `IsometricConverter` and `ThemeCycle` are the model to follow.
- **One class per file.** If a file passes ~200 lines or a class does two jobs, split it.
  For example, `MainScene` builds the world _and_ syncs the network: new world-building
  code goes in a factory, not in the scene.
- **Pass dependencies in through the constructor** rather than creating them inside
  (`Player` takes its `map`, `converter` and `onMove`). This makes classes testable without
  `vi.mock` and lets `Game` wire them up. `MainScene` creating its own `MultiplayerClient`
  is a known exception, listed in ARCHITECTURE.md › "Known architectural debts".
- **Callbacks for events between layers.** Use an `on…` option or method that returns an
  unsubscribe function (`ThemeCycle.onChange`, `CvPanel.onOpenChange`). Don't reach into
  another object's internals.
- **Order class members:** fields, constructor, public methods, then private helpers.
  Declare all fields before the constructor.
- **Return early** instead of nesting `if`s (see `CvRoom.handleMove`).
- Keep functions short and give them one level of abstraction. Name a condition with a
  helper (`isMoveAllowed`) rather than a comment.

## Constants and configuration

- **No magic numbers in logic.** Give tuning values a name (`private readonly speed = 3`,
  `maxMoveDistance = 1`). If both sides need a value, put it in `shared/`, and if only the
  client does, in `src/config/`.
- Drawing coordinates inside a Pixi `Graphics` (sprite shapes) can stay inline.
- **Never copy a world value** (map size, spawn, footprints) into `src/` or `server/`.
  Import it from `shared/`.
- Colours of the background, tiles and labels come from the theme (`src/config/themes.ts`).

## Async and errors

- **Every promise is handled:** `await` it, add a `.catch`, or mark it fire-and-forget with
  `void` and handle errors inside it. The linter enforces this (`no-floating-promises`).

  ```ts
  // ✅ server/index.ts: a failed listen is reported, and the process exits
  server.listen(PORT).catch((error: unknown) => {
    console.error(`Server failed to listen on port ${PORT}`, error);
    process.exit(1);
  });
  ```

- **The network is optional.** Any network call can fail. Catch the error, log it, and keep
  the game playable (F-023).
- **The server ignores bad input silently.** It never throws on a client message, and never
  trusts the message's types.
- Throw `Error` with a message that says what was expected
  (`"ThemeCycle needs at least one theme"`). Never throw strings.
- **Logging:** `console.error` for failures, `console.warn` for unexpected but recoverable
  states. Don't leave `console.log` calls in hot paths (every frame or every move). Use the
  debug overlay (F-051) to see live values.

## Pixi

- **Grid ↔ pixels only through `IsometricConverter`.** Never write the iso maths inline.
- **Cleanup:** whoever creates an object, listener or ticker callback removes it in
  `destroy()`. Store `window` listeners as arrow-function fields so they can be removed:

  ```ts
  // ✅ src/scenes/MainScene.ts
  private handleResize = (): void => { this.camera.resize(); };
  // constructor: window.addEventListener("resize", this.handleResize);
  // destroy():   window.removeEventListener("resize", this.handleResize);
  ```

- Use `label` (not the deprecated `name`) to tag a display object for debugging.
- Use `pointertap` for clicks: it also fires for touch and for the accessibility layer
  (Enter).
- Depth comes from `zIndex = y` in `MainScene.updateDepth`. Don't set `zIndex` anywhere else.
- Files that import Pixi need `// @vitest-environment happy-dom` in their tests.

## DOM and HTML UI

- **Never `innerHTML` with CV or player text.** Build elements and set `textContent`
  (`cvSections.ts`'s `el()` helper).
- Style in `src/style.css`. Any class that sets `display` on an element toggled with
  `hidden` needs a `[hidden] { display: none; }` rule.
- After a button click, give focus back to the canvas so the keyboard still moves the player
  (`ThemeButton`).
- Make UI accessible: real `<button>`s, and ARIA where there's no native element
  (`CvPanel` uses `role="dialog"`, `aria-modal`, `aria-labelledby`, and `aria-label` on the ✕).

## Comments and docs

- **Comment on _why_, not _what_.** A workaround, a non-obvious rule or a link to a feature ID
  deserves a comment. A line that only repeats the code doesn't.

  ```ts
  // ✅ src/scenes/MainScene.ts
  // pointertap: a full click or tap, also fired by the accessibility layer (Enter).
  ```

- **JSDoc on public methods and exported functions** whose name doesn't say everything:
  units, side effects, what's returned (`ThemeCycle.onChange`).
- No commented-out code, and no `TODO` without a feature ID. Record the idea in
  FEATURES.md instead.

## Tests

The conventions are in [tests/README.md](../tests/README.md) and the `write-tests` skill. In
short: write the lowest level of test that catches the bug, write a rejection test for every
server rule, and start a bug fix with a failing test.
