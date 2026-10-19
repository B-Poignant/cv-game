# Features

Every feature of cv-game, current and planned, and how each one works.

**Legend:** ✅ Done · 🚧 Partial / in progress · 📋 Planned · 💡 Idea

**Phase:** the [Roadmap](#roadmap) phase (1–4) that builds the feature, **Delivery** for the
delivery & deployment track, **—** for features outside the roadmap (the engine built before
it, or unscheduled).

**Rules**

- IDs are grouped by area (`F-00x` world, `F-01x` player, `F-02x` multiplayer, `F-03x` CV
  content, `F-04x` interactions, `F-05x` display, `F-06x` story & the dev, `F-07x` minigames, `F-08x` delivery & deployment). **Never reuse an ID.** Take the next free number in the area.
- A feature is ✅ only when its code **and** tests exist. Write "none (gap)" when tests are missing.
- Removed features move to [Removed](#removed) and keep their ID.
- The Phase column matches the [Roadmap](#roadmap) table: change both together.
- Planned features follow the story in [GAME_DESIGN.md](GAME_DESIGN.md) ("Headhunted").
- Keep this file in sync with the `update-docs` skill. To start a feature, use the
  `new-feature` skill.

## Summary

| ID                                                  | Feature                                  | Status | Phase    | Code                                                                                                      | Tests                  |
| --------------------------------------------------- | ---------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------- | ---------------------- |
| **World**                                           |                                          |        |          |                                                                                                           |                        |
| [F-001](#f-001-isometric-tile-map)                  | Isometric 24×24 tile map                 | ✅     | —        | `src/game/Map.ts`, `src/game/IsometricConverter.ts`                                                       | unit                   |
| [F-002](#f-002-camera-fit-and-resize)               | Camera fits the map, refits on resize    | ✅     | —        | `src/game/Camera.ts`                                                                                      | unit, e2e              |
| [F-003](#f-003-buildings-defined-in-config)         | Buildings defined in config              | ✅     | —        | `shared/buildings.ts`, `src/game/factories/`, `src/game/entities/Building.ts`                             | unit                   |
| [F-004](#f-004-depth-sorting)                       | Depth sorting                            | ✅     | —        | `src/scenes/MainScene.ts`                                                                                 | unit                   |
| [F-005](#f-005-map-as-cv)                           | Map as CV: districts per section         | ✅     | 1        | `shared/districts.ts`, `src/game/entities/DistrictGround.ts`                                              | unit, integration, e2e |
| **Player**                                          |                                          |        |          |                                                                                                           |                        |
| [F-010](#f-010-keyboard-movement)                   | Keyboard movement (arrows / ZQSD / WASD) | ✅     | —        | `src/game/Player.ts`                                                                                      | unit                   |
| [F-011](#f-011-collisions)                          | Collisions with buildings and map edges  | ✅     | —        | `shared/CollisionMap.ts`, `src/game/Map.ts`                                                               | unit                   |
| [F-012](#f-012-recruiter-identity)                  | Recruiter identity (name + company)      | ✅     | 1        | `shared/recruiters.ts`, `src/ui/IdentityPanel.ts`, `src/game/entities/NameTag.ts`                         | unit, integration, e2e |
| **Multiplayer**                                     |                                          |        |          |                                                                                                           |                        |
| [F-020](#f-020-join-a-shared-room)                  | Join a shared room                       | ✅     | —        | `src/network/MultiplayerClient.ts`, `server/rooms/CvRoom.ts`                                              | integration, e2e       |
| [F-021](#f-021-see-other-visitors-move)             | See other visitors move live             | ✅     | —        | `src/network/RemotePlayersManager.ts`, `src/network/RemotePlayer.ts`                                      | unit, integration, e2e |
| [F-022](#f-022-server-side-move-validation)         | Server checks every move                 | ✅     | —        | `server/rooms/CvRoom.ts`                                                                                  | integration            |
| [F-023](#f-023-single-player-fallback)              | Single-player when the server is down    | ✅     | —        | `src/scenes/MainScene.ts`                                                                                 | unit                   |
| **CV content**                                      |                                          |        |          |                                                                                                           |                        |
| [F-030](#f-030-cv-content-and-section-panels)       | CV content + section panels              | ✅     | 1        | `src/content/`, `src/ui/CvPanel.ts`, `src/ui/cvSections.ts`                                               | unit, e2e              |
| [F-031](#f-031-intel-cards)                         | Intel cards                              | ✅     | 2        | `shared/intel.ts`, `src/content/intel.ts`, `src/ui/IntelInventory.ts`, `src/network/LocalIntel.ts`        | unit, integration, e2e |
| [F-032](#f-032-classic-html-cv-page)                | Classic HTML CV page (`/cv`)             | ✅     | —        | `src/cvPage/`, `scripts/buildCvPage.ts`, `vite.config.ts`                                                 | unit, e2e              |
| **Interactions**                                    |                                          |        |          |                                                                                                           |                        |
| [F-040](#f-040-clickable-chest)                     | Clickable chest on the map               | 🚧     | —        | `src/game/entities/Chest.ts`, `src/scenes/MainScene.ts`, `shared/world.ts`                                | unit, integration      |
| [F-041](#f-041-achievements)                        | Achievements                             | ✅     | 4        | `src/config/achievements.ts`, `src/game/AchievementTracker.ts`, `src/ui/AchievementsPanel.ts`             | unit                   |
| [F-042](#f-042-catch-and-pitch)                     | Catch + pitch dialog                     | ✅     | 2        | `shared/pitch.ts`, `server/rooms/PitchTracker.ts`, `src/network/PitchChannel.ts`, `src/ui/PitchDialog.ts` | unit, integration, e2e |
| [F-043](#f-043-reward-panel)                        | Reward panel: contact info + CV PDF      | ✅     | 2        | `src/content/contact.ts`, `src/ui/rewardSection.ts`, `src/ui/PitchFlow.ts`                                | unit                   |
| **Display**                                         |                                          |        |          |                                                                                                           |                        |
| [F-050](#f-050-theme-switcher)                      | Theme switcher (button top-left)         | ✅     | —        | `src/config/themes.ts`, `src/game/ThemeCycle.ts`, `src/ui/ThemeButton.ts`                                 | unit, e2e              |
| [F-051](#f-051-debug-mode)                          | Debug mode (clickable icon + overlay)    | 💡     | —        | —                                                                                                         | —                      |
| [F-052](#f-052-chat-log)                            | Chat log (bottom-left)                   | ✅     | —        | `src/ui/ChatLog.ts`                                                                                       | unit, e2e              |
| **Story & the dev**                                 |                                          |        |          |                                                                                                           |                        |
| [F-060](#f-060-the-dev-wanders)                     | The dev wanders the map (server-run NPC) | ✅     | 1        | `server/rooms/DevWanderer.ts`, `src/network/RemoteDev.ts`, `src/game/entities/Dev.ts`                     | unit, integration, e2e |
| [F-061](#f-061-the-dev-runs-away)                   | The dev runs away from recruiters        | ✅     | 2        | `server/rooms/flee.ts`, `server/rooms/DevWanderer.ts`                                                     | unit, integration      |
| [F-062](#f-062-dev-speech-bubbles)                  | Dev speech bubbles                       | ✅     | 4        | `src/game/DevChatter.ts`, `src/config/devLines.ts`, `src/game/entities/Dev.ts`                            | unit, integration      |
| [F-063](#f-063-recruiter-spam-hazards)              | Recruiter-spam hazards                   | ✅     | 4        | `shared/spam.ts`, `server/rooms/SpamStorm.ts`, `src/network/RemoteSpam.ts`                                | unit, integration      |
| **Minigames**                                       |                                          |        |          |                                                                                                           |                        |
| [F-070](#f-070-minigame-framework)                  | Minigame framework                       | ✅     | 3        | `src/game/minigames/Minigame.ts`, `src/scenes/MinigameScene.ts`, `src/scenes/MinigameFlow.ts`             | unit                   |
| [F-071](#f-071-skills-park-buzzword-catcher)        | Skills Park: buzzword catcher            | ✅     | 3        | `src/game/minigames/buzzwordCatcher/`, `src/scenes/minigames/registry.ts`                                 | unit, e2e              |
| [F-072](#f-072-experience-avenue-career-timeline)   | Experience Avenue: career timeline       | ✅     | 4        | `src/game/minigames/careerTimeline/`                                                                      | unit, e2e              |
| [F-073](#f-073-projects-lab-match-up)               | Projects Lab: match-up                   | 💡     | 4        | —                                                                                                         | —                      |
| [F-074](#f-074-education-campus-quiz)               | Education Campus: quiz                   | ✅     | 4        | `src/game/minigames/educationQuiz/`                                                                       | unit                   |
| **Delivery & deployment**                           |                                          |        |          |                                                                                                           |                        |
| [F-080](#f-080-production-server-config)            | Production server config                 | ✅     | Delivery | `server/http.ts`, `server/app.config.ts`, `src/network/serverEndpoint.ts`                                 | unit, integration      |
| [F-081](#f-081-docker-image)                        | Docker image (server + built client)     | ✅     | Delivery | `Dockerfile`, `compose.yaml`                                                                              | CI smoke test          |
| [F-082](#f-082-ci-builds-and-smoke-tests-the-image) | CI builds and smoke-tests the image      | ✅     | Delivery | `.github/workflows/ci.yml`                                                                                | —                      |
| [F-083](#f-083-publish-the-image-on-release)        | Publish the image on release             | 📋     | Delivery | —                                                                                                         | —                      |
| [F-084](#f-084-deploy-to-a-host)                    | Deploy to a host                         | 💡     | Delivery | —                                                                                                         | —                      |

## Roadmap

The order to build the "Headhunted" story ([GAME_DESIGN.md](GAME_DESIGN.md)). Each phase is
playable on its own.

| Phase                  | Features                                                   | Playable result                                                                                                   |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **0. Prerequisite** ✅ | shared client/server config (`shared/`)                    | Map size, spawn, buildings, walkability and the dev's preferences defined once (fixed the F-001 and F-022 limits) |
| **1. Foundations** ✅  | F-030 ✅, F-005 ✅, F-012 ✅, F-060 ✅                     | Walk the CV map as a named recruiter, read sections, see the dev wander                                           |
| **2. The chase** ✅    | F-061 ✅, F-031 ✅, F-042 ✅, F-043 ✅                     | Full loop: collect intel, chase, pitch, get the contact details                                                   |
| **3. Minigames** ✅    | F-070 ✅, F-071 ✅                                         | Intel earned by playing, starting with the Skills Park                                                            |
| **4. Polish** ✅       | F-041 ✅, F-062 ✅, F-063 ✅, F-072 ✅, F-074 ✅, F-073 💡 | Achievements, personality, hazards, the minigames (the Projects Lab waits for projects in the CV)                 |

Delivery & deployment (F-080 → F-084) is a separate track outside the story. It can be built
at any point, in ID order, and should land before the game is shared publicly.

---

## World

### F-001 Isometric tile map

✅ Done

- **What:** a 24×24 grid of diamond-shaped grass tiles, the ground of the world, split into
  districts (F-005).
- **How it works:** `GameMap` draws one `Graphics` diamond per cell. Every grid
  position `{ column, row }` becomes screen pixels through `IsometricConverter.toScreen`
  (`x = (column - row) × tileWidth/2`, `y = (column + row) × tileHeight/2`) with 64×32 tiles.
  `isInside` checks bounds.
- **Code:** `src/game/Map.ts`, `src/game/IsometricConverter.ts`, `shared/grid.ts`
  (tile colours come from the current theme, see F-050)
- **Tests:** `tests/unit/game/Map.test.ts`, `tests/unit/game/IsometricConverter.test.ts`
- **Shared:** the map size (`MAP_SIZE`) and the walkability rule come from `shared/world.ts`,
  so the client and the server always agree (a test checks every tile).

### F-002 Camera fit and resize

✅ Done

- **What:** the whole map is always visible and centred, whatever the window size.
- **How it works:** `Camera.fitMap` computes a zoom that fits the map bounds inside the
  viewport with 40px padding (never above 100%), then centres the world container.
  `MainScene` calls `camera.resize()` on window `resize`.
- **Code:** `src/game/Camera.ts`, `src/scenes/MainScene.ts` (`getMapBounds`, `handleResize`)
- **Tests:** `tests/unit/game/Camera.test.ts`; e2e "fills the window when it is resized"
- **Limits:** there's no scrolling or follow-camera. Large maps would become tiny.

### F-003 Buildings defined in config

✅ Done

- **What:** the CV buildings (EXPERIENCE, SKILLS and EDUCATION) placed on the map.
- **How it works:** `BUILDINGS` in `shared/buildings.ts` lists each building's title,
  grid position, footprint and colour. `MainScene.createBuildings` turns each entry into a
  `Building` through `BuildingFactory`, positions it, blocks its footprint in the collision
  map, and makes it clickable.
- **Code:** `shared/buildings.ts`, `src/game/factories/BuildingFactory.ts`,
  `src/game/entities/Building.ts`, `src/scenes/MainScene.ts`
- **Tests:** `tests/unit/shared/buildings.test.ts` (inside the map, no overlap, spawn point
  free, unique titles), `tests/unit/game/entities/Building.test.ts`,
  `tests/unit/game/factories/BuildingFactory.test.ts`
- **Shared:** the layout lives in `shared/buildings.ts`, so the server blocks the same
  footprints (F-022). Opening a building shows its CV section (F-030).

### F-004 Depth sorting

✅ Done

- **What:** objects lower on screen are drawn in front, so the player walks behind and in
  front of buildings correctly.
- **How it works:** each frame, `MainScene.updateDepth` sets every world child's `zIndex` to
  its `y` and sorts.
- **Code:** `src/scenes/MainScene.ts`
- **Tests:** `tests/unit/scenes/MainScene.test.ts` ("draws objects lower on screen in front")

### F-005 Map as CV

✅ Done (phase 1): three districts; the Projects Lab waits for projects in the CV

- **What:** the 24×24 map is split into quarters, one district per CV section, each around
  its building: **Skills Park** (top-left, SKILLS), **Experience Avenue** (top-right,
  EXPERIENCE) and **Education Campus** (bottom-left, EDUCATION: "Formation et langues").
  Each district's name is painted on the ground, and thin lines mark the borders. Recruiters
  spawn at the crossroads (12, 12). The bottom-right quarter has no district yet: Ben
  spawns there (18, 18), and the chest hides in its corner (21, 21).
- **Design:** GAME_DESIGN.md › "The map is the CV".
- **How it works:**
  - `DISTRICTS` (`shared/districts.ts`) holds each district's name, CV section and area
    (top corner + size, half the map each way). `districtAt` finds the district under a
    position (rounded to its tile), `districtCorners` gives the outline along the tile edges
    and `districtLabelPosition` the tile where the name is painted (centred, near the far edge).
  - `DistrictGround` (`src/game/entities/`) draws the outline and the name (capitals, along
    the column axis so it lies on the ground), both in the theme's `label` colour, which
    already keeps a 4.5:1 contrast with the tiles (F-050). `MainScene.createDistricts` adds
    them to the map itself, so depth sorting never puts them over characters, and
    `applyTheme` recolours them.
  - The EDUCATION building opens a new `education` section (`CvSectionId`): education and
    languages, moved out of the EXPERIENCE and SKILLS panels. It gives no intel card.
- **Code:** `shared/districts.ts`, `shared/buildings.ts`, `shared/world.ts`,
  `src/game/entities/DistrictGround.ts`, `src/scenes/MainScene.ts`, `src/ui/cvSections.ts`
- **Tests:** `tests/unit/shared/districts.test.ts` (one district per building section, each
  building in its own district, inside the map, no overlap, spawns outside the districts,
  labels on walkable tiles), `tests/unit/game/entities/DistrictGround.test.ts`,
  `tests/unit/scenes/MainScene.test.ts` (districts on the map, recoloured),
  `tests/unit/ui/cvSections.test.ts` (education section); integration
  `tests/integration/server/CvRoom.test.ts` (no card from EDUCATION); e2e
  `tests/e2e/cv-panels.spec.ts` (EDUCATION panel)
- **Limits:**
  - No Projects Lab: `projects` is empty in the CV. Once the owner adds projects to
    `src/content/cv.ts`, it needs a district and a building in the empty quarter.
  - Districts are only painted: entering one does nothing (no "Welcome to Skills Park").
  - On small screens the camera zooms out, so the ground names get small.

## Player

### F-010 Keyboard movement

✅ Done

- **What:** smooth movement with the arrows, ZQSD (AZERTY) or WASD (QWERTY).
- **How it works:** `Player` tracks pressed keys from `window` keydown/keyup (removed again
  in `destroy()`). Each frame, `Game` passes the ticker's frame time down to
  `update(deltaSeconds)`, which turns the keys into a direction, normalises diagonals, and
  moves `PLAYER_SPEED` (3 tiles/s, `shared/world.ts`) × frame time, at any frame rate. A
  frame counts for at most 0.1 s, so after a pause the player steps at most 0.3 tiles.
  Each successful move calls `onMove`, which `MainScene` sends to the server.
- **Code:** `src/game/Player.ts`
- **Tests:** `tests/unit/game/Player.test.ts` (keys, collisions, 30/60/144 fps, long frames,
  listener cleanup)
- **Limits:** there are no touch controls. The spawn point is `PLAYER_SPAWN` in `shared/world.ts`.

### F-011 Collisions

✅ Done

- **What:** the player can't walk off the map or through buildings.
- **How it works:** `CollisionMap` stores blocked tiles as `"column:row"` keys.
  `GameMap.canWalkTo` refuses positions outside the map or on blocked tiles. Fractional
  positions are rounded to the nearest tile. Tiles are centred on whole numbers, so the map
  spans -0.5 to 23.5 on each axis: `isInsideGrid` (`shared/world.ts`) is the one bounds
  check, used by the client (`GameMap.isInside`) and the server (`isInsideMap`).
- **Code:** `shared/CollisionMap.ts`, `shared/world.ts`, `src/game/Map.ts`
- **Tests:** `tests/unit/shared/CollisionMap.test.ts`, `tests/unit/game/Map.test.ts`,
  `tests/unit/game/Player.test.ts`

### F-012 Recruiter identity

✅ Done

- **What:** on arrival, a panel asks "Who are you today?", prefilled with a random recruiter
  from a list of pop-culture references ("Homer from Springfield Nuclear", "Randy from Tegridy
  Farms"…). 🎲 picks another, and Start enters the game. Every recruiter's name and company
  show above their character, for them and for everyone else.
- **Design:** GAME_DESIGN.md › "Characters".
- **How it works:**
  - `shared/recruiters.ts` holds the defaults (`DEFAULT_RECRUITERS`, 19 entries validated by
    the CV owner), `randomRecruiter` and `normalizeIdentity`: trim, collapse spaces, then
    accept 1–20 characters for the name and 1–24 for the company, using only letters (with
    accents), digits, spaces and `. , ' ’ & ! ? ( ) -`.
  - `Game` pauses the scene and opens `IdentityPanel` (`src/ui/IdentityPanel.ts`, an HTML
    form styled like the CV panel). `choose()` resolves once the typed identity passes
    `normalizeIdentity`; otherwise an error stays under the fields.
  - `MainScene.join(identity)` shows a `NameTag` (name, company underneath, in the theme's
    `label` colour) above the local `Player` and joins the room with the identity as join
    options. Before that, nobody is connected.
  - `CvRoom.onJoin` runs `normalizeIdentity` on the options again and stores `name` and
    `company` in `PlayerState`. Anything invalid or missing gets a random default instead.
  - `RemotePlayersManager` gives each `RemotePlayer` a `NameTag` and passes theme changes on,
    also to visitors who join later.
- **Code:** `shared/recruiters.ts`, `server/rooms/CvRoom.ts`, `server/rooms/CvRoomState.ts`,
  `src/ui/IdentityPanel.ts`, `src/style.css`, `src/game/entities/NameTag.ts`,
  `src/game/Player.ts`, `src/network/RemotePlayer.ts`, `src/network/RemotePlayersManager.ts`,
  `src/network/MultiplayerClient.ts`, `src/scenes/MainScene.ts`, `src/game/Game.ts`
- **Tests:** `tests/unit/shared/recruiters.test.ts` (every default is valid, cleaning,
  rejections), `tests/unit/ui/IdentityPanel.test.ts`, `tests/unit/game/entities/NameTag.test.ts`,
  `tests/unit/game/Player.test.ts` ("identity"), `tests/unit/network/RemotePlayer.test.ts`,
  `tests/unit/scenes/MainScene.test.ts` (no join before an identity); integration
  `tests/integration/server/CvRoom.test.ts` (cleaned identity, random default for each kind of
  bad input), `tests/integration/network/MultiplayerClient.test.ts`,
  `tests/integration/network/RemotePlayersManager.test.ts`; e2e `tests/e2e/identity.spec.ts`
- **Limits:**
  - Everyone spawns on the same tile, so name tags overlap until visitors move apart.
  - Tags are small (10 and 9 px, scaled down with the camera), like building titles.
  - Two visitors can pick the same name. The identity isn't remembered between visits.

## Multiplayer

### F-020 Join a shared room

✅ Done

- **What:** every visitor joins the same Colyseus room on load.
- **How it works:** `MultiplayerClient.connect` calls `joinOrCreate("cv")` on the server
  chosen by `serverEndpoint` (F-080): `http://localhost:2567` in dev, the page's origin in production. On join, `CvRoom.onJoin` adds a `PlayerState` (name, column, row)
  at the crossroads (12, 12) to the synced state. On leave, the player is removed. At most 10 clients.
- **Code:** `src/network/MultiplayerClient.ts`, `server/rooms/CvRoom.ts`,
  `server/rooms/CvRoomState.ts`
- **Tests:** `tests/integration/network/MultiplayerClient.test.ts`,
  `tests/integration/server/CvRoom.test.ts`; e2e "loads the game without errors"

### F-021 See other visitors move

✅ Done

- **What:** other visitors appear as characters and move in real time.
- **How it works:** `RemotePlayersManager` listens to `players` add/change/remove callbacks
  on the room state. It creates a `RemotePlayer` per other session (ignoring the local
  one) and updates its grid position on change.
- **Code:** `src/network/RemotePlayersManager.ts`, `src/network/RemotePlayer.ts`
- **Tests:** `tests/integration/network/RemotePlayersManager.test.ts` (real server: join, move, leave, already-present visitors), `tests/unit/network/RemotePlayer.test.ts`; e2e "two visitors see each other move"
- **Limits:** visitors jump between positions (no smoothing). Name tags come from F-012.

### F-022 Server-side move validation

✅ Done

- **What:** the server has the final say, so a modified client can't teleport or leave the map.
- **How it works:** `CvRoom.handleMove` ignores a `move` message unless both coordinates
  are finite numbers on a walkable tile (inside the 24×24 map and not inside a building, rounded
  to the nearest tile) and the client still has enough movement budget. Each client has a
  `MoveBudget` (a token bucket): it holds at most 1 tile, so one move can't jump further, and
  refills at `PLAYER_SPEED` × 1.25 tiles/s, so sending more messages can't make a player move
  faster. The 25% margin absorbs uneven frame and network timing.
- **Code:** `server/rooms/CvRoom.ts`, `server/rooms/MoveBudget.ts`
- **Tests:** `tests/integration/server/CvRoom.test.ts` (valid moves, jumps, bursts of moves,
  bounds, buildings, malformed payloads), `tests/unit/server/rooms/MoveBudget.test.ts`,
  `tests/unit/shared/world.test.ts`
- **Shared rules:** the bounds and the building footprints come from `shared/world.ts`
  (`isWalkable`), the same rule the client uses.

### F-023 Single-player fallback

✅ Done

- **What:** the game stays playable when the multiplayer server is down.
- **How it works:** `MainScene.initializeMultiplayer` catches connection errors and logs
  them. `sendPlayerPosition` does nothing while disconnected.
- **Code:** `src/scenes/MainScene.ts`
- **Tests:** `tests/unit/scenes/MainScene.test.ts` ("stays playable when the server is unreachable", network faked)

## CV content

### F-030 CV content and section panels

✅ Done (phase 1)

- **What:** the real CV, in French, shown in a panel when a visitor opens a building:
  - **EXPERIENCE** → profile, then the 8 experiences (company, contract, work mode, period
    with a LinkedIn-style duration, location, missions, technologies)
  - **SKILLS** → skills grouped by category with a level out of 5
  - **EDUCATION** → education, then languages (F-005)
- **How it works:**
  - Content: `CV` in `src/content/cv.ts`, typed by `Cv` (`src/domain/Cv.ts`). Skill levels
    were derived from years of use, for the owner to review.
  - Each building's `section` in `shared/buildings.ts` says which part it opens.
  - A click or tap on a building (`pointertap`) calls `MainScene`'s `onBuildingSelected`.
    `Game` passes that to `CvPanel.open`, and pauses `MainScene` while the panel is open.
  - `CvPanel` is an HTML modal dialog (styled in `src/style.css`) that closes with ✕, Escape or
    a click on the backdrop. `renderSection` (`src/ui/cvSections.ts`) builds the content with
    `textContent` only, never `innerHTML`. Dates and durations come from `src/content/format.ts`.
  - Keyboard: buildings are accessible Pixi objects, so Tab puts a real "Open <TITLE>" button
    over each one, and Enter opens it.
- **Code:** `src/content/cv.ts`, `src/content/format.ts`, `src/domain/`, `src/ui/CvPanel.ts`,
  `src/ui/cvSections.ts`, `shared/buildings.ts`, `src/scenes/MainScene.ts`,
  `src/game/Game.ts`, `src/style.css`
- **Tests:** `tests/unit/content/cv.test.ts`, `tests/unit/content/format.test.ts` (durations
  match LinkedIn), `tests/unit/ui/cvSections.test.ts` (level dots all the same size), `tests/unit/ui/CvPanel.test.ts`,
  `tests/unit/scenes/MainScene.test.ts` (building tap, pause), `tests/unit/shared/buildings.test.ts`;
  e2e `tests/e2e/cv-panels.spec.ts` (keyboard, mouse, closing, fits the window, scrolling)
- **Limits:**
  - **Projects:** none listed yet.
  - In the story, panels will open after a building's minigame (F-070); for now a click opens them.

### F-031 Intel cards

✅ Done (phase 2)

- **What:** facts about the dev, in French, that recruiters collect before pitching (F-042
  needs 3). Each building gives its card for winning its minigame (F-070), and the hidden
  chest gives a secret one. There are 4 cards, so a recruiter can skip one. An inventory in
  the top-right corner lists them ("Intel 1/3"; the count stops at 3/3, the cards needed);
  each new card is announced in the chat log (F-052).
- **The cards** (validated by the CV owner):
  - SKILLS → **Stack principale**: PHP (Symfony, Laravel) et JavaScript / TypeScript (Ember.js,
    React, Vue.js)
  - EXPERIENCE → **Séniorité**: "Dev : 9 ans 10 mois + Lead : 4 ans 10 mois" (in October 2026), computed from the CV: lead = roles whose title says "Lead";
    dev = the other roles, minus work-study jobs ("alternance", the EISTI job during the BTS).
    Each month is counted once per total, so the changeover month from lead to dev counts in both.
  - EDUCATION → **Formation & langues**: "BTS, Informatique | option développement ·
    Français, Anglais", built from the CV
  - Chest → **Critère éliminatoire**: Télétravail idéal, hybride accepté, 5 jours sur site : refus
- **Design:** GAME_DESIGN.md › "Core loop" and "The map is the CV".
- **How it works:**
  - `shared/intel.ts` holds the card ids and their source (`INTEL_CARDS`),
    `INTEL_NEEDED_TO_PITCH` (3, fewer than the 4 cards), `INTEL_REACH` (2 tiles) and `isWithinIntelReach`: the distance
    from a position to the nearest tile of the building's footprint, or to the chest tile
    (`CHEST_POSITION` in `shared/world.ts`).
  - Tapping a building or the chest calls `MainScene.collectIntel(source)`. Too far, it calls
    `onIntelOutOfReach` ("Get closer to collect its intel.") and sends nothing; the CV panel
    still opens. Close enough, it sends `collect-intel { source }`.
  - `CvRoom` checks the source is known, the card isn't held yet and the player stands within
    reach, then pushes the card id to `PlayerState.intel` (an array, in the order earned).
    Anything else is ignored.
  - `LocalIntel` (`src/network/`) follows the visitor's own `intel` array and reports it to
    `MainScene` → `Game` → `IntelInventory` (`src/ui/`, styled in `src/style.css`).
    `intelCardText` (`src/content/intel.ts`) gives each id its French title and text.
    The heading counts at most `INTEL_NEEDED_TO_PITCH` while the list shows every card.
  - The inventory stays hidden until the room has synced, so single-player (F-023) never
    shows it. It sits under the dialogs' backdrop, so it never covers a dialog on a phone.
- **Code:** `shared/intel.ts`, `shared/world.ts`, `server/rooms/CvRoom.ts`,
  `server/rooms/CvRoomState.ts`, `src/content/intel.ts`, `src/network/LocalIntel.ts`,
  `src/scenes/MainScene.ts`, `src/ui/IntelInventory.ts`, `src/game/Game.ts`, `src/style.css`
- **Tests:** `tests/unit/shared/intel.test.ts` (one card per source, reach, every source
  reachable), `tests/unit/content/intel.test.ts` (texts match the preferences, lead months),
  `tests/unit/ui/IntelInventory.test.ts` ("stops counting at the cards needed to pitch"), `tests/unit/scenes/MainScene.test.ts` ("collecting
  intel"); integration `tests/integration/server/CvRoom.test.ts` ("intel cards": too far,
  twice, bad messages, only the sender), `tests/integration/network/LocalIntel.test.ts`;
  e2e `tests/e2e/intel.spec.ts`
- **Limits:**
  - Every card comes from a minigame: SKILLS from the buzzword catcher (F-071), EXPERIENCE
    from the career timeline (F-072), EDUCATION from the quiz (F-074). The Projects Lab
    (F-073) has no card yet. The cards "Outils du quotidien", "Postes occupés", "Méthode"
    and "Parcours" were proposed and are kept for later.
  - Cards live in the room: they're lost on reload or when the room closes (no accounts).
  - The card texts ship in the client bundle, so a curious visitor can read them in the
    source. They're public CV facts, so that's accepted.
  - The pitch (F-042) only checks how many cards a recruiter holds, not which ones.

### F-032 Classic HTML CV page

✅ Done

- **What:** a classic, readable CV page at `/cv/`, for visitors who'd rather skip the game
  (recruiters in a hurry, printing, phones). The arrival panel (F-012) links to it ("In a
  hurry? Skip the game and read the classic CV."); the page links back ("Jouer à Headhunted →").
  In French, like the CV.
- **How it works:**
  - The content comes from `src/content/cv.ts` and `contact.ts`, not from the PDF: a PDF
    change goes through the `sync-cv` skill first.
  - `npm run cv:html` (`scripts/buildCvPage.ts`, optional output path argument) writes
    `dist/cv/index.html`. `npm run build` runs it after the Vite build, so the server and the
    Docker image serve it at `/cv/` (F-080). `npm run dev` serves it live at `/cv/` through a
    plugin in `vite.config.ts`, rendered on each request. The `generate-cv-html` skill covers
    the workflow.
  - `src/cvPage/` is pure string building (no DOM, no Pixi): `html.ts` is an escaping
    builder, `cvPageSections.ts` writes the sections, `cvPageStyles.ts` the CSS and
    `renderCvPage.ts` assembles the page.
  - Style: echoes the game. District and building colours are the section accents, with
    isometric tiles, a map emblem, letter-spaced monospace labels, light and dark colour
    schemes, an A4 print layout and a phone layout. Fonts (Bricolage Grotesque, IBM Plex
    Sans and Mono) load from Google Fonts.
  - `IdentityPanel` shows the link (`CV_PAGE_URL`).
- **Code:** `src/cvPage/html.ts`, `src/cvPage/cvPageSections.ts`, `src/cvPage/cvPageStyles.ts`,
  `src/cvPage/renderCvPage.ts`, `scripts/buildCvPage.ts`, `vite.config.ts`,
  `src/ui/IdentityPanel.ts`, `.claude/skills/generate-cv-html/SKILL.md`
- **Tests:** `tests/unit/cvPage/html.test.ts`, `tests/unit/cvPage/renderCvPage.test.ts`,
  `tests/unit/ui/IdentityPanel.test.ts` (the link); e2e `tests/e2e/cv-page.spec.ts`
- **Limits:**
  - The profile name is "Ben", as in `cv.ts` (the CV data has no full name).
  - Fonts load from Google; offline, system fonts take over.
  - The page is generated, not committed: it exists after `npm run build` or `npm run cv:html`.

## Interactions

### F-040 Clickable chest

🚧 Partial

- **What:** a chest at tile (21, 21) that gives the secret intel card when tapped up close (F-031).
- **How it works:** `Chest` is a clickable container. `MainScene.createChest` places it at
  `CHEST_POSITION` (`shared/world.ts`, also used by the server's reach check) and calls
  `collectIntel("chest")` on `pointertap`.
- **Code:** `src/game/entities/Chest.ts`, `src/scenes/MainScene.ts`, `shared/world.ts`
- **Tests:** `tests/unit/game/entities/Chest.test.ts` (clickable), `tests/unit/scenes/MainScene.test.ts`
  ("collecting intel"), `tests/integration/server/CvRoom.test.ts` (the chest's card)
- **Limits:** it doesn't block movement, it can't be reached with the keyboard (it's not an
  accessible object like the buildings), and it's in plain sight rather than hidden.

### F-041 Achievements

✅ Done (phase 4)

- **What:** five badges for milestones: "Hired the dev", "Read the whole CV" (every section
  panel opened), "Found the chest", "Hired in under 2 minutes" (from arrival to yes) and
  "Pitched like a pro" (hired on the first pitch). A toast announces each unlock, the chat log
  (F-052) posts it, and a "🏆 n/5" button under the theme button opens the list (✓ unlocked,
  🔒 locked).
- **Design:** GAME_DESIGN.md › "Rewards".
- **How it works:**
  - `ACHIEVEMENTS` (`src/config/achievements.ts`) holds the definitions.
  - `AchievementTracker` (`src/game/`, pure) takes events (`arrived`, `sectionOpened`,
    `intelChanged`, `pitched` with the hired flag) and returns what just unlocked. It saves
    the unlocked ids to `localStorage` (key `cv-game.achievements`) through an injected
    storage, ignoring unknown or broken saved data and working without storage. The progress
    of a visit (sections opened, the pitch count, the arrival time) isn't saved.
  - `AchievementsPanel` (the button and list, `aria-expanded`) and `AchievementToast`
    (`role="status"`, shown 4 s) are in `src/ui/`, styled in `src/style.css`.
    `Game.createAchievements` wires the events. On narrow screens the intel inventory moves
    down to leave room.
- **Code:** `src/config/achievements.ts`, `src/game/AchievementTracker.ts`,
  `src/ui/AchievementsPanel.ts`, `src/ui/AchievementToast.ts`, `src/game/Game.ts`,
  `src/style.css`
- **Tests:** `tests/unit/game/AchievementTracker.test.ts`,
  `tests/unit/ui/AchievementsPanel.test.ts`, `tests/unit/ui/AchievementToast.test.ts`. No e2e
  test.
- **Limits:** client-side only and per browser, so a visitor could fake a badge (fine for
  badges). Nothing is shared between visitors.

### F-042 Catch and pitch

✅ Done (phase 2)

- **What:** a recruiter who touches Ben (closer than 0.8 tile) with at least 3 intel cards
  catches him: a dialog asks for an offer, one option per part (stack, work mode, role,
  opening line). The server scores it against the owner's real preferences and Ben answers.
  With fewer cards, Ben says "Do you even know what I do?". After a bad pitch, the same
  recruiter waits 30 s ("Not again! Give me 29 s.").
- **Design:** GAME_DESIGN.md › "The pitch".
- **How it works:**
  - `shared/preferences.ts` holds the ratings (perfect / accepted / fails) for the stack,
    work mode and role, as answered by the CV owner. `shared/pitch.ts` holds the options
    shown, Ben's replies, `CATCH_DISTANCE`, `PITCH_COOLDOWN_SECONDS` and `scorePitch`: any
    part that fails ends the pitch with that part's reply (work mode first, the
    deal-breaker), otherwise Ben is hired after a grumble for each accepted part.
  - The **server detects the catch**: after every accepted move and every dev step,
    `CvRoom.checkCatch` compares its own positions. `PitchTracker` (pure, given the time)
    decides: open the dialog (for 60 s), refuse (no intel, or cooldown; at most one refusal
    every 3 s), or nothing (a dialog is already open).
  - Messages: the server sends `pitch` events (`open`, `refused` with Ben's line, `result`
    with `hired` and his lines). The client sends `pitch` (the offer) and `pitch-cancel`.
    An offer is only scored if it's valid and the sender's dialog is open; anything else is
    ignored.
  - Client: `PitchChannel` (`src/network/`) checks and passes events to `MainScene` →
    `PitchFlow` (`src/ui/`, wired by `Game`). On `open`, `PitchFlow` pauses the scene and
    opens `PitchDialog`; the offer goes back through `MainScene.pitch`, and closing without
    pitching sends `pitch-cancel`. The answer shows in the same dialog ("You got me!" or
    "Not this time"). Refusals and every line of Ben's answer are posted to the chat log (F-052). The event type (`PitchEvent`)
    lives in `shared/pitch.ts`, so the server's messages are type-checked against it.
- **Code:** `shared/pitch.ts`, `shared/preferences.ts`, `server/rooms/PitchTracker.ts`,
  `server/rooms/CvRoom.ts`, `src/network/PitchChannel.ts`, `src/scenes/MainScene.ts`,
  `src/ui/PitchDialog.ts`, `src/ui/PitchFlow.ts`, `src/game/Game.ts`, `src/style.css`
- **Tests:** `tests/unit/shared/pitch.test.ts` (every rating, scoring, reply lengths),
  `tests/unit/shared/preferences.test.ts`, `tests/unit/server/rooms/PitchTracker.test.ts`,
  `tests/unit/network/PitchChannel.test.ts` (malformed events), `tests/unit/ui/PitchDialog.test.ts`,
  `tests/unit/ui/PitchFlow.test.ts`, `tests/unit/scenes/MainScene.test.ts` ("pitching"); integration
  `tests/integration/server/CvRoom.test.ts` ("catching the dev and pitching": no intel, not
  touching, uncaught, invalid, cancelled, cooldown), `tests/integration/network/PitchChannel.test.ts`;
  e2e `tests/e2e/pitch.spec.ts` (Ben turns down a recruiter without intel)
- **Limits:**
  - A good pitch shows Ben's answer and his contact details (F-043) to that recruiter only;
    the others keep chasing (no rounds, see F-024 in Removed).
  - Ben keeps running while the dialog is open; the catch only opens it. After a bad pitch
    he doesn't teleport away, he just keeps fleeing.
  - If the result never arrives (server gone), the dialog shows "Ben is thinking…" until
    closed, and the scene stays paused.
  - The full journey (3 cards, catch, pitch) has no e2e test: the chest can only be clicked
    on the canvas, so it's covered by the integration tests instead.

### F-043 Reward panel

✅ Done

- **What:** after a good pitch, the "You got me!" dialog also shows how to reach the dev for
  real: his LinkedIn and email, each with a copy button, and a "Download my CV (PDF)" link.
- **Design:** GAME_DESIGN.md › "Rewards".
- **How it works:**
  - `CONTACT` (`src/content/contact.ts`, typed by `src/domain/Contact.ts`) holds only what
    the owner chose to share: `linkedin`, `email` and `cvPdf` (`/CV_POIGNANT_BENJAMIN.pdf`, served from
    `public/` by Vite in dev and by the server from `dist/` in production). Each is
    optional and its row disappears when unset.
  - `renderReward` (`src/ui/rewardSection.ts`) builds the section with `textContent` only:
    one row per detail (link + Copy button, which says "Copied!" or "Copy failed"; the
    clipboard needs HTTPS or localhost), then the PDF link if there is one. LinkedIn opens
    in a new tab with `noopener noreferrer`.
  - `PitchFlow` (`src/ui/`) passes it to `PitchDialog.showResult` for a good pitch only.
- **Code:** `src/domain/Contact.ts`, `src/content/contact.ts`, `src/ui/rewardSection.ts`,
  `src/ui/PitchFlow.ts`, `src/ui/PitchDialog.ts`, `src/style.css`, `public/CV_POIGNANT_BENJAMIN.pdf`
- **Tests:** `tests/unit/ui/rewardSection.test.ts` (owner's LinkedIn and email, the PDF link
  and that the file exists in `public/`, optional details, copy, no clipboard),
  `tests/unit/ui/PitchFlow.test.ts` (good pitch only), `tests/unit/ui/PitchDialog.test.ts`
  (extra content). The production server was checked by hand to serve `/CV_POIGNANT_BENJAMIN.pdf`.
- **Limits:**
  - The contact details ship in the client bundle and the repo is public, so they aren't
    secret: anyone (and spam bots) can read the email. The PDF itself also contains it.
  - No e2e test of the full loop: the chest can only be clicked on the canvas, so it needs a
    way to reach it with the keyboard first (F-040).
  - The "Hired the dev" achievement is part of F-041.
  - `public/CV_POIGNANT_BENJAMIN.pdf` is a LinkedIn export, separate from `src/content/cv.ts`: update both
    when the CV changes.

## Display

### F-050 Theme switcher

✅ Done

- **What:** a button in the top-left corner ("🎨 <theme>") cycles the colours of the background
  and map tiles, plus the building titles: Classic (default, the original colours) → Simpsons → South Park → Classic.
  The choice is not remembered between visits.
- **How it works:** palettes live in `THEMES` (`src/config/themes.ts`). `ThemeCycle` holds the
  current theme, moves to the next one and notifies listeners. `ThemeButton` is an HTML
  `<button>` (styled in `src/style.css`) that calls `next()` and gives focus back to the game.
  `Game` connects them: on change, `MainScene.applyTheme` sets the renderer background,
  `GameMap.applyTheme` redraws every tile, each `Building.applyTheme` recolours its title
  with the theme's `label` colour, and `<html data-theme="…">` is updated.
- **Code:** `src/config/themes.ts`, `src/game/ThemeCycle.ts`, `src/ui/ThemeButton.ts`,
  `src/style.css`, `src/game/Map.ts`, `src/scenes/MainScene.ts`, `src/game/Game.ts`
- **Tests:** `tests/unit/game/ThemeCycle.test.ts`, `tests/unit/config/themes.test.ts`,
  `tests/unit/ui/ThemeButton.test.ts`, `tests/unit/game/Map.test.ts` (tile colours),
  `tests/unit/scenes/MainScene.test.ts`; e2e `tests/e2e/themes.spec.ts`
- **Limits:** buildings, players and the chest keep their own colours. Building titles are small
  (12px, scaled down with the camera). Adding a theme means adding an entry to `THEMES`; its
  `label` colour must reach a 4.5:1 contrast with `tile.fill` (a test checks this).

### F-051 Debug mode

💡 Idea

- **What:** a clickable icon (e.g. "🐞", next to the theme button) toggles a debug overlay
  that shows what the code is doing, drawn over the map:
  - the local player's grid position (fractional and rounded tile), speed and direction
    (arrow), and the position last accepted by the server
  - blocked tiles from the collision map and building footprints
  - paths and targets once movement logic exists (the dev wandering or fleeing, F-060 /
    F-061, or any pathfinding)
  - other visitors' positions, connection status, FPS
- **Design:** a developer tool outside the "Headhunted" story, but it also shows recruiters
  how the game is built, so it fits the CV's purpose. That's why the icon is shown to every
  visitor (no hidden flag). Keep its labels in English.
- **To do:**
  - an HTML toggle button like `ThemeButton` (styled in `src/style.css`, focus back to the game)
  - a Pixi overlay container in `MainScene`, redrawn each frame only while on, with positions
    converted through `IsometricConverter`
  - expose the data from pure getters (e.g. `Player` speed/direction) and build the overlay
    data in Pixi-free logic so it can be unit tested
  - overlay colours readable on every theme (F-050), and an e2e test for the toggle

### F-052 Chat log

✅ Done

- **What:** a box in the bottom-left corner that keeps every message the game shows the
  visitor, newest at the bottom: Ben's lines ("**Ben**: Do you even know what I do?", his
  answers to a pitch) and game notices in italics ("New intel: Séniorité", "Get closer to
  collect its intel.").
- **How it works:** `ChatLog` (`src/ui/`) is an HTML `<aside aria-label="Messages">` with a
  `role="log"` list, hidden until the first message. `post({ speaker?, text })` appends a line
  built with `textContent` only, drops the oldest past `CHAT_LOG_LIMIT` (50) and scrolls to
  the bottom. `Game` wires it: `IntelInventory` announces new cards through a callback,
  `onIntelOutOfReach` posts the hint, and `PitchFlow` posts Ben's refusals and each result
  line with `speaker: "Ben"`.
- **Code:** `src/ui/ChatLog.ts`, `src/ui/IntelInventory.ts`, `src/ui/PitchFlow.ts`,
  `src/game/Game.ts`, `src/style.css`
- **Tests:** `tests/unit/ui/ChatLog.test.ts` (hidden until used, speakers, plain text, limit),
  `tests/unit/ui/IntelInventory.test.ts`, `tests/unit/ui/PitchFlow.test.ts` (Ben's lines);
  e2e `tests/e2e/intel.spec.ts`, `tests/e2e/pitch.spec.ts`
- **Limits:** display only and local: visitors can't type, and each one sees only their own
  messages (no shared chat between recruiters). The log isn't kept between visits. On small
  phones it can overlap the map's bottom-left corner.

## Story & the dev

### F-060 The dev wanders

✅ Done

- **What:** Ben, the dev (jeans, white shirt, glasses, his name above him), wanders the map on
  his own. The server moves him, so every visitor sees him in the same place.
- **Design:** GAME_DESIGN.md › "Characters".
- **How it works:**
  - `shared/world.ts` holds `DEV_NAME` ("Ben"), `DEV_SPAWN` (18, 18) and `DEV_SPEED`
    (2.4 tiles/s, slower than recruiters' 3).
  - `DevWanderer` (`server/rooms/DevWanderer.ts`) is pure logic: pick a random walkable
    tile up to 5 tiles away on each axis, walk to it in a straight line, pause 0.5–2 s, repeat.
    If the next step isn't walkable (a building or the edge) he drops the target and picks
    another. A step covers at most 0.1 s, so a stalled server can't jump him through a wall.
  - `CvRoom` puts a `DevState` (name, column, row) in `CvRoomState.dev` and calls
    `DevWanderer.update` 20 times a second with `setTimestep`. Clients have no message to
    move him. `DEV_WANDERS=false` keeps him at his spawn (the e2e server uses it, so a
    canvas only changes when a visitor moves).
  - On the client, `RemoteDev` listens to `state.dev`, adds a `Dev` (Pixi drawing,
    `src/game/entities/Dev.ts`) to the world, moves it on every change and logs
    `[DEV] Shown: Ben`. `MainScene` creates it once connected and passes the theme on, so
    his name uses the theme's `label` colour.
- **Code:** `shared/world.ts`, `server/rooms/DevWanderer.ts`, `server/rooms/CvRoom.ts`,
  `server/rooms/CvRoomState.ts`, `src/network/RemoteDev.ts`, `src/game/entities/Dev.ts`,
  `src/scenes/MainScene.ts`
- **Tests:** `tests/unit/server/rooms/DevWanderer.test.ts` (speed, pause, buildings,
  stalls, a long seeded walk), `tests/unit/shared/world.test.ts` (spawn, slower than
  recruiters), `tests/unit/game/entities/Dev.test.ts`, `tests/unit/scenes/MainScene.test.ts`;
  integration `tests/integration/server/CvRoom.test.ts` ("the dev"),
  `tests/integration/network/RemoteDev.test.ts`; e2e "shows the dev, Ben, on the map"
- **Limits:**
  - Only with the server: in single-player mode (F-023) there's no Ben.
  - He jumps between server updates (20 per second) with no smoothing on the client.
  - He can walk through recruiters (he runs from them, F-061, but doesn't collide).
  - His outfit doesn't follow the theme yet (Simpsons yellow, South Park cut-out).
  - Each room has its own Ben; with one room (max 10 visitors) that's the same for everyone.

### F-061 The dev runs away

✅ Done

- **What:** when recruiters come within 4 tiles, Ben runs away from them. He's slower than
  them (2.4 vs 3 tiles/s) but sprints when one gets very close, so a recruiter can't run him
  down in the open: they catch him by pinning him against a building or the map edge, or by
  closing in from two sides.
- **Design:** GAME_DESIGN.md › "Characters".
- **How it works:**
  - `DEV_FLEE_RADIUS` (4 tiles) and `DEV_SPRINT` are in `shared/world.ts`.
  - Each server tick, `CvRoom` passes every recruiter's position to `DevWanderer.update`.
    `threatsWithin` (`server/rooms/flee.ts`) keeps the ones inside the radius. If there are
    any, he drops his wander target and pause and takes a `fleeStep`; once none is left he
    picks a new wander target straight away.
  - `fleeStep` tries a step in 16 directions and keeps the walkable one that puts him
    farthest from the recruiters, each weighted by 1 / its current distance, so the closest
    counts most. Two recruiters on opposite sides make him slip out sideways. If no step beats
    standing still, he stays put: that's being cornered. The direction vectors are rounded so a
    step along the map edge stays on the map.
  - **Sprint:** when a recruiter is within 1.5 tiles and he's not cooling down, he runs at
    4 tiles/s for 1 s, then can't sprint for 1.5 s. A sprint gains 1 tile on a recruiter and
    the cooldown loses 0.9, so a straight chase never closes the gap in the open. Timers ignore
    leftovers under 1e-9 s (floating-point rounding would otherwise add a tick).
- **Code:** `server/rooms/flee.ts`, `server/rooms/DevWanderer.ts`, `server/rooms/CvRoom.ts`,
  `shared/world.ts`
- **Tests:** `tests/unit/server/rooms/flee.test.ts` (open ground, two recruiters, closest
  first, map edge, buildings, cornered), `tests/unit/server/rooms/DevWanderer.test.ts`
  ("with recruiters nearby", "sprinting": trigger, duration and cooldown, a simulated straight
  chase that only catches him against the map edge, and two recruiters catching him faster),
  `tests/unit/shared/world.test.ts` (a sprint gains more than the cooldown loses),
  `tests/integration/server/CvRoom.test.ts` ("runs away from a recruiter who comes close",
  with `Math.random` fixed so wandering can't fake it). No e2e test: steering a keyboard into
  a moving target is slow and flaky, and the chase simulations cover it.
- **Limits:**
  - He runs straight away from recruiters, so he often ends up against the map edge. He
    doesn't plan an escape route or avoid walls ahead of time.
  - Visitors can't see when he sprints (no animation or sign yet).
  - Catching him (touching him, then the pitch) is F-042.
  - He only reacts to recruiters' last positions from the server, at 20 updates a second.

### F-062 Dev speech bubbles

✅ Done (phase 4)

- **What:** Ben taunts the visitor in a short bubble above his head: a "close" line when a
  recruiter comes within 4 tiles ("Not open to work… unless it's remote."), an "idle" line
  after a long quiet spell ("Just one more commit…"). Each line is also posted to the chat
  log as "Ben: …".
- **Design:** GAME_DESIGN.md › "Tone" (example lines).
- **How it works:**
  - `DEV_BUBBLE_LINES` (`src/config/devLines.ts`): the lines, at most 60 characters each.
  - `DevChatter` (`src/game/`, pure) is fed Ben's and the visitor's positions each frame.
    It says a "close" line once per approach (within `DEV_FLEE_RADIUS`), an "idle" line after
    20 s with the visitor far away, waits at least 8 s between lines and never repeats the
    same line twice in a row.
  - `Dev.say` shows the bubble for 3.5 s and `Dev.update` ages it; the bubble size is
    estimated from the text, not measured, because tests have no canvas. `RemoteDev` exposes
    `gridPosition`, `say` and `update`.
  - `MainScene.updateDevChatter` runs only when the scene isn't paused and Ben's position
    has arrived. It shows the line and calls the `onDevLine` option; `Game` posts it to the
    chat log.
  - Client-only, per visitor: a bubble changes nothing in the game, so there is no server rule.
- **Code:** `src/config/devLines.ts`, `src/game/DevChatter.ts`, `src/game/entities/Dev.ts`,
  `src/network/RemoteDev.ts`, `src/scenes/MainScene.ts`, `src/game/Game.ts`
- **Tests:** `tests/unit/game/DevChatter.test.ts`, `tests/unit/game/entities/Dev.test.ts`
  ("speech bubble"), `tests/unit/scenes/MainScene.test.ts` ("Ben's speech bubbles"),
  `tests/integration/network/RemoteDev.test.ts`
- **Limits:** each visitor sees only the bubble triggered by their own position, not other
  recruiters'. There is none in single-player mode (F-023), where Ben doesn't exist. The
  lines are few (7).

### F-063 Recruiter-spam hazards

✅ Done (phase 4), server-authoritative

- **What:** "exciting opportunity" emails fly across the map and slow down the recruiters
  they hit: half speed for 2 s ("mild", the owner's choice). The chat log says "Spam! An
  exciting opportunity slows you down."
- **Design:** GAME_DESIGN.md › "Hazards".
- **How it works:**
  - `SPAM` (`shared/spam.ts`): at most 2 emails at once, the first after 1 s then one every
    5 s, 5 tiles/s, a hit within 0.6 tile, `slowFactor` 0.5 for `slowSeconds` 2.
    `spamSubject(id)` picks the subject shown from `SPAM_SUBJECTS`.
  - `SpamStorm` (`server/rooms/SpamStorm.ts`) is pure, like `DevWanderer`. It aims each
    email along a random recruiter's row or column from just outside the map edge. Emails fly
    over buildings. A hit removes the email and slows the recruiter (a new hit restarts the
    timer). A step covers at most 0.1 s and floating-point leftovers are ignored.
  - `CvRoom` runs it in the 20 Hz loop (the timestep runs when the dev wanders or spam
    flies). `updateSpam` calls `setSlowed`: it sets `PlayerState.slowed` and
    `MoveBudget.setRefillRate`, so the budget refills at `PLAYER_SPEED` × `SPEED_TOLERANCE`
    × `slowFactor` while slowed. `syncEmails` copies the flying emails into
    `CvRoomState.emails` (`EmailState`: id, column, row). `SPAM_FLIES=false` turns it off.
  - On the client, `RemoteSpam` draws each email as a `SpamEmail` (envelope and subject in
    the theme's `label` colour) and watches the visitor's own `slowed`, reporting only
    changes (`onSlowedChange`). `MainScene` calls `Player.setSpeedFactor` and `Game` posts
    the chat message.
- **Code:** `shared/spam.ts`, `server/rooms/SpamStorm.ts`, `server/rooms/CvRoom.ts`,
  `server/rooms/CvRoomState.ts`, `server/rooms/MoveBudget.ts`, `src/game/entities/SpamEmail.ts`,
  `src/network/RemoteSpam.ts`, `src/game/Player.ts`, `src/scenes/MainScene.ts`, `src/game/Game.ts`
- **Tests:** `tests/unit/server/rooms/SpamStorm.test.ts`, `tests/unit/server/rooms/MoveBudget.test.ts`
  ("changing the refill rate"), `tests/unit/shared/spam.test.ts`,
  `tests/unit/game/entities/SpamEmail.test.ts`, `tests/unit/game/Player.test.ts` ("slowed down
  by spam"), `tests/unit/scenes/MainScene.test.ts`; integration
  `tests/integration/server/CvRoom.test.ts` ("spam emails", including "rejects moves faster
  than the slowed speed"), `tests/integration/network/RemoteSpam.test.ts`. The test helper
  `useColyseusServer` sets `SPAM_FLIES=false`; the spam tests turn it on.
- **Limits:**
  - Emails aren't predicted on the client: they jump 20 times a second.
  - A slowed client can still burst 1 tile (the budget capacity is unchanged).
  - The slowdown reaches the client one patch late; the speed tolerance absorbs it.
  - Off in e2e (`playwright.config.ts` sets `SPAM_FLIES=false`), so a canvas only changes when a
    visitor moves.

## Minigames

### F-070 Minigame framework

✅ Done (phase 3): the framework; the minigames are F-071, F-072 and F-074

- **What:** opening a building that has a minigame, from up close and without its card yet,
  starts the minigame on a board over the map instead of opening the CV panel. Win or lose,
  the section's CV panel opens afterwards, so everyone reads the CV; a win also earns the
  card (F-031). Escape quits (a loss). The result goes to the chat log ("SKILLS PARK: you won!"
  or "…: not this time. The answers are in the CV.").
- **Design:** GAME_DESIGN.md › "Minigames" and "Core loop".
- **How it works:**
  - `Minigame` (`src/game/minigames/Minigame.ts`) is the contract: a `view` to draw in,
    `update(deltaSeconds)`, optional `resize` and `applyTheme`, `destroy`, and a `finish({ won })`
    callback given at creation. A `MinigameDefinition` adds the title and the `create` factory.
  - `createMinigames(cv)` (`src/scenes/minigames/registry.ts`) maps a CV section to its
    definition. `Game` passes the CV in, because scenes can't import content.
  - `ChoiceButton` (`src/game/minigames/`) is the accessible button the choice-based
    minigames share: Tab turns it into a real `<button>` named after its text, and a result
    shows as a ✓ or ✗ prefix, not by colour alone. `shuffle.ts` shuffles the options.
  - `MainScene.openBuilding` plays the minigame only when the building has one, the visitor
    stands within `INTEL_REACH` and doesn't hold its card. A building without a
    minigame would keep the interim rule (panel + card up close); every building has one now,
    but the code path stays. `minigameEnded` runs `collectIntel` after a win, so the server
    still checks reach and duplicates.
  - `MinigameFlow` (`src/scenes/`, wired by `Game`, testable without WebGL) pauses and hides
    the map, plays, posts the result, calls `minigameEnded`, then opens the CV panel, whose
    closing resumes the map.
  - `MinigameScene` runs one minigame at a time on a board centred on the screen (at most
    720×540, leaving room for the HTML UI) in the theme's tile colours, with the title in its
    `label` colour. It forwards frames, resizes and theme changes, handles Escape, and removes
    and destroys the minigame once it ends (only the first `finish` counts).
  - The unused `BootScene` and `CvScene` placeholders were removed.
- **Code:** `src/game/minigames/Minigame.ts`, `src/scenes/MinigameScene.ts`,
  `src/scenes/MinigameFlow.ts`, `src/scenes/minigames/registry.ts`, `src/game/minigames/ChoiceButton.ts`,
  `src/game/minigames/shuffle.ts`, `src/scenes/MainScene.ts`, `src/game/Game.ts`
- **Tests:** e2e `tests/e2e/minigames.spec.ts` (up close, Escape, panel, no card), `tests/unit/scenes/MinigameScene.test.ts` (board size on desktop and phone, theme,
  frames, result and cleanup, only the first end counts, Escape, one at a time, resize,
  destroy), `tests/unit/scenes/MinigameFlow.test.ts` (order of steps, panel after a loss,
  buildings without a minigame), `tests/unit/game/minigames/ChoiceButton.test.ts`,
  `tests/unit/game/minigames/shuffle.test.ts`, `tests/unit/scenes/minigames/registry.test.ts`,
  `tests/unit/scenes/MainScene.test.ts` ("with a minigame":
  in reach, too far, card held, other buildings, card after a win only)
- **Limits:**
  - The result is reported by the client, so a modified client could fake a win (accepted in
    GAME_DESIGN.md › "Technical principles"). The server still checks reach and duplicates.
  - Too far from a building with a minigame, the panel opens as before with "Get closer to
    collect its intel." There's no replay once the card is held.
  - Ben keeps running on the server while a minigame is played.

### F-071 Skills Park: buzzword catcher

✅ Done (phase 3)

- **What:** opening SKILLS from up close (F-070) plays it. Words fall from the top of the
  board; a basket moved with ←/→ (Q/D, A/D) or the mouse catches them. The dev's real stack
  scores 1 point, anything else costs 2 (never below 0). 6 points within 40 s wins the
  "Stack principale" card (F-031); time out or Escape is a loss. The CV panel opens either way.
- **Design:** GAME_DESIGN.md › "Skills Park: buzzword catcher".
- **How it works:**
  - `catcherRules.ts` holds the rules as pure functions over a `CatcherState` whose positions
    are fractions of the board (so a resize only rescales): `stepCatcher` moves the basket
    (keys, or towards the pointer at the same speed), spawns a word every 0.9 s (60 % from
    the stack), drops them and scores those reaching the basket; `catcherOutcome` says
    playing / won / lost. Tuning values are in `CATCHER_RULES`. Long frames are capped at
    0.1 s so a hidden tab doesn't skip the game.
  - `items.ts` takes the words from `shared/`, so nothing is copied: to catch,
    `DEV_PREFERENCES.stack`; to dodge, the stacks the pitch turns down (`STACK_OPTIONS` with a
    reply: Java, Spring, Python, Django, COBOL) and a few pure buzzwords ("Synergy",
    "Blockchain-native", "Rockstar", …).
  - `BuzzwordCatcher` implements `Minigame`: it draws the score, time and instructions, the
    words (all alike, in the theme's `label` colour: telling them apart is the game) and the
    basket, reads the keyboard and `pointermove`, and calls `finish` once. `BUZZWORD_CATCHER`
    is registered for `skills` in `MINIGAMES`.
- **Code:** `src/game/minigames/buzzwordCatcher/catcherRules.ts`, `items.ts`,
  `BuzzwordCatcher.ts`, `src/scenes/minigames/registry.ts`
- **Tests:** `tests/unit/game/minigames/buzzwordCatcher/catcherRules.test.ts` (spawn, basket
  bounds and pointer, scoring, floor at 0, misses, win, time out, frame cap, frozen when over,
  a perfect player wins in time), `items.test.ts` (stack words are CV skills, no overlap),
  `BuzzwordCatcher.test.ts` (HUD, theme, keys, pointer, win, loss, one end, cleanup); e2e
  `tests/e2e/minigames.spec.ts` (play from up close, Escape, CV panel, no card)
- **Limits:**
  - Words are text, not logos (no image assets or trademarks to manage).
  - The e2e test covers quitting, not winning: a win is random and needs ~20 s of play, so it
    is covered by the unit tests (`BuzzwordCatcher`, and `MainScene` for the card).
  - On a touch screen the basket follows a finger dragged over the board; there are no
    on-screen buttons.
  - Only the 8 stack words score; other CV skills (MySQL, RabbitMQ, Cypress…) don't fall.

### F-072 Experience Avenue: career timeline

✅ Done (phase 4)

- **What:** opening EXPERIENCE from up close (F-070) plays it. Five random jobs from the CV,
  labelled "Company — role", are shown shuffled; the visitor taps them from oldest to newest.
  A wrong pick is marked ✗ until the next pick. 3 mistakes or 60 s is a loss; placing all five
  wins the "Séniorité" card (F-031). The CV panel opens either way.
- **Design:** GAME_DESIGN.md › "Experience Avenue: career timeline". Built as "tap the jobs
  from oldest to newest" rather than dragging cards, so the cards are accessible buttons.
- **How it works:**
  - `timelineRules.ts` is pure: `timelineCards` draws and shuffles the jobs, `pickJob`
    says right, wrong or ignored (jobs starting the same month are interchangeable),
    `timelineOutcome` says playing, won or lost. Frames are capped at 0.1 s. Tuning values are
    in `TIMELINE_RULES`.
  - `CareerTimeline` implements `Minigame` with `ChoiceButton`s, so Tab + Enter plays it.
    `careerTimeline(cv)` is registered for `experience`.
- **Code:** `src/game/minigames/careerTimeline/timelineRules.ts`, `CareerTimeline.ts`,
  `src/scenes/minigames/registry.ts`
- **Tests:** `tests/unit/game/minigames/careerTimeline/timelineRules.test.ts`,
  `CareerTimeline.test.ts`; e2e `tests/e2e/intel.spec.ts` ("winning a building's minigame up
  close earns its card", through the accessibility buttons)
- **Limits:** there is no replay once the card is held.

### F-073 Projects Lab: match-up

💡 Idea

- **What:** match each project to its technology and description.
- **Blocked:** the CV has no projects yet; the owner chose to skip it for now.

### F-074 Education Campus: quiz

✅ Done (phase 4)

- **What:** opening EDUCATION from up close (F-070) plays a three-question multiple-choice
  quiz about the education section: the diploma, the school and the languages. The wrong
  answers are jokes. 2 right answers out of 3 win the "Formation & langues" card (F-031). The
  right answer shows for 1.5 s after each pick. The CV panel opens either way.
- **Design:** GAME_DESIGN.md › "Education Campus: quiz".
- **How it works:**
  - `quizRules.ts` is pure: `quizQuestions(cv)` builds the questions from the CV, so they
    never disagree with it, and skips a question the CV has no data for. Tuning values are in
    `QUIZ_RULES`.
  - `EducationQuiz` implements `Minigame` with `ChoiceButton`s. `educationQuiz(cv)` is
    registered for `education`.
- **Code:** `src/game/minigames/educationQuiz/quizRules.ts`, `EducationQuiz.ts`,
  `src/scenes/minigames/registry.ts`, `shared/intel.ts`, `src/content/intel.ts`
- **Tests:** `tests/unit/game/minigames/educationQuiz/quizRules.test.ts`,
  `EducationQuiz.test.ts`, `tests/unit/content/intel.test.ts`, `tests/unit/shared/intel.test.ts`,
  `tests/unit/ui/IntelInventory.test.ts`. No e2e test.
- **Limits:** the questions are in English, the answers in French (as in the CV). There is no
  replay once the card is held.

## Delivery & deployment

These features ship the game. They sit outside the "Headhunted" story. Target: one generic
Docker image (Colyseus server + built client) that runs on any container host, with no
provider lock-in.

### F-080 Production server config

✅ Done

- **What:** one Node process serves the built client and the Colyseus room on one port,
  configured by environment variables, without `tsx`.
- **How it works:**
  - `server/index.ts` listens on `PORT` (default `2567`).
  - `server/app.config.ts` passes an `express` hook to `defineServer`; `configureHttp`
    (`server/http.ts`) adds `GET /health` (`{ "status": "ok" }`) and serves the built client
    from `CLIENT_DIR` (default `dist/`, relative to the working directory). In dev and tests
    `dist/` may be missing: those requests just 404.
  - The client asks `serverEndpoint` (`src/network/serverEndpoint.ts`) where to connect:
    `VITE_SERVER_URL` if set at build time, else `http://localhost:2567` under `npm run dev`,
    else the page's own origin. The Colyseus SDK turns `http(s)` into `ws(s)`.
  - `npm run build` type-checks, builds the client into `dist/`, then runs `build:server`:
    Vite in SSR mode (`vite.server.config.ts`) bundles `server/` + `shared/` into
    `build/server/index.js`, with npm packages left external. `npm start` runs it with Node.
- **Code:** `server/index.ts`, `server/app.config.ts`, `server/http.ts`,
  `src/network/serverEndpoint.ts`, `src/network/MultiplayerClient.ts`, `src/vite-env.d.ts`,
  `vite.server.config.ts`, `package.json` scripts
- **Tests:** `tests/unit/server/http.test.ts` (health, static files, 404),
  `tests/unit/network/serverEndpoint.test.ts`, `tests/integration/server/http.test.ts`
  (the real server answers `/health`)
- **Limits:** no compression or cache headers on static files. No SPA fallback (there's only
  one page). `PORT` isn't validated: a non-number fails at `listen`.

### F-081 Docker image

✅ Done: built and smoke-tested by CI since the first push (run 38170704603).

- **What:** a `Dockerfile` that builds one small image running the whole game, plus a
  `compose.yaml` to run it locally with `docker compose up --build`.
- **How it works:** two stages on `node:24-alpine`. The build stage runs `npm ci` and
  `npm run build`. The runtime stage installs production dependencies only, copies `dist/`
  and `build/`, runs as the non-root `node` user on port `2567`, and has a `HEALTHCHECK`
  on `/health`. `npm ci --ignore-scripts` skips the optional native `msgpackr-extract`
  build (Colyseus falls back to plain JS). `.dockerignore` keeps docs, tests output, `.git`
  and `.claude` out of the build context.
- **Code:** `Dockerfile`, `.dockerignore`, `compose.yaml`
- **Tests:** the CI `docker` job (F-082).
- **Limits:** `pixi.js` and
  `@colyseus/sdk` are runtime `dependencies` but only the client bundle needs them, so the
  runtime image installs them for nothing (moving them to `devDependencies` would shrink it).

### F-082 CI builds and smoke-tests the image

✅ Done: green on GitHub since the first push.

- **What:** every push and PR proves the production build works, not only the tests.
- **How it works:** the `check` job in `.github/workflows/ci.yml` now also runs
  `npm run build`. A `docker` job (after `check`) builds the image with Buildx and the
  GitHub Actions layer cache, starts it, polls `/health` for up to 30 s, checks that `/`
  serves the game's `index.html`, and prints the container logs on failure.
- **Code:** `.github/workflows/ci.yml`
- **Next:** optionally run the Playwright
  journeys against the container instead of the dev servers.

### F-083 Publish the image on release

📋 Planned

- **What:** cutting a release publishes a versioned image to a registry, ready to deploy.
- **Depends on:** F-082.
- **To do:**
  - a workflow on `v*` tags that builds and pushes to GitHub Container Registry
    (`ghcr.io/<owner>/cv-game`) with tags `<version>`, `<major>.<minor>` and `latest`, using
    the built-in `GITHUB_TOKEN`
  - only publish once the CI checks pass for that commit
  - add the image step to the `release` skill and the CHANGELOG release notes

### F-084 Deploy to a host

💡 Idea

- **What:** run the published image somewhere public, behind HTTPS so the WebSocket uses
  `wss://`.
- **Design:** the image stays host-agnostic. The host is still open (a VPS with
  `docker compose` + a reverse proxy such as Caddy, or a container platform such as Fly.io,
  Render or Railway). Pick one before moving this to 📋.
- **To do:**
  - choose the host, then write `docs/DEPLOY.md` (env vars, ports, TLS, health check, rollback
    to a previous image tag)
  - optional continuous deployment: deploy the new image automatically after F-083 publishes
    it, with the secrets kept in GitHub environment secrets
  - Colyseus keeps rooms in memory, so run one instance (scaling out needs a presence driver
    such as Redis)

## Removed

### F-024 Competitive rounds

❌ Removed (never built), at the owner's request: not needed.

- **Was:** every recruiter hunts the same dev; the first good pitch wins the round ("🏆 Alice
  (SynergyCorp) hired the dev in 2:13"), then the dev escapes and a new round starts.
- **Instead:** each recruiter catches and pitches Ben on their own. A hire ends nothing for
  the others (GAME_DESIGN.md › "Multiplayer").
