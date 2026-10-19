# cv-game

**Headhunted:** an interactive CV disguised as a multiplayer game.

> _A burned-out developer just wants to code in peace. Instead: 500 "exciting
> opportunities" a day. Today, **you** are one of those recruiters._

Visitors play recruiters hunting the developer across an isometric map that **is** his CV.
Each building is a minigame that reveals a CV section and earns intel. With enough intel,
corner the dev and pitch him a job. He only says yes to an offer that matches who he really
is, and the winner gets his real contact details and CV. The full story and rules are in
[`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md).

> **Status: work in progress.** Today you pick a recruiter name, walk a map split into CV districts with
> collisions, live multiplayer and colour themes, open the buildings to read the CV, and
> chase Ben, the dev, who wanders around and runs away. Opening a building up close (or
> finding the chest) earns an intel card about him (each building makes you win its
> minigame first), and with 3 cards you can catch him and pitch him a job; a good pitch shows
> his contact details and CV. Ben taunts you in speech bubbles, spam emails slow you down, and
> five achievements are up for grabs. Only the Projects Lab minigame is missing (the CV has
> no projects yet).

## Features

- Isometric tile map rendered with [Pixi.js](https://pixijs.com) v8
- Smooth movement with arrow keys, **ZQSD** (AZERTY) or **WASD** (QWERTY), with collisions
  against buildings and map edges
- Pick who you are on arrival: a name and a company (random defaults like "Homer from
  Springfield Nuclear"), shown above your character
- Real-time multiplayer with [Colyseus](https://colyseus.io): see other visitors move
  live. The server validates every move, so clients can't teleport or leave the map.
- Ben, the dev, wanders the map and runs away from recruiters who get close, moved by the
  server so every visitor sees him in the same place
- Camera fits the map to any screen size
- The map is the CV: one district per section (Skills Park, Experience Avenue, Education
  Campus), each named on the ground
- Open a building to read the real CV: experiences, skills, education and languages
- Intel cards: win a building's minigame from up close, or find the chest, to collect facts
  about the dev (shown top-right)
- Minigames: a buzzword catcher in the Skills Park, a career timeline in Experience Avenue
  and a quiz in the Education Campus, each winning a card
- Ben speaks in speech bubbles, and "exciting opportunity" spam emails fly across the map
  and slow you down
- Achievements (🏆, under the theme button) with a toast when you unlock one
- Catch Ben with 3 intel cards and pitch him an offer (stack, work mode, role, opening
  line); the server scores it against his real preferences, and a good pitch reveals how
  to contact him
- Chat log in the bottom-left corner: every line Ben says ("Ben: …") and every game notice
- Theme switcher: the 🎨 button in the top-left corner cycles the colours (Classic, Simpsons,
  South Park)

**Roadmap:**

1. **Foundations:** CV content and panels, the map as CV districts, recruiter names, the dev wandering.
2. **The chase:** the dev runs away, intel cards, catch and pitch, reward panel.
3. **Minigames:** framework, then the Skills Park buzzword catcher.
4. **Polish:** achievements, speech bubbles, spam hazards, the timeline and the quiz (the
   Projects Lab waits for projects in the CV).

The full feature list, with status and how each feature works, is in
[`docs/FEATURES.md`](docs/FEATURES.md). Recent changes are in [`CHANGELOG.md`](CHANGELOG.md).

## Getting started

**Requirements:** Node.js 22.13+ (CI uses 24) and npm.

```bash
npm install

# Terminal 1: multiplayer server (ws://localhost:2567)
npm run server

# Terminal 2: game client (http://localhost:5173)
npm run dev
```

Open http://localhost:5173. Open it in a second browser window to see multiplayer.
If the server isn't running, the game still works in single-player mode.

### Production

```bash
npm run build   # client into dist/, server into build/server/
npm start       # http://localhost:2567 serves the game and the multiplayer room
```

Or with Docker: `docker compose up --build`. Settings (environment variables): `PORT`
(default `2567`), `CLIENT_DIR` (default `dist`), `DEV_WANDERS=false` to keep the dev still
(used by e2e tests), and `VITE_SERVER_URL` at build time if the multiplayer server runs on
another host. `GET /health` answers `{ "status": "ok" }`.

### Controls

| Action          | Keys                                   |
| --------------- | -------------------------------------- |
| Move up         | `↑` · `Z` · `W`                        |
| Move down       | `↓` · `S`                              |
| Move left       | `←` · `Q` · `A`                        |
| Move right      | `→` · `D`                              |
| Open a building | Click it, or Tab to it and press Enter |
| Close a panel   | Escape, ✕, or click outside            |
| Theme           | Click 🎨 (top-left)                    |

## Scripts

| Command                                    | What it does                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `npm run dev`                              | Start the Vite dev server with hot reload                                     |
| `npm run server`                           | Start the Colyseus multiplayer server                                         |
| `npm run build`                            | Type-check, build the client into `dist/` and the server into `build/server/` |
| `npm run build:server`                     | Build only the server (Vite SSR, `vite.server.config.ts`)                     |
| `npm start`                                | Run the production server (game + rooms on `PORT`, default 2567)              |
| `npm run preview`                          | Serve the client build alone (no multiplayer)                                 |
| `npm test`                                 | Unit + integration tests                                                      |
| `npm run test:unit` / `test:integration`   | One test level only                                                           |
| `npm run test:watch`                       | Unit tests in watch mode                                                      |
| `npm run test:coverage`                    | Tests with coverage report (`coverage/index.html`)                            |
| `npm run test:e2e`                         | Browser tests with Playwright (starts server + client)                        |
| `npm run test:all`                         | Coverage tests, then e2e                                                      |
| `npm run typecheck`                        | TypeScript over `src/`, `server/`, `shared/`, `tests/`                        |
| `npm run check`                            | Typecheck, lint, format check and tests: run before committing                |
| `npm run lint` / `format` / `format:check` | ESLint / Prettier (write) / Prettier (check only)                             |

The first time you run the browser tests, install Chromium with `npx playwright install chromium`.

## Project structure

```
src/                 game client
  game/              engine: Game, Map, Player, Camera, collisions, isometric maths
    entities/        world objects (Building, Chest)
  scenes/            Pixi scenes (MainScene is the world)
  network/           Colyseus client and remote player sync
  ui/                HTML over the canvas: CV panels, dialogs, achievements
  domain/            CV data types (Cv, Experience, Skill, Education, …)
  content/           the real CV content (French)
  config/            client data (theme palettes)
shared/              rules shared by client and server (map, buildings, preferences, spam)
server/              Colyseus server
  rooms/             CvRoom (movement rules), the dev and spam logic, and the synced state
tests/
  unit/              fast logic tests (Vitest)
  integration/       real server + real clients (Vitest)
  e2e/               full game in a browser (Playwright)
  helpers/           shared test builders and helpers
public/              static assets served as-is
docs/
  FEATURES.md        feature registry: status and how each feature works
  ARCHITECTURE.md    layers, data flow, how to extend
  CODE_STYLE.md      how to write the code
.github/workflows/   CI (typecheck, lint, tests, build, e2e, Docker smoke test)
Dockerfile           production image (server + built client), compose.yaml to run it
.claude/             Claude Code skills, agents and hooks
```

## How it works

The map is a grid of `{ column, row }` positions. `IsometricConverter` turns grid positions
into screen pixels, giving the diamond-shaped isometric view.

The player moves continuously on the client for smooth controls and sends its position to
the server. The server's `CvRoom` checks each move: it must stay on the map, stay out of
buildings, cover at most one tile, and not go faster than the speed limit. Accepted moves are synced to every connected visitor through the Colyseus
room state. The server has the final say, so a modified client can't cheat.

## Testing

Tests come in three levels: unit, integration and end-to-end. The conventions (which level
to use, naming, helpers) are in [`tests/README.md`](tests/README.md).

CI (`.github/workflows/ci.yml`) runs the typecheck, lint, all tests with coverage
thresholds, and the browser tests on every push and pull request.

## Tech stack

TypeScript · Pixi.js 8 · Colyseus 0.18 · Vite · Vitest · Playwright · ESLint · Prettier

## Working with Claude Code

This repo is set up for [Claude Code](https://claude.com/claude-code), so Claude handles
recurring tasks the same way every time:

- **`CLAUDE.md`**: project context, conventions and which workflow to use for each task.
- **Skills** (`.claude/skills/`, also usable as slash commands):
  - `/new-feature`: register, build, test and document a feature
  - `/fix-bug`: reproduce with a failing test, fix, document
  - `/write-tests`: test conventions and templates
  - `/verify`: run the right checks and report real results
  - `/update-docs`: sync FEATURES, CHANGELOG, README and CLAUDE.md with the code
  - `/add-dependency`: add or upgrade npm packages safely
  - `/add-plugin`: check where a Claude plugin comes from and what it does before installing it
  - `/sync-cv`: update the CV from your LinkedIn export (or profile PDF), change by change
  - `/commit`: scope, secrets, identity and checks before a commit or push
  - `/release`: version bump, changelog and tag
- **Agents** (`.claude/agents/`): `docs-keeper` updates docs without filling the main
  conversation. `project-auditor` reports where docs and code disagree, plus test gaps.
- **Hook:** at the end of each turn, `.claude/hooks/docs-reminder.mjs` asks Claude to update
  the docs if code changed but no docs did.
- **`.claude/settings.json`**: shared permissions and the hook.
