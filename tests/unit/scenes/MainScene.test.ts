// @vitest-environment happy-dom
import { Container, EventEmitter, Text, type Renderer } from "pixi.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BUILDINGS } from "../../../shared/buildings";
import { DISTRICTS } from "../../../shared/districts";
import type { IntelCardId } from "../../../shared/intel";
import type { PitchEvent, PitchOffer } from "../../../shared/pitch";
import type { RecruiterIdentity } from "../../../shared/recruiters";
import { SPAM } from "../../../shared/spam";
import {
  createWorldCollisions,
  isWalkable,
  MAP_SIZE,
  MOVE_SEND_INTERVAL_MS,
  PLAYER_SPAWN,
} from "../../../shared/world";
import { DEFAULT_THEME, THEMES, type Theme } from "../../../src/config/themes";
import { Building } from "../../../src/game/entities/Building";
import { Chest } from "../../../src/game/entities/Chest";
import { DistrictGround } from "../../../src/game/entities/DistrictGround";
import { GameMap } from "../../../src/game/Map";
import { Player } from "../../../src/game/Player";
import {
  MainScene,
  type MainSceneOptions,
} from "../../../src/scenes/MainScene";
import { pressKey, releaseKey } from "../../helpers/keyboard";

const HOMER: RecruiterIdentity = {
  name: "Homer",
  company: "Springfield Nuclear",
};

// The network is the boundary: fake it so the scene can be tested without a server.
// (Real client/server behaviour is covered in tests/integration/network/.)
const network = vi.hoisted(() => ({
  connect: vi.fn<(identity?: RecruiterIdentity) => Promise<void>>(),
  connected: false,
  send: vi.fn(),
  disconnect: vi.fn(async () => {}),
  /** What the scene passed to `connect` to hear about a lost connection (F-023). */
  onLost: undefined as (() => void) | undefined,
}));

vi.mock("../../../src/network/MultiplayerClient", () => ({
  MultiplayerClient: class {
    connect = (identity?: RecruiterIdentity, onLost?: () => void) => {
      network.onLost = onLost;
      return network.connect(identity);
    };
    isConnected = () => network.connected;
    getRoom = () => ({ send: network.send });
    disconnect = () => network.disconnect();
  },
}));

const remotePlayers = vi.hoisted(() => ({ destroy: vi.fn() }));

vi.mock("../../../src/network/RemotePlayersManager", () => ({
  RemotePlayersManager: class {
    applyTheme() {}
    destroy = remotePlayers.destroy;
  },
}));

const remoteDev = vi.hoisted(() => ({
  created: vi.fn(),
  applyTheme: vi.fn(),
  say: vi.fn(),
  update: vi.fn(),
  destroy: vi.fn(),
}));

/** Where the fake server says Ben is (F-062); undefined until his state arrives. */
const devState = vi.hoisted(() => ({
  gridPosition: undefined as { column: number; row: number } | undefined,
}));

vi.mock("../../../src/network/RemoteDev", () => ({
  RemoteDev: class {
    constructor() {
      remoteDev.created();
    }
    get gridPosition() {
      return devState.gridPosition;
    }
    applyTheme = remoteDev.applyTheme;
    say = remoteDev.say;
    update = remoteDev.update;
    destroy = remoteDev.destroy;
  },
}));

const localIntel = vi.hoisted(() => ({
  onChange: undefined as ((cards: IntelCardId[]) => void) | undefined,
  destroy: vi.fn(),
}));

vi.mock("../../../src/network/LocalIntel", () => ({
  LocalIntel: class {
    constructor(_room: unknown, onChange: (cards: IntelCardId[]) => void) {
      localIntel.onChange = onChange;
    }
    destroy = localIntel.destroy;
  },
}));

