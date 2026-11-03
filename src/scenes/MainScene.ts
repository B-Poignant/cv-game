import { Container, type Renderer } from "pixi.js";

import { BUILDINGS } from "../../shared/buildings";
import { DISTRICTS } from "../../shared/districts";
import {
  type IntelCardId,
  intelCardFrom,
  type IntelSource,
  isWithinIntelReach,
} from "../../shared/intel";
import type { PitchEvent, PitchOffer } from "../../shared/pitch";
import type { RecruiterIdentity } from "../../shared/recruiters";
import { SPAM } from "../../shared/spam";
import {
  CHEST_POSITION,
  MAP_SIZE,
  MOVE_SEND_INTERVAL_MS,
} from "../../shared/world";
import { DEV_BUBBLE_LINES } from "../config/devLines";
import type { Theme } from "../config/themes";
import type { CvSectionId } from "../domain/Cv";
import { Camera, type MapBounds } from "../game/Camera";
import { DevChatter } from "../game/DevChatter";
import { GameMap } from "../game/Map";
import { Player } from "../game/Player";
import type { Building } from "../game/entities/Building";
import { Chest } from "../game/entities/Chest";
import { DistrictGround } from "../game/entities/DistrictGround";
import { BuildingFactory } from "../game/factories/BuildingFactory";
import type { MinigameResult } from "../game/minigames/Minigame";
import { LocalIntel } from "../network/LocalIntel";
import { MultiplayerClient } from "../network/MultiplayerClient";
import { PitchChannel } from "../network/PitchChannel";
import { RemoteDev } from "../network/RemoteDev";
import { RemotePlayersManager } from "../network/RemotePlayersManager";
import { MoveThrottle } from "../network/MoveThrottle";
import { RemoteSpam } from "../network/RemoteSpam";

export interface MainSceneOptions {
  /** Called when the visitor opens a building (click, tap or Enter) from within reach. */
  onBuildingSelected?: (section: CvSectionId) => void;
  /** Called when the visitor tries to open a building from too far: it stays shut. */
  onBuildingOutOfReach?: (section: CvSectionId) => void;
  /** Called with every intel card the visitor holds, once in the room and after each new one (F-031). */
  onIntelChange?: (cards: IntelCardId[]) => void;
  /** Called when the visitor opens the chest from too far to earn its card. */
  onIntelOutOfReach?: (source: IntelSource) => void;
  /** Called when the server opens the pitch dialog, refuses a pitch or scores one (F-042). */
  onPitchEvent?: (event: PitchEvent) => void;
  /** Called with each line Ben says in a speech bubble to this visitor (F-062). */
  onDevLine?: (line: string) => void;
  /** Called when a spam email slows the visitor down, and when they recover (F-063). */
  onSlowedChange?: (slowed: boolean) => void;
}

/** Starts buildings' minigames (F-070): `MinigameFlow`. */
export interface MinigameLauncher {
  hasMinigame(section: CvSectionId): boolean;
  start(section: CvSectionId): Promise<void>;
}

export class MainScene extends Container {
  private readonly world = new Container();

  private readonly renderer: Renderer;
  private readonly map: GameMap;
  private readonly districts: DistrictGround[] = [];
  private readonly buildings = new Map<Building, CvSectionId>();
  private readonly player: Player;
  private readonly camera: Camera;

  private readonly multiplayerClient = new MultiplayerClient();
  private readonly devChatter = new DevChatter(DEV_BUBBLE_LINES);

  private remotePlayersManager?: RemotePlayersManager;
  private remoteDev?: RemoteDev;
  private localIntel?: LocalIntel;
  private pitchChannel?: PitchChannel;
  private remoteSpam?: RemoteSpam;
  private intel: IntelCardId[] = [];
  private theme?: Theme;

  private readonly options: MainSceneOptions;
  private minigames?: MinigameLauncher;
  private paused = false;
  private readonly moveThrottle = new MoveThrottle((position) => {
    this.sendPlayerPosition(position);
  }, MOVE_SEND_INTERVAL_MS);

