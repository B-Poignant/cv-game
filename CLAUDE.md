# cv-game

An interactive CV presented as a multiplayer isometric game. Visitors walk around a
tile map and enter buildings (Experience, Skills, Projects, Education) to read CV content.

## Stack

- **Client:** TypeScript + [Pixi.js v8](https://pixijs.com) (rendering), bundled with Vite
- **Server:** [Colyseus 0.18](https://colyseus.io) (authoritative multiplayer rooms), run with `tsx` in dev and
  bundled with Vite (SSR) for production; Docker image in `Dockerfile`
- **Tests:** Vitest (unit, integration) + Playwright (e2e) · **Lint:** ESLint (flat config, `typescript-eslint` `strictTypeChecked` + layer import rules) · **Format:** Prettier

## Commands

```bash
npm run dev          # Vite client on http://localhost:5173
npm run server       # Colyseus server on ws://localhost:2567 (needed for multiplayer)
npm run build        # client into dist/ + the /cv page + server into build/server/
npm run cv:html      # writes the classic HTML CV page to dist/cv/index.html (F-032)
npm start            # production server: game + rooms on PORT (default 2567)
npm test             # unit + integration tests (Vitest)
npm run test:unit    # fast unit tests only
npm run test:coverage # with coverage thresholds
npm run test:e2e     # Playwright, starts server + Vite itself
npm run typecheck    # tsc over src/, server/, tests/
npm run lint         # ESLint
npm run format       # Prettier --write
npm run check        # typecheck + lint + format:check + test (run before finishing a task)
```

## Layout

```
src/
  main.ts            entry: creates Game
  game/              engine core: Game (Pixi app), Map, Camera, Player, CollisionMap,
                     IsometricConverter (grid <-> screen), GridPosition
    entities/        world objects (Building, Chest, DistrictGround)
    factories/       builders for entities from config
    minigames/       the Minigame contract every minigame implements (F-070), and one
                     folder per minigame (skillBreakout/, careerTimeline/, educationQuiz/: rules + view,
                     F-071/072/074), ChoiceButton + shuffle shared by the quiz-like ones
  scenes/            Pixi Containers: MainScene (world), MinigameScene + MinigameFlow (F-070),
                     minigames/registry.ts (which building runs which minigame)
  ui/                HTML UI over the canvas: CvPanel + cvSections, ThemeButton, IdentityPanel,
                     IntelInventory, ChatLog, PitchDialog + PitchFlow + rewardSection, AchievementsPanel +
                     AchievementToast (F-041)
  domain/            plain CV data types (Experience, Skill, Project, Education), no Pixi
  config/            client-only static data (themes.ts palettes, achievements.ts, devLines.ts)
  cvPage/            the classic HTML CV page (F-032): pure string building, no DOM or Pixi;
                     built by scripts/buildCvPage.ts (npm run cv:html)
  content/           cv.ts: the real CV (French), typed by domain/Cv.ts; intel.ts: card texts;
                     contact.ts: the owner's contact details (F-043)
  network/           Colyseus client, remote player + dev sync, LocalIntel (own cards),
                     PitchChannel (pitch messages), MoveThrottle (moves at most 20/s)
shared/              imported by BOTH client and server: no Pixi, no DOM, no Node APIs
  world.ts           MAP_SIZE, PLAYER_SPAWN, createWorldCollisions, isWalkable
  buildings.ts       building layout (+ CvSectionId)
  districts.ts       the map as CV: one district (quarter) per section (F-005)
  preferences.ts     the dev's job preferences (pitch scoring, F-042)
  recruiters.ts      recruiter identities: defaults + validation (F-012)
  intel.ts           intel cards: ids, sources, reach (F-031)
  pitch.ts           pitch options, the dev's replies, scoring (F-042)
  spam.ts            the recruiter-spam emails: tuning + subjects (F-063)
  CollisionMap.ts, grid.ts
server/
  index.ts           listens on PORT (default 2567)
  app.config.ts      room registry + HTTP hook
  http.ts            /health and the built client (dist/)
  rooms/             CvRoom (move validation, dev loop, catch + pitch), MoveBudget (speed
                     limit), DevWanderer + flee (the dev's movement), SpamStorm (the spam emails),
                     PitchTracker (who may pitch, cooldowns), CvRoomState (schema)
scripts/             buildCvPage.ts: writes dist/cv/index.html (npm run cv:html)
tests/
  unit/              mirrors src/ (pure logic, Pixi classes via happy-dom)
  integration/       real Colyseus server + real clients
  e2e/               Playwright journeys (*.spec.ts)
  helpers/           builders, keyboard, test server
docs/
  FEATURES.md        feature registry: every feature, its status and how it works
  ARCHITECTURE.md    layers + import rules, data flow, how to extend, known debts
  CODE_STYLE.md      naming, TypeScript, async, Pixi, DOM and comment rules
  reviews/           whole-project review reports (review-project skill), one per date
.claude/
  skills/            repeatable workflows (see "Skills and agents")
  agents/            docs-keeper, project-auditor
  hooks/             docs-reminder.mjs (Stop hook)
```

## Conventions

The full rules are in `docs/ARCHITECTURE.md` (layers, where code goes) and `docs/CODE_STYLE.md`
(how to write it). Read them before adding a class or a module. The essentials:

- **Grid coordinates** are `{ column, row }` (`GridPosition`). Convert to pixels only through
  `IsometricConverter`, never inline the iso maths.
- **The server is authoritative.** Movement is validated in `CvRoom` (walkable tile, at most 1 tile
  per move and `PLAYER_SPEED` over time via `MoveBudget`), and a client sending more than
  `maxMessagesPerSecond` (60) is dropped, so the client sends moves through `MoveThrottle`.
  Client-side checks are only for responsiveness; any new rule must also be enforced on the server.
- **One source for world rules.** Anything both sides need (map size, spawn, layout,
  walkability, preferences) lives in `shared/`. Never copy a value into `src/` or `server/`.
  `shared/` must not import from `src/` or `server/`.
- **Shared types:** the client imports server schema types with `import type` from `server/rooms/`.
  Keep it type-only so no server code ends up in the browser bundle.
- **Schema:** use the `schema({...}, "Name")` + `SchemaType` style from `@colyseus/schema` v5,
  not decorators (`erasableSyntaxOnly` is on).
- **CV content** (`src/content/cv.ts`) is the owner's real CV, in French. Never invent or
  embellish it: change it only from the owner's input. The same goes for the contact details
  (`src/content/contact.ts`). The game UI is in English.
- **Game design:** new features must fit the story, rules and tone in `docs/GAME_DESIGN.md`
  ("Headhunted": visitors are recruiters chasing the dev across a CV-shaped map). If a request
  conflicts with it, say so.
- **Colours** of the background, map tiles and map text (labels) come from the current theme
  (`src/config/themes.ts`), so don't hard-code them. Label colours must keep a 4.5:1
  contrast with the tiles. HTML UI over the canvas (e.g.
  `ThemeButton`) is styled in `src/style.css`.
- `domain/`, `shared/` and pure logic (`IsometricConverter`) stay free of Pixi so they
  can be unit tested. Put new game logic there first and test it.
- Use `import type` for type-only imports (`verbatimModuleSyntax` is on).
- Formatting is Prettier's job, so don't hand-format. Run `npm run format` after editing.

## Testing

Conventions: `tests/README.md`. To write tests, use the `write-tests` skill
(`.claude/skills/write-tests/`). The essentials:

- Write the lowest level that catches the bug. Unit tests run in Node, and any file that
  imports Pixi needs `// @vitest-environment happy-dom` at the top.
- Every server rule needs a rejection test (the server is authoritative).
- Logic changes need tests. A bug fix starts with a failing regression test.
- Never lower the coverage thresholds in `vitest.config.ts`.

## Gotchas

- Pixi `Container` already has `width`/`height` accessors and a `label` property. Don't declare
  same-named fields on subclasses (e.g. `gridWidth`/`gridHeight` for sizes in tiles,
  `nameText` for a `Text`).
- **Keyboard access needs Pixi 8.22+.** In 8.21, Tab didn't turn the accessibility layer on
  until it had been on once, which broke Tab-to-building (F-030). Don't pin Pixi below 8.22;
  `tests/e2e/cv-panels.spec.ts` catches it.
- **Tiles are centred on whole numbers.** Tile `c` covers `c - 0.5` to `c + 0.5`, and
  positions round to the nearest tile, so a 24-tile axis spans -0.5 to 23.5. Check bounds
  with `isInsideGrid` / `isInsideMap` (`shared/world.ts`), never with `0 <= x < size`.
- **CSS `display` beats the `hidden` attribute.** Any class that sets `display` on an element
  toggled with `hidden` needs a `[hidden] { display: none; }` rule (see `.cv-backdrop`).
- **Listen to `renderer.on("resize")`, not `window`'s `resize`.** Pixi's `ResizePlugin` resizes
  the renderer on the next animation frame, so on the window event `renderer.width` is still the
  old size.
- **Server message handlers take `message: unknown`** and check it before use (see
  `isMoveMessage` in `CvRoom`). Typing it as the expected shape lets `null` through, and a
  throw used to end the Node process; `onUncaughtException` now only logs it.
- **Never put CV or player text in `innerHTML`.** Build DOM with `textContent` (see `cvSections.ts`).
- `MultiplayerClient` connects to `serverEndpoint()`: `localhost:2567` in dev, the page's origin
  in production, or `VITE_SERVER_URL`. The game should still run if the
  server is down.
- Windows dev machine: use forward slashes in paths in scripts and docs.

## Documentation

| Doc                    | Holds                                                  | Update when                                               |
| ---------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| `docs/GAME_DESIGN.md`  | the story ("Headhunted"), rules, tone, open questions  | the design or story changes                               |
| `docs/FEATURES.md`     | every feature (✅ 🚧 📋 💡): how it works, code, tests | a feature is added, changed or removed                    |
| `docs/ARCHITECTURE.md` | layers, import rules, data flow, how to extend, debts  | a layer, flow or extension point changes, a debt is fixed |
| `docs/CODE_STYLE.md`   | how to write the code (naming, TS, async, Pixi, DOM)   | a code rule or lint config changes                        |
| `CHANGELOG.md`         | notable changes under `[Unreleased]`, by feature ID    | any change a user or developer would notice               |
| `README.md`            | overview, status, setup, scripts, structure            | setup, scripts, structure or status change                |
| `tests/README.md`      | test conventions                                       | test infrastructure changes                               |
| `CLAUDE.md`            | this file: context and rules for Claude                | commands, layout, conventions, gotchas                    |

Describe the code as it is: a feature is ✅ only when its code and tests exist. A Stop hook
(`.claude/hooks/docs-reminder.mjs`) blocks the end of a turn when code changed but no docs
did. Answer it by running `update-docs`, or by saying in one line why no doc change is needed.

## Skills and agents

Use these instead of improvising, so the work is done the same way every time.

| Task                                       | Use                                                      |
| ------------------------------------------ | -------------------------------------------------------- |
| Build a feature / record an idea           | `new-feature` skill                                      |
| Fix a bug                                  | `fix-bug` skill                                          |
| Write or update tests                      | `write-tests` skill                                      |
| Check a change before saying it's done     | `verify` skill                                           |
| Sync docs after a feature/important change | `update-docs` skill (large changes: `docs-keeper` agent) |
| Add / upgrade / remove an npm package      | `add-dependency` skill                                   |
| Install a Claude plugin / MCP / skill pack | `add-plugin` skill                                       |
| Update the CV from the owner's LinkedIn    | `sync-cv` skill                                          |
| Generate / refresh the classic HTML CV     | `generate-cv-html` skill                                 |
| Commit / push                              | `commit` skill                                           |
| Cut a release                              | `release` skill                                          |
| Audit docs ↔ code drift, test gaps         | `project-auditor` agent                                  |
| Review the whole codebase (not a diff)     | `review-project` skill (report only)                     |

When you notice a new task the team keeps repeating, propose turning it into a skill in
`.claude/skills/<name>/SKILL.md`.

## Workflow for Claude

1. Read the relevant files before editing. Keep changes scoped to the request.
2. Use the matching skill from the table above.
3. Finish with `verify`, then `update-docs` after a feature or important change.
4. Don't commit or push unless asked; when asked, use the `commit` skill.