const pitchChannel = vi.hoisted(() => ({
  onEvent: undefined as ((event: PitchEvent) => void) | undefined,
  pitch: vi.fn(),
  cancel: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("../../../src/network/PitchChannel", () => ({
  PitchChannel: class {
    constructor(_room: unknown, onEvent: (event: PitchEvent) => void) {
      pitchChannel.onEvent = onEvent;
    }
    pitch = pitchChannel.pitch;
    cancel = pitchChannel.cancel;
    destroy = pitchChannel.destroy;
  },
}));

const remoteSpam = vi.hoisted(() => ({
  onSlowedChange: undefined as ((slowed: boolean) => void) | undefined,
  applyTheme: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("../../../src/network/RemoteSpam", () => ({
  RemoteSpam: class {
    constructor(
      _world: unknown,
      _converter: unknown,
      _room: unknown,
      onSlowedChange: (slowed: boolean) => void,
    ) {
      remoteSpam.onSlowedChange = onSlowedChange;
    }
    applyTheme = remoteSpam.applyTheme;
    destroy = remoteSpam.destroy;
  },
}));

/** The server says this visitor is (no longer) slowed by spam. */
function serverSetsSlowed(slowed: boolean): void {
  remoteSpam.onSlowedChange?.(slowed);
}

/** Like Pixi's renderer, it emits "resize" once its new size is set. */
function fakeRenderer(width = 1280, height = 720): Renderer {
  return Object.assign(new EventEmitter(), {
    width,
    height,
    background: { color: 0 },
  }) as unknown as Renderer;
}

function createScene(
  renderer = fakeRenderer(),
  options: MainSceneOptions = {},
) {
  const scene = new MainScene(renderer, options);
  const world = scene.children[0];
  const ofType = <T>(type: abstract new (...args: never[]) => T) =>
    world.children.filter(
      (child): child is Container & T => child instanceof type,
    );

  return { scene, world, renderer, ofType };
}

describe("MainScene", () => {
  beforeEach(() => {
    network.connected = false;
    network.connect.mockResolvedValue(undefined);
  });

  describe("world setup", () => {
    // The server validates moves with the shared rules: the client must agree on every tile,
    // or players would be snapped back (client says yes, server says no) or stuck.
    it("agrees with the server's walkability rule on every tile", () => {
      const { ofType } = createScene();
      const [map] = ofType(GameMap);
      const serverCollisions = createWorldCollisions();
      const disagreements: string[] = [];

      for (let row = -1; row <= MAP_SIZE.rows; row += 1) {
        for (let column = -1; column <= MAP_SIZE.columns; column += 1) {
          const tile = { column, row };
          if (map.canWalkTo(tile) !== isWalkable(tile, serverCollisions)) {
            disagreements.push(`(${column}, ${row})`);
          }
        }
      }

      expect(disagreements).toEqual([]);
    });

    it("contains the map, every configured building, the chest and the player", () => {
      const { ofType } = createScene();

      expect(ofType(GameMap)).toHaveLength(1);
      expect(ofType(Building).map((building) => building.title)).toEqual(
        BUILDINGS.map((definition) => definition.title),
      );
      expect(ofType(Chest)).toHaveLength(1);
      expect(ofType(Player)).toHaveLength(1);
    });

    // F-005: on the map itself, so depth sorting never puts them over characters.
    it("paints every district on the map, under the buildings and characters", () => {
      const { ofType } = createScene();
      const [map] = ofType(GameMap);
      const grounds = map.children.filter(
        (child) => child instanceof DistrictGround,
      );

      expect(grounds.map((ground) => ground.district)).toEqual([...DISTRICTS]);
      expect(ofType(DistrictGround)).toEqual([]);
    });

    it.each(BUILDINGS)("blocks the footprint of $title", (definition) => {
      const { ofType } = createScene();
      const [map] = ofType(GameMap);
      const { column, row } = definition.gridPosition;

      expect(map.canWalkTo({ column, row })).toBe(false);
      expect(
        map.canWalkTo({
          column: column + definition.width - 1,
          row: row + definition.height - 1,
        }),
      ).toBe(false);
    });

    // Pixi resizes the renderer a frame after the window's "resize": the camera must wait
    // for the renderer's own event, or it fits the map to the old size.
    it("refits the camera once the renderer has its new size", () => {
      const { world, renderer } = createScene(fakeRenderer(1920, 1080));
      expect(world.scale.x).toBe(1);

      Object.assign(renderer, { width: 400, height: 300 });
      renderer.emit("resize", 400, 300, 1);

      expect(world.scale.x).toBeLessThan(1);
    });
  });

  // F-004
  describe("depth sorting", () => {
    it("draws objects lower on screen in front", () => {
      const { scene, world } = createScene();

      scene.update(1 / 60);

      for (const child of world.children) {
        expect(child.zIndex).toBe(child.y);
      }
      const order = world.children.map((child) => child.zIndex);
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });

    it("also sorts objects added later, such as remote visitors", () => {
      const { scene, world } = createScene();
      const front = world.addChild(new Container());
      const back = world.addChild(new Container());
      front.y = 10_000;
      back.y = -10_000;

      scene.update(1 / 60);

      expect(world.children[0]).toBe(back);
      expect(world.children.at(-1)).toBe(front);
    });
  });

  // F-050
  describe("applyTheme", () => {
    it.each(THEMES)("recolours the background and map for $name", (theme) => {
      const { scene, renderer, ofType } = createScene();

      scene.applyTheme(theme);

      expect(renderer.background.color).toBe(theme.background);
      expect(ofType(GameMap)[0].theme).toBe(theme);
      expect(document.documentElement.dataset.theme).toBe(theme.id);
    });

    // F-005
    it("recolours every district's name", () => {
      const { scene, ofType } = createScene();
      const theme: Theme = { ...DEFAULT_THEME, id: "test", label: 0xabcdef };

      scene.applyTheme(theme);

      const grounds = ofType(GameMap)[0].children.filter(
        (child) => child instanceof DistrictGround,
      );
      for (const ground of grounds) {
        const [name] = ground.children.filter((child) => child instanceof Text);
        expect(name.style.fill).toBe(theme.label);
      }
    });

    it("recolours every building's title", () => {
      const { scene, ofType } = createScene();
      const theme: Theme = { ...DEFAULT_THEME, id: "test", label: 0xabcdef };

      scene.applyTheme(theme);

      for (const building of ofType(Building)) {
        const [title] = building.children.filter(
          (child) => child instanceof Text,
        );
        expect(title.style.fill).toBe(theme.label);
      }
    });
  });

  // F-030
  describe("opening a building", () => {
    it.each(BUILDINGS)(
      "reports the $section section when $title is tapped up close",
      (definition) => {
        const onBuildingSelected = vi.fn();
        const { ofType } = createScene(fakeRenderer(), { onBuildingSelected });
        const building = ofType(Building).find(
          (candidate) => candidate.title === definition.title,
        )!;
        // Next to the building's top corner.
        vi.spyOn(ofType(Player)[0], "getGridPosition").mockReturnValue({
          column: definition.gridPosition.column - 1,
          row: definition.gridPosition.row,
        });

        building.emit("pointertap", undefined as never);

        expect(onBuildingSelected).toHaveBeenCalledExactlyOnceWith(
          definition.section,
        );
      },
    );

    it("ignores a press that isn't a full tap (e.g. starting a drag)", () => {
      const onBuildingSelected = vi.fn();
      const { ofType } = createScene(fakeRenderer(), { onBuildingSelected });

      ofType(Building)[0].emit("pointerdown", undefined as never);

      expect(onBuildingSelected).not.toHaveBeenCalled();
    });

    it("works without a listener", () => {
      const { ofType } = createScene();

      expect(() =>
        ofType(Building)[0].emit("pointertap", undefined as never),
      ).not.toThrow();
    });
  });

  // F-031. SKILLS covers columns 5–7, rows 5–6; the chest is at (21, 21); spawn is (12, 12).
  describe("collecting intel", () => {
    async function joinedScene(options: MainSceneOptions = {}) {
      network.connected = true;
      network.send.mockClear();
      localIntel.onChange = undefined;
      const scene = createScene(fakeRenderer(), options);
      scene.scene.join(HOMER);
      await vi.waitFor(() => expect(localIntel.onChange).toBeDefined());
      const [player] = scene.ofType(Player);
      const standAt = (column: number, row: number) =>
        vi.spyOn(player, "getGridPosition").mockReturnValue({ column, row });
      const tap = (target: Container) =>
        target.emit("pointertap", undefined as never);
      const skills = scene
        .ofType(Building)
        .find((building) => building.title === "SKILLS")!;
      const [chest] = scene.ofType(Chest);

      return { ...scene, standAt, tap, skills, chest };
    }

    it("asks the server for a building's card when opened up close", async () => {
      const { standAt, tap, skills } = await joinedScene();
      standAt(6, 7);

      tap(skills);

      expect(network.send).toHaveBeenCalledExactlyOnceWith("collect-intel", {
        source: "skills",
      });
    });

    it("asks for the chest's card when it's tapped up close", async () => {
      const { scene, standAt, tap, chest } = await joinedScene();
      standAt(21, 20);
      scene.update(0);

      tap(chest);

      expect(network.send).toHaveBeenCalledExactlyOnceWith("collect-intel", {
        source: "chest",
      });
    });

    it("doesn't open a building from too far, and says to get closer", async () => {
      const onBuildingOutOfReach = vi.fn();
      const onBuildingSelected = vi.fn();
      const { standAt, tap, skills } = await joinedScene({
        onBuildingOutOfReach,
        onBuildingSelected,
      });
      standAt(PLAYER_SPAWN.column, PLAYER_SPAWN.row);

      tap(skills);

      expect(network.send).not.toHaveBeenCalled();
      expect(onBuildingOutOfReach).toHaveBeenCalledExactlyOnceWith("skills");
      expect(onBuildingSelected).not.toHaveBeenCalled();
    });

    it("shows a building as clickable only within reach", async () => {
      const { scene, standAt, skills } = await joinedScene();

      standAt(PLAYER_SPAWN.column, PLAYER_SPAWN.row);
      scene.update(0);
      expect(skills.cursor).toBe("default");

      standAt(6, 7);
      scene.update(0);
      expect(skills.cursor).toBe("pointer");
    });

    // F-040
    it("reveals the chest only within reach", async () => {
      const { scene, standAt, chest } = await joinedScene();

      standAt(PLAYER_SPAWN.column, PLAYER_SPAWN.row);
      scene.update(0);
      expect(chest.revealed).toBe(false);

      standAt(21, 20);
      scene.update(0);
      expect(chest.revealed).toBe(true);
    });

    it("doesn't ask again for a card already held", async () => {
      const onIntelOutOfReach = vi.fn();
      const { standAt, tap, skills } = await joinedScene({ onIntelOutOfReach });
      localIntel.onChange?.(["stack"]);
      standAt(6, 7);

      tap(skills);

      expect(network.send).not.toHaveBeenCalled();
      expect(onIntelOutOfReach).not.toHaveBeenCalled();
    });

    it("passes the cards the server gives on to the UI", async () => {
      const onIntelChange = vi.fn();
      await joinedScene({ onIntelChange });

      localIntel.onChange?.(["work-mode", "stack"]);

      expect(onIntelChange).toHaveBeenLastCalledWith(["work-mode", "stack"]);
    });

    it("does nothing without the server (single-player)", () => {
      network.connected = false;
      network.send.mockClear();
      const onIntelOutOfReach = vi.fn();
      const { ofType } = createScene(fakeRenderer(), { onIntelOutOfReach });

      ofType(Chest)[0].emit("pointertap", undefined as never);

      expect(network.send).not.toHaveBeenCalled();
      expect(onIntelOutOfReach).not.toHaveBeenCalled();
    });

    // F-070: a building with a minigame plays it first; a win claims the card.
    describe("with a minigame", () => {
      async function minigameScene() {
        const onMinigameRequested = vi.fn(async () => {});
        const onBuildingSelected = vi.fn();
        const scene = await joinedScene({ onBuildingSelected });
        scene.scene.setMinigames({
          hasMinigame: (section) => section === "skills",
          start: onMinigameRequested,
        });

        return { ...scene, onMinigameRequested, onBuildingSelected };
      }

      it("starts the minigame instead of opening the panel or asking for the card", async () => {
        const {
          standAt,
          tap,
          skills,
          onMinigameRequested,
          onBuildingSelected,
        } = await minigameScene();
        standAt(6, 7);

        tap(skills);

        expect(onMinigameRequested).toHaveBeenCalledExactlyOnceWith("skills");
        expect(onBuildingSelected).not.toHaveBeenCalled();
        expect(network.send).not.toHaveBeenCalled();
      });

      it("neither plays nor opens the panel from too far", async () => {
        const {
          standAt,
          tap,
          skills,
          onMinigameRequested,
          onBuildingSelected,
        } = await minigameScene();
        standAt(PLAYER_SPAWN.column, PLAYER_SPAWN.row);

        tap(skills);

        expect(onMinigameRequested).not.toHaveBeenCalled();
        expect(onBuildingSelected).not.toHaveBeenCalled();
      });

      it("opens the panel straight away once the card is held", async () => {
        const {
          standAt,
          tap,
          skills,
          onMinigameRequested,
          onBuildingSelected,
        } = await minigameScene();
        localIntel.onChange?.(["stack"]);
        standAt(6, 7);

        tap(skills);

        expect(onMinigameRequested).not.toHaveBeenCalled();
        expect(onBuildingSelected).toHaveBeenCalledExactlyOnceWith("skills");
      });

      it("leaves buildings without a minigame unchanged", async () => {
        const { standAt, tap, ofType, onMinigameRequested } =
          await minigameScene();
        const experience = ofType(Building).find(
          (building) => building.title === "EXPERIENCE",
        )!;
        standAt(
          experience.gridPosition.column,
          experience.gridPosition.row - 1,
        );

        tap(experience);

        expect(onMinigameRequested).not.toHaveBeenCalled();
        expect(network.send).toHaveBeenCalledExactlyOnceWith("collect-intel", {
          source: "experience",
        });
      });

      it("asks the server for the card after a win, and not after a loss", async () => {
        const { scene, standAt } = await minigameScene();
        standAt(6, 7);

        scene.minigameEnded("skills", { won: false });
        expect(network.send).not.toHaveBeenCalled();

        scene.minigameEnded("skills", { won: true });
        expect(network.send).toHaveBeenCalledExactlyOnceWith("collect-intel", {
          source: "skills",
        });
      });
    });

    it("stops following the cards when destroyed", async () => {
      localIntel.destroy.mockClear();
      const { scene } = await joinedScene();

      scene.destroy();

      expect(localIntel.destroy).toHaveBeenCalledOnce();
    });
  });

  // F-042: the server decides; the scene passes its events on and the offers back.
  describe("pitching", () => {
    const OFFER: PitchOffer = {
      stack: "php",
      workMode: "remote",
      role: "tech-lead",
      line: "read-cv",
    };

    async function joinedScene(options: MainSceneOptions = {}) {
      network.connected = true;
      pitchChannel.onEvent = undefined;
      pitchChannel.pitch.mockClear();
      pitchChannel.cancel.mockClear();
      pitchChannel.destroy.mockClear();
      const created = createScene(fakeRenderer(), options);
      created.scene.join(HOMER);
      await vi.waitFor(() => expect(pitchChannel.onEvent).toBeDefined());

      return created;
    }

    it("passes the server's pitch events on", async () => {
      const onPitchEvent = vi.fn();
      await joinedScene({ onPitchEvent });

      pitchChannel.onEvent?.({ type: "open" });

      expect(onPitchEvent).toHaveBeenCalledExactlyOnceWith({ type: "open" });
    });

    it("sends an offer, or the dialog being closed, to the server", async () => {
      const { scene } = await joinedScene();

      scene.pitch(OFFER);
      scene.cancelPitch();

      expect(pitchChannel.pitch).toHaveBeenCalledExactlyOnceWith(OFFER);
      expect(pitchChannel.cancel).toHaveBeenCalledOnce();
    });

    it("does nothing without the server (single-player)", () => {
      network.connected = false;
      pitchChannel.pitch.mockClear();
      const { scene } = createScene();

      expect(() => {
        scene.pitch(OFFER);
        scene.cancelPitch();
      }).not.toThrow();
      expect(pitchChannel.pitch).not.toHaveBeenCalled();
    });

    it("stops listening when destroyed", async () => {
      const { scene } = await joinedScene();

      scene.destroy();

      expect(pitchChannel.destroy).toHaveBeenCalledOnce();
    });
  });

  describe("pausing (e.g. while a CV panel is open)", () => {
    it("ignores movement keys while paused", () => {
      const { scene, ofType } = createScene();
      const [player] = ofType(Player);

      scene.setPaused(true);
      pressKey("ArrowRight");
      scene.update(1 / 60);
      releaseKey("ArrowRight");

      expect(player.getGridPosition()).toEqual(PLAYER_SPAWN);
    });

    it("moves again once resumed", () => {
      const { scene, ofType } = createScene();
      const [player] = ofType(Player);
      scene.setPaused(true);

      scene.setPaused(false);
      pressKey("ArrowRight");
      scene.update(1 / 60);
      releaseKey("ArrowRight");

      expect(player.getGridPosition().column).toBeCloseTo(
        PLAYER_SPAWN.column + 0.05,
      );
    });
  });

  describe("multiplayer", () => {
    it("sends the player's moves to the server when connected", () => {
      network.connected = true;
      const { scene } = createScene();

      pressKey("ArrowRight");
      scene.update(1 / 60);
      releaseKey("ArrowRight");

      expect(network.send).toHaveBeenCalledWith("move", {
        column: expect.closeTo(PLAYER_SPAWN.column + 0.05),
        row: PLAYER_SPAWN.row,
      });
    });

    it("sends moves at most once per interval, ending on the latest position", () => {
      network.connected = true;
      const now = vi.spyOn(performance, "now").mockReturnValue(1000);
      const { scene } = createScene();
      network.send.mockClear();

      pressKey("ArrowRight");
      scene.update(1 / 60);
      scene.update(1 / 60);
      scene.update(1 / 60);
      releaseKey("ArrowRight");
      expect(network.send).toHaveBeenCalledOnce();

      now.mockReturnValue(1000 + MOVE_SEND_INTERVAL_MS);
      scene.update(1 / 60);
      now.mockRestore();

      expect(network.send).toHaveBeenCalledTimes(2);
      expect(network.send).toHaveBeenLastCalledWith("move", {
        column: expect.closeTo(PLAYER_SPAWN.column + 0.15),
        row: PLAYER_SPAWN.row,
      });
    });

    // F-023: nothing from the server will move them again, so they must not stay frozen.
    describe("when the connection is lost mid-game", () => {
      async function lostConnection(options: MainSceneOptions = {}) {
        network.connected = true;
        network.connect.mockResolvedValue();
        const created = createScene(fakeRenderer(), options);
        created.scene.join(HOMER);
        await vi.waitFor(() => expect(network.onLost).toBeDefined());
        await vi.waitFor(() => expect(localIntel.onChange).toBeDefined());
        for (const fake of [
          remotePlayers,
          remoteDev,
          localIntel,
          pitchChannel,
          remoteSpam,
        ]) {
          fake.destroy.mockClear();
        }

        network.connected = false;
        network.onLost?.();

        return created;
      }

      it("removes the other visitors, Ben and the spam emails", async () => {
        await lostConnection();

        expect(remotePlayers.destroy).toHaveBeenCalledOnce();
        expect(remoteDev.destroy).toHaveBeenCalledOnce();
        expect(remoteSpam.destroy).toHaveBeenCalledOnce();
        expect(localIntel.destroy).toHaveBeenCalledOnce();
        expect(pitchChannel.destroy).toHaveBeenCalledOnce();
      });

      it("walks at full speed again if spam had slowed the visitor", async () => {
        const onSlowedChange = vi.fn();
        network.connected = true;
        network.connect.mockResolvedValue();
        const { scene, ofType } = createScene(fakeRenderer(), {
          onSlowedChange,
        });
        scene.join(HOMER);
        await vi.waitFor(() => expect(remoteSpam.onSlowedChange).toBeDefined());
        serverSetsSlowed(true);

        network.connected = false;
        network.onLost?.();

        const [player] = ofType(Player);
        const start = player.getGridPosition().column;
        pressKey("ArrowRight");
        scene.update(0.1);
        releaseKey("ArrowRight");
        expect(player.getGridPosition().column - start).toBeCloseTo(0.3);
        expect(onSlowedChange).toHaveBeenLastCalledWith(false);
      });

      it("tells the game, so it can tell the visitor", async () => {
        const onConnectionLost = vi.fn();

        await lostConnection({ onConnectionLost });

        expect(onConnectionLost).toHaveBeenCalledOnce();
      });

      it("keeps the visitor walking, offline", async () => {
        const { scene, ofType } = await lostConnection();
        const [player] = ofType(Player);
        const start = player.getGridPosition().column;

        pressKey("ArrowRight");
        scene.update(0.1);
        releaseKey("ArrowRight");

        expect(player.getGridPosition().column).toBeGreaterThan(start);
      });
    });

    // F-023
    it("stays playable when the server is unreachable", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      network.connect.mockRejectedValue(new Error("ECONNREFUSED"));
      const { scene, ofType } = createScene();
      scene.join(HOMER);

      await vi.waitFor(() =>
        expect(error).toHaveBeenCalledWith(
          "Multiplayer initialization failed",
          expect.any(Error),
        ),
      );
      pressKey("ArrowRight");
      scene.update(1 / 60);
      releaseKey("ArrowRight");

      const [player] = ofType(Player);
      expect(player.getGridPosition().column).toBeCloseTo(
        PLAYER_SPAWN.column + 0.05,
      );
      expect(network.send).not.toHaveBeenCalled();
    });

    // F-060
    it("shows the dev once connected, in the current theme", async () => {
      Object.values(remoteDev).forEach((mock) => mock.mockClear());
      const { scene } = createScene();
      scene.applyTheme(THEMES[2]);
      scene.join(HOMER);

      await vi.waitFor(() => expect(remoteDev.created).toHaveBeenCalledOnce());
      expect(remoteDev.applyTheme).toHaveBeenLastCalledWith(THEMES[2]);

      scene.applyTheme(THEMES[1]);
      expect(remoteDev.applyTheme).toHaveBeenLastCalledWith(THEMES[1]);

      scene.destroy();
      expect(remoteDev.destroy).toHaveBeenCalledOnce();
    });

    // F-063
    it("slows the player down while spam has hit them, and says so", async () => {
      remoteSpam.onSlowedChange = undefined;
      const onSlowedChange = vi.fn();
      const { scene, ofType } = createScene(fakeRenderer(), { onSlowedChange });
      const [player] = ofType(Player);
      scene.applyTheme(THEMES[1]);
      scene.join(HOMER);
      await vi.waitFor(() => expect(remoteSpam.onSlowedChange).toBeDefined());
      expect(remoteSpam.applyTheme).toHaveBeenLastCalledWith(THEMES[1]);

      serverSetsSlowed(true);
      pressKey("ArrowRight");
      scene.update(1 / 60);
      releaseKey("ArrowRight");

      expect(onSlowedChange).toHaveBeenCalledWith(true);
      expect(player.getGridPosition().column).toBeCloseTo(
        PLAYER_SPAWN.column + 0.05 * SPAM.slowFactor,
      );

      serverSetsSlowed(false);
      scene.applyTheme(THEMES[2]);
      scene.destroy();

      expect(onSlowedChange).toHaveBeenLastCalledWith(false);
      expect(remoteSpam.applyTheme).toHaveBeenLastCalledWith(THEMES[2]);
      expect(remoteSpam.destroy).toHaveBeenCalled();
    });

    // F-062
    describe("Ben's speech bubbles", () => {
      async function joinedNextToBen(options: MainSceneOptions = {}) {
        Object.values(remoteDev).forEach((mock) => mock.mockClear());
        devState.gridPosition = { ...PLAYER_SPAWN, row: PLAYER_SPAWN.row - 1 };
        const created = createScene(fakeRenderer(), options);
        created.scene.join(HOMER);
        await vi.waitFor(() => expect(remoteDev.created).toHaveBeenCalled());
        return created;
      }

      afterEach(() => {
        devState.gridPosition = undefined;
      });

      it("shows Ben's line above him and passes it on when the visitor comes close", async () => {
        const onDevLine = vi.fn();
        const { scene } = await joinedNextToBen({ onDevLine });

        scene.update(0.1);

        expect(remoteDev.say).toHaveBeenCalledOnce();
        expect(onDevLine).toHaveBeenCalledWith(remoteDev.say.mock.calls[0][0]);
        expect(remoteDev.update).toHaveBeenCalledWith(0.1);
      });

      it("keeps Ben quiet while the game is paused", async () => {
        const { scene } = await joinedNextToBen();

        scene.setPaused(true);
        scene.update(0.1);

        expect(remoteDev.say).not.toHaveBeenCalled();
      });

      it("keeps Ben quiet until his position has arrived", async () => {
        const { scene } = await joinedNextToBen();
        devState.gridPosition = undefined;

        scene.update(0.1);

        expect(remoteDev.say).not.toHaveBeenCalled();
      });
    });

    // F-012
    it("doesn't join the room before the visitor picks an identity", async () => {
      network.connect.mockClear();
      createScene();

      await Promise.resolve();

      expect(network.connect).not.toHaveBeenCalled();
    });

    // F-012
    it("joins as the chosen identity and shows it above the player", () => {
      network.connect.mockClear();
      const { scene, ofType } = createScene();

      scene.join(HOMER);

      expect(network.connect).toHaveBeenCalledExactlyOnceWith(HOMER);
      expect(ofType(Player)[0].identity).toEqual(HOMER);
    });

    it("disconnects and stops listening to resize when destroyed", () => {
      const { scene, renderer } = createScene();

      scene.destroy();

      expect(network.disconnect).toHaveBeenCalledOnce();
      expect(renderer.listenerCount("resize")).toBe(0);
    });
  });
});