  constructor(renderer: Renderer, options: MainSceneOptions = {}) {
    super();

    this.options = options;

    this.renderer = renderer;

    this.world.sortableChildren = true;
    this.addChild(this.world);

    this.map = new GameMap(MAP_SIZE.columns, MAP_SIZE.rows);
    this.world.addChild(this.map);

    this.createDistricts();
    this.createBuildings();
    this.createChest();

    this.player = new Player(this.map, this.map.converter, (position) => {
      this.moveThrottle.push(position, performance.now());
    });

    this.world.addChild(this.player);

    this.camera = new Camera(this.world, this.renderer, this.getMapBounds());

    this.camera.fitMap();

    // The renderer's event, not the window's: Pixi resizes the renderer a frame later.
    this.renderer.on("resize", this.handleResize);
  }

  /**
   * Enters the game as `identity` (F-012): shows it above the player and joins the shared
   * room. Until then the map is drawn but nobody is connected.
   */
  public join(identity: RecruiterIdentity): void {
    this.player.setIdentity(identity);

    void this.initializeMultiplayer(identity);
  }

  private getMapBounds(): MapBounds {
    const tileWidth = this.map.converter.tileWidth;
    const tileHeight = this.map.converter.tileHeight;

    return {
      minX: -(this.map.rows * tileWidth) / 2,

      maxX: (this.map.columns * tileWidth) / 2,

      minY: -tileHeight / 2,

      maxY: ((this.map.columns + this.map.rows - 1) * tileHeight) / 2,
    };
  }

  private handleResize = (): void => {
    this.camera.resize();
  };

  private async initializeMultiplayer(
    identity: RecruiterIdentity,
  ): Promise<void> {
    try {
      await this.multiplayerClient.connect(identity);

      const room = this.multiplayerClient.getRoom();

      this.remotePlayersManager = new RemotePlayersManager(
        this.world,
        this.map.converter,
        room,
      );
      this.remoteDev = new RemoteDev(this.world, this.map.converter, room);
      this.localIntel = new LocalIntel(room, (cards) => {
        this.intel = cards;
        this.options.onIntelChange?.(cards);
      });
      this.pitchChannel = new PitchChannel(room, (event) => {
        this.options.onPitchEvent?.(event);
      });
      this.remoteSpam = new RemoteSpam(
        this.world,
        this.map.converter,
        room,
        (slowed) => {
          this.player.setSpeedFactor(slowed ? SPAM.slowFactor : 1);
          this.options.onSlowedChange?.(slowed);
        },
      );

      if (this.theme) {
        this.remotePlayersManager.applyTheme(this.theme);
        this.remoteDev.applyTheme(this.theme);
        this.remoteSpam.applyTheme(this.theme);
      }
    } catch (error) {
      console.error("Multiplayer initialization failed", error);
    }
  }

  private sendPlayerPosition(position: { column: number; row: number }): void {
    if (!this.multiplayerClient.isConnected()) {
      return;
    }

    const room = this.multiplayerClient.getRoom();

    room.send("move", {
      column: position.column,
      row: position.row,
    });
  }

  /**
   * Asks the server for the card of a building or the chest (F-031). The reach check here only
   * explains a refusal straight away: the server makes the same check before giving a card.
   */
  private collectIntel(source: IntelSource): void {
    const card = intelCardFrom(source);

    if (
      !this.multiplayerClient.isConnected() ||
      !card ||
      this.intel.includes(card)
    ) {
      return;
    }

    if (!isWithinIntelReach(this.player.getGridPosition(), source)) {
      this.options.onIntelOutOfReach?.(source);
      return;
    }

    this.multiplayerClient.getRoom().send("collect-intel", { source });
  }

  /** Set once by `Game`, which creates the launcher after the scene. */
  public setMinigames(minigames: MinigameLauncher): void {
    this.minigames = minigames;
  }

  /** A building's minigame ended (F-070): a win earns its card, with the usual checks. */
  public minigameEnded(section: CvSectionId, result: MinigameResult): void {
    if (result.won) {
      this.collectIntel(section);
    }
  }

  /** Sends the offer built in the pitch dialog. The server scores it (F-042). */
  public pitch(offer: PitchOffer): void {
    this.pitchChannel?.pitch(offer);
  }

  /** The visitor closed the pitch dialog without pitching. */
  public cancelPitch(): void {
    this.pitchChannel?.cancel();
  }

  /** Painted on the map itself, so they stay under everything that's depth-sorted (F-005). */
  private createDistricts(): void {
    for (const district of DISTRICTS) {
      const ground = new DistrictGround(district, this.map.converter);

      this.districts.push(ground);
      this.map.addChild(ground);
    }
  }

  private createBuildings(): void {
    const factory = new BuildingFactory(this.map.converter);

    for (const definition of BUILDINGS) {
      this.addBuilding(factory.create(definition), definition.section);
    }
  }

