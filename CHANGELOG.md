# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Feature IDs (`F-0xx`) refer
to [docs/FEATURES.md](docs/FEATURES.md).

## [Unreleased]

### Added

- `review-project` skill: a slice-by-slice review of the whole codebase that writes a
  prioritised report to `docs/reviews/`. First report: `docs/reviews/2026-10-30.md`.
- F-032: a classic HTML CV page at `/cv/`, generated from the CV content by
  `npm run cv:html` (also run by `npm run build`, and served live by `npm run dev`). The
  arrival panel links to it for visitors who'd rather skip the game.
- F-041: five achievements ("Hired the dev", "Read the whole CV", "Found the chest", "Hired in
  under 2 minutes", "Pitched like a pro") with a toast, a chat message, and a 🏆 list under the
  theme button. Unlocks are kept in the browser.
- F-062: Ben speaks. A bubble above his head (also posted to the chat log) taunts a recruiter
  who comes close, and he mutters to himself when nobody is around.
- F-063: recruiter spam. Up to two "exciting opportunity" emails fly across the map; one that
  hits you halves your speed for 2 s. The server runs them and enforces the slowdown.
  `SPAM_FLIES=false` turns them off.
- F-072: Experience Avenue's career timeline. Tap five jobs from the CV from oldest to newest
  (3 mistakes or 60 s loses); winning earns the "Séniorité" card.
- F-074: Education Campus's quiz. Three questions built from the CV, 2 right answers win a new
  fourth intel card, "Formation & langues". Every building now has a minigame.
- F-071: Skills Park's buzzword catcher, the first minigame. Catch the dev's real stack
  and dodge the stacks he turns down and the pure buzzwords, with ←/→ (Q/D, A/D) or the
  mouse; 6 points in 40 s wins the "Stack principale" card.
- F-070: the minigame framework. A building with a minigame plays it when opened from up
  close (Escape quits), then shows its CV panel, win or lose; a win earns the intel card. The
  first minigame comes with F-071. The unused `BootScene` and `CvScene` placeholders are gone.
- F-005: the map is the CV. It grows to 24×24 and is split into districts named on the
  ground: Skills Park, Experience Avenue and a new Education Campus, whose EDUCATION building
  shows the education and languages (moved out of the other two panels). Recruiters now
  spawn at the crossroads; Ben and the chest start in the quarter kept for the Projects Lab.
- F-031: the "Séniorité" card now shows dev and lead experience together: "Dev : 9 ans 10
  mois + Lead : 4 ans 10 mois". Work-study jobs aren't counted.
- F-052: a chat log in the bottom-left corner keeps every message: Ben's lines
  ("Ben: Do you even know what I do?", his answers to a pitch) and game notices (new intel,
  "Get closer…"). They used to flash for 4 s under the intel cards.
- F-043: a good pitch now shows how to reach the dev for real: his LinkedIn and email,
  each with a copy button, and a "Download my CV (PDF)" link.
- F-042: catch Ben and pitch him a job. Touching him with 3 intel cards opens an offer
  dialog (stack, work mode, role, opening line). The server detects the catch, scores the
  offer against the owner's real preferences, and Ben answers: hired, or a hint at what was
  wrong and a 30 s wait. Without 3 cards he says "Do you even know what I do?".
- F-031: intel cards. Opening a building from up close (2 tiles) earns its card, and the
  chest gives a secret one: "Stack principale", "Séniorité" (lead time computed from the
  CV) and "Critère éliminatoire". The server checks the distance and gives each card once.
  An inventory in the top-right corner shows "Intel n/3" and announces new cards.
- F-012: pick who you are on arrival. A panel offers a random recruiter ("Homer from
  Springfield Nuclear", "Snake from Philanthropie"…), 🎲 picks another, and your name and
  company show above your character for everyone. The server checks them and falls back to
  a random default.
- F-061: Ben runs away from recruiters within 4 tiles. He's slower than them but sprints
  for a second when one gets very close, so recruiters have to corner him against a wall or
  the map edge, or close in from two sides.
- F-060: Ben, the dev, wanders the map. The server moves him (20 updates a second, a bit
  slower than recruiters, never into buildings) and every visitor sees him in the same place.
  `DEV_WANDERS=false` keeps him still.
- F-080: production mode. `npm run build` also bundles the server into `build/server/`, and
  `npm start` runs one process that serves the game and the multiplayer room on `PORT`
  (default 2567), with a `GET /health` check. The client connects to its own origin in
  production, or to `VITE_SERVER_URL`.
- F-081: `Dockerfile` (Node 24 Alpine, non-root, health check),
  `.dockerignore` and `compose.yaml`, built and smoke-tested in CI.
- F-082: CI runs `npm run build` and a new `docker` job builds the image and
  smoke-tests the container on every push and PR.
- F-080–F-084 (planned): delivery & deployment track in `docs/FEATURES.md`: production
  server config, a Docker image (server + built client), CI image build and smoke test,
  publishing the image to GHCR on release, and deploying to a host (still to choose).
- F-030: click (or Tab + Enter) a building to read its CV section in a panel. EXPERIENCE
  shows the profile, experiences and education; SKILLS shows skills by category and
  languages. Movement pauses while a panel is open.
- F-030: the real CV content (`src/content/cv.ts`, in French) with its types in
  `src/domain/` and content checks. The dev's name, look and job preferences are recorded in
  `docs/GAME_DESIGN.md`.
- Game design "Headhunted" (`docs/GAME_DESIGN.md`): visitors are recruiters chasing the dev
  across a CV-shaped map, playing minigames for intel and pitching him a job. The roadmap in
  `docs/FEATURES.md` gains F-005, F-012, F-024, F-031, F-042, F-043, F-060–F-063 and
  F-070–F-074; F-030 and F-041 are re-scoped to fit the story.
- F-050: theme switcher. A button in the top-left corner cycles the background and map
  colours through Classic, Simpsons and South Park.
- `docs/ARCHITECTURE.md` (layers, import rules, data flow, how to extend, known
  architectural debts) and `docs/CODE_STYLE.md` (naming, TypeScript, async, Pixi, DOM and
  comment rules, with examples from the code).
- F-051 (idea): debug mode, a 🐞 button that shows an overlay of positions, speed,
  direction, collisions and paths to every visitor.
- Feature registry `docs/FEATURES.md` (current and planned features, how each works) and this changelog.
- Claude Code workflows as skills: `new-feature`, `fix-bug`, `verify`, `update-docs`,
  `add-dependency`, `add-plugin` and `release` (alongside `write-tests`). Agents:
  `docs-keeper` and `project-auditor`. A Stop hook reminds Claude to update the docs when
  code changes.
- Three test levels: unit (Vitest), integration with a real Colyseus server, and end-to-end
  (Playwright). Includes coverage thresholds, the `write-tests` skill, and conventions in `tests/README.md`.
- Tests for remote players (against the real server), `MainScene` wiring (depth sorting F-004,
  single-player fallback F-023), `Chest` and the UI panels. Coverage rose from 54% to 90%, with higher thresholds.
- CI workflow (`.github/workflows/ci.yml`): typecheck, lint, format, tests with coverage, e2e.
- Tooling: ESLint (flat config, `typescript-eslint`), `typecheck`, `format:check` and `check` scripts.
- `CLAUDE.md`, shared `.claude/settings.json`, `.editorconfig`, `.gitattributes`, README.

### Changed

- F-071: Skills Park's minigame is now a skill breakout instead of the buzzword catcher.
  Only the bricks holding the dev's real stack carry a word, the others are empty; break
  every skill brick with the paddle (←/→, Q/D, A/D or the mouse) before losing 3 balls to
  win the "Stack principale" card. Empty bricks speed the ball up.
- F-071: the buzzword catcher needs 6 points to win, down from 12.
- F-031: there are now four intel cards, so the inventory counts "Intel n/3" up to the 3 needed
  to pitch and keeps listing the others.
- F-070: the answers of the choice-based minigames are accessible buttons (Tab + Enter).
- F-031: the intel inventory now sits under dialogs: on a phone it covered their title.
- F-040: the chest gives the secret intel card instead of logging "Achievement unlocked!".
  Its position moved to `shared/world.ts` (`CHEST_POSITION`).
- E2E runs on its own ports (2577 and 5183) and never reuses a running server, so a dev
  server left running can no longer make it test old code.
- `CollisionMap.isBlocked` no longer logs "is blocked" on every blocked check.
- F-030: keyboard access to buildings no longer needs the Pixi 8.21 workaround (the
  accessibility layer starting on). Pixi 8.22 turns it on with Tab.
- F-004: remote players get their depth from `MainScene.updateDepth` like everything else;
  `RemotePlayersManager` no longer sets `zIndex` itself.
- Docs: fixed drift found by an audit (README server rules and scripts, a wrong path in this
  changelog, "empty stub" wording for the placeholder scenes).
- Dependencies: `package.json` declares the Node version it needs (`engines`: Node
  22.13+). Updated pixi.js 8.22, Vite 8.3.4, Playwright 1.64, happy-dom 20.14.6 and
  Prettier 3.9.10.
- Phase 0: world rules shared by client and server in `shared/` (map size, spawn point,
  building layout, walkability, the dev's preferences). `GridPosition`, `CollisionMap` and the
  buildings config moved there; type checking and coverage include `shared/`.
- Buildings now open on a full click or tap (`pointertap`) instead of a press, and can be
  reached with the keyboard. The unused Pixi `SkillPanel` stub was removed and `CvPanel` became an
  HTML dialog.
- F-003: `MainScene` now reads buildings from `shared/buildings.ts` through
  `BuildingFactory` instead of hard-coding them.
- Type checking now covers `server/`, `tests/` and the config files.
- TypeScript `strict` mode is on.
- ESLint uses `typescript-eslint`'s type-checked `strictTypeChecked` rules, plus layer
  boundaries: `shared/` and `src/domain/` can't import Pixi, Colyseus or client code, the
  client imports server code only with `import type`, and the server can't import `src/`.
- `RemotePlayer.name` was renamed to `playerName`, so it no longer shadows Pixi's deprecated
  `Container.name`. The empty `BootScene`/`CvScene` constructors were removed.

### Removed

- F-024: competitive rounds dropped from the plan (never built). Each recruiter pitches Ben
  on their own; a hire doesn't end anything for the others.

### Fixed

- F-002: after a resize or a phone rotation, the map (and a running minigame's board) was
  fitted to the old window size and could overflow off-screen. It now refits once Pixi has
  resized the renderer, on the renderer's own `resize` event.
- F-022: one malformed `move` message (`null`, a string, an array…) crashed the server and
  dropped every visitor. The server now checks the payload and ignores it, and `CvRoom` logs
  any error a handler still throws (`onUncaughtException`) instead of letting Node exit.
- F-070: buildings could be opened from anywhere on the map: the pointer cursor showed from
  afar and a click opened the CV panel without playing the minigame. A building now opens
  only from within 2 tiles, where it plays its minigame; from further away the cursor stays
  an arrow and a click only says "Get closer to enter SKILLS."
- F-032: `npm run dev` no longer warns that `vite.config.ts` uses features unsupported by
  `configLoader: 'native'`. The dev `/cv/` route now loads the CV modules through Vite
  (`ssrLoadModule`) instead of importing them into the config.
- F-030: the skill level dots were uneven: filled (●) and empty (○) dots came out at
  different sizes depending on the font. They are now drawn in CSS, all the same size.
- E2E: the multiplayer journeys could time out when test files ran in parallel against the
  shared room. They now run one at a time, and visitors' browser contexts always close.
- F-011 / F-022: players and the dev could stand half a tile past the drawn map at the
  bottom and right edges, and couldn't use the outer half of the first row and column. The
  map now spans exactly its tiles (-0.5 to 19.5), with one bounds check shared by the client
  and the server.
- F-022: the server now limits how fast a player moves over time, not just how far each
  message goes. Before, a modified client could move faster by sending more messages.
- F-010: the player moves 3 tiles per second at any frame rate. Before, it moved faster on
  high-refresh screens (120/144 Hz) and slower when frames dropped.
- F-010: `Player` removes its keyboard listeners when destroyed.
- F-021: no more console logs on every remote player move.
- The server now logs an error and exits if it can't listen on port 2567, instead of
  leaving an unhandled promise rejection.
- F-022: the server now rejects moves into buildings, using the same rule as the client.
- F-001: the map size is defined once, so the client and the server can't disagree.
- The game canvas now fills the window edge to edge. The browser's default 8px page margin
  left a white strip at the top and left.
- F-050: building titles are now readable in every theme. Each theme has a label colour with at
  least 4.5:1 contrast against its tiles (Classic labels changed from white to dark).
- `Building` no longer overrides Pixi's `width`/`height` (renamed to `gridWidth`/`gridHeight`).
- `GridPosition` is now an interface; it was a class whose fields were never set.
