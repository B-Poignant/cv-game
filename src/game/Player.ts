import { Container, Graphics } from "pixi.js";

import type { GridPosition } from "../../shared/grid";
import type { RecruiterIdentity } from "../../shared/recruiters";
import { PLAYER_SPAWN, PLAYER_SPEED } from "../../shared/world";
import type { Theme } from "../config/themes";
import { NameTag } from "./entities/NameTag";
import { IsometricConverter } from "./IsometricConverter";
import { GameMap } from "./Map";

export type PlayerMoveHandler = (position: GridPosition) => void;

type Direction = "up" | "down" | "left" | "right";

/** Arrows plus AZERTY (z/q/s/d) and QWERTY (w/a/s/d). Keys are lower-cased. */
const KEY_DIRECTIONS: Readonly<Partial<Record<string, Direction>>> = {
  arrowup: "up",
  z: "up",
  w: "up",
  arrowdown: "down",
  s: "down",
  arrowleft: "left",
  q: "left",
  a: "left",
  arrowright: "right",
  d: "right",
};

/**
 * Longest frame the player moves for, in seconds. After a pause (hidden tab, slow device)
 * one step stays at PLAYER_SPEED × this = 0.3 tiles, well under what the server accepts.
 */
const MAX_FRAME_SECONDS = 0.1;

export class Player extends Container {
  private readonly gridPosition: GridPosition = { ...PLAYER_SPAWN };

  private readonly keys = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  private readonly onMove?: PlayerMoveHandler;

  private nameTag?: NameTag;
  private theme?: Theme;
  private speedFactor = 1;

  constructor(
    map: GameMap,
    converter: IsometricConverter,
    onMove?: PlayerMoveHandler,
  ) {
    super();

    this.map = map;
    this.converter = converter;

    this.onMove = onMove;

    this.createCharacter();
    this.setupKeyboard();
    this.updateScreenPosition();
  }

  private readonly map: GameMap;
  private readonly converter: IsometricConverter;

  private createCharacter(): void {
    const body = new Graphics();

    body.circle(0, -18, 8).fill(0xffcc99);

    body.roundRect(-8, -10, 16, 20, 4).fill(0x4f46e5);

    this.addChild(body);
  }

  private setupKeyboard(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.setKey(event.key, true);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.setKey(event.key, false);
  };

  private setKey(key: string, pressed: boolean): void {
    const direction = KEY_DIRECTIONS[key.toLowerCase()];

    if (direction) {
      this.keys[direction] = pressed;
    }
  }

  /** Moves the player for one frame lasting `deltaSeconds`. */
  public update(deltaSeconds: number): void {
    let columnDirection = 0;
    let rowDirection = 0;

    if (this.keys.up) {
      rowDirection -= 1;
    }

    if (this.keys.down) {
      rowDirection += 1;
    }

    if (this.keys.left) {
      columnDirection -= 1;
    }

    if (this.keys.right) {
      columnDirection += 1;
    }

    if (columnDirection === 0 && rowDirection === 0) {
      return;
    }

    const length = Math.sqrt(columnDirection ** 2 + rowDirection ** 2);

    columnDirection /= length;
    rowDirection /= length;

    const delta =
      PLAYER_SPEED *
      this.speedFactor *
      Math.min(deltaSeconds, MAX_FRAME_SECONDS);

    const nextPosition: GridPosition = {
      column: this.gridPosition.column + columnDirection * delta,

      row: this.gridPosition.row + rowDirection * delta,
    };

    if (!this.map.canWalkTo(nextPosition)) {
      return;
    }

    this.gridPosition.column = nextPosition.column;
    this.gridPosition.row = nextPosition.row;

    this.updateScreenPosition();

    this.onMove?.(this.getGridPosition());
  }

  private updateScreenPosition(): void {
    const position = this.converter.toScreen(this.gridPosition);

    this.position.set(position.x, position.y);
  }

  /** Shows the visitor's name and company above them (F-012). */
  public setIdentity(identity: RecruiterIdentity): void {
    this.nameTag?.destroy();

    this.nameTag = new NameTag(identity);
    this.nameTag.y = -34;
    this.addChild(this.nameTag);

    if (this.theme) {
      this.nameTag.applyTheme(this.theme);
    }
  }

  public get identity(): RecruiterIdentity | undefined {
    return this.nameTag?.identity;
  }

  public applyTheme(theme: Theme): void {
    this.theme = theme;
    this.nameTag?.applyTheme(theme);
  }

  /**
   * Walks at `factor` × PLAYER_SPEED, e.g. 0.5 while hit by spam (F-063). The server slows the
   * player down too: this only keeps the client from sending moves it would refuse.
   */
  public setSpeedFactor(factor: number): void {
    this.speedFactor = factor;
  }

  public getGridPosition(): GridPosition {
    return {
      ...this.gridPosition,
    };
  }

  public destroy(options?: Parameters<Container["destroy"]>[0]): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);

    super.destroy(options);
  }
}