  private addBuilding(building: Building, section: CvSectionId): void {
    this.buildings.set(building, section);

    const position = this.map.converter.toScreen(building.gridPosition);

    building.position.set(position.x, position.y);

    this.map.blockArea(
      building.gridPosition.column,
      building.gridPosition.row,
      building.gridWidth,
      building.gridHeight,
    );

    // pointertap: a full click or tap, also fired by the accessibility layer (Enter).
    building.on("pointertap", () => {
      this.openBuilding(section);
    });

    this.world.addChild(building);
  }

  /**
   * A building opens only from within reach: from further away it stays shut and the visitor
   * is told to get closer. Up close, it plays its minigame when it has one and the visitor
   * doesn't hold its card yet (F-070). Otherwise the CV panel opens, and a building without
   * a minigame gives its card straight away (F-031).
   */
  private openBuilding(section: CvSectionId): void {
    if (!isWithinIntelReach(this.player.getGridPosition(), section)) {
      this.options.onBuildingOutOfReach?.(section);
      return;
    }

    if (this.shouldPlayMinigame(section)) {
      void this.minigames?.start(section);
      return;
    }

    this.options.onBuildingSelected?.(section);
    this.collectIntel(section);
  }

  private shouldPlayMinigame(section: CvSectionId): boolean {
    if (!this.minigames?.hasMinigame(section)) {
      return false;
    }

    const card = intelCardFrom(section);

    return !card || !this.intel.includes(card);
  }

  private createChest(): void {
    const chest = new Chest();

    const position = this.map.converter.toScreen(CHEST_POSITION);

    chest.position.set(position.x, position.y);

    chest.on("pointertap", () => {
      this.collectIntel("chest");
    });

    this.world.addChild(chest);
  }

  /**
   * Recolours the background, map tiles, district names, building titles and every name
   * above a character.
   */
  public applyTheme(theme: Theme): void {
    this.theme = theme;
    this.renderer.background.color = theme.background;
    this.map.applyTheme(theme);

    for (const district of this.districts) {
      district.applyTheme(theme);
    }

    for (const building of this.buildings.keys()) {
      building.applyTheme(theme);
    }

    this.player.applyTheme(theme);
    this.remotePlayersManager?.applyTheme(theme);
    this.remoteDev?.applyTheme(theme);
    this.remoteSpam?.applyTheme(theme);

    // Exposes the current theme to CSS and e2e tests.
    document.documentElement.dataset.theme = theme.id;
  }

  /** While paused (e.g. a CV panel is open), keyboard input doesn't move the player. */
  public setPaused(paused: boolean): void {
    this.paused = paused;
  }

  /** Advances one frame lasting `deltaSeconds`. */
  public update(deltaSeconds: number): void {
    if (!this.paused) {
      this.player.update(deltaSeconds);
      this.updateDevChatter(deltaSeconds);
    }

    this.moveThrottle.flush(performance.now());
    this.remoteDev?.update(deltaSeconds);
    this.updateBuildingCursors();
    this.updateDepth();
  }

  /** A building shows the pointer cursor only when it can be opened from here. */
  private updateBuildingCursors(): void {
    const position = this.player.getGridPosition();

    for (const [building, section] of this.buildings) {
      building.cursor = isWithinIntelReach(position, section)
        ? "pointer"
        : "default";
    }
  }

  /** Ben taunts the visitor in a bubble (F-062), once his position has arrived. */
  private updateDevChatter(deltaSeconds: number): void {
    const devPosition = this.remoteDev?.gridPosition;

    if (!devPosition) {
      return;
    }

    const line = this.devChatter.update(
      deltaSeconds,
      devPosition,
      this.player.getGridPosition(),
    );

    if (line) {
      this.remoteDev?.say(line);
      this.options.onDevLine?.(line);
    }
  }

  private updateDepth(): void {
    for (const child of this.world.children) {
      child.zIndex = child.y;
    }

    this.world.sortChildren();
  }

  public destroy(options?: boolean): void {
    this.renderer.off("resize", this.handleResize);

    this.remotePlayersManager?.destroy();
    this.remoteDev?.destroy();
    this.localIntel?.destroy();
    this.pitchChannel?.destroy();
    this.remoteSpam?.destroy();

    void this.multiplayerClient.disconnect();

    super.destroy(options);
  }
}
