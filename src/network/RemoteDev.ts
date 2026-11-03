import { Callbacks, type Room } from "@colyseus/sdk";
import type { Container } from "pixi.js";

import type { CvRoomState, DevState } from "../../server/rooms/CvRoomState";
import type { GridPosition } from "../../shared/grid";
import type { Theme } from "../config/themes";
import { Dev } from "../game/entities/Dev";
import type { IsometricConverter } from "../game/IsometricConverter";

/** Draws the server-run dev (F-060) and keeps him where the room state says. */
export class RemoteDev {
  private readonly world: Container;
  private readonly converter: IsometricConverter;
  private readonly callbacks;
  private readonly stopListening: () => void;
  /** Unsubscribes from the shown dev's changes. */
  private stopFollowing?: () => void;

  private dev?: Dev;
  private position?: GridPosition;
  private theme?: Theme;

  constructor(
    world: Container,
    converter: IsometricConverter,
    room: Room<CvRoomState>,
  ) {
    this.world = world;
    this.converter = converter;
    this.callbacks = Callbacks.get(room);

    this.stopListening = this.callbacks.listen("dev", (devState) => {
      this.show(devState);
    });
  }

  /** The drawn dev, once the room state has arrived. */
  public get character(): Dev | undefined {
    return this.dev;
  }

  /** Where the server last put him, once the room state has arrived. */
  public get gridPosition(): GridPosition | undefined {
    return this.position ? { ...this.position } : undefined;
  }

  /** Shows a speech bubble above him (F-062). */
  public say(line: string): void {
    this.dev?.say(line);
  }

  /** Advances his bubble's timer. */
  public update(deltaSeconds: number): void {
    this.dev?.update(deltaSeconds);
  }

  public applyTheme(theme: Theme): void {
    this.theme = theme;
    this.dev?.applyTheme(theme);
  }

  private show(devState: DevState): void {
    this.removeDev();

    const dev = new Dev(devState.name, this.converter);

    if (this.theme) {
      dev.applyTheme(this.theme);
    }

    this.dev = dev;
    this.world.addChild(dev);
    this.moveTo(devState);

    console.log("[DEV] Shown:", devState.name);

    this.stopFollowing = this.callbacks.onChange(devState, () => {
      this.moveTo(devState);
    });
  }

  private moveTo(devState: DevState): void {
    this.position = { column: devState.column, row: devState.row };
    this.dev?.setGridPosition(this.position);
  }

  private removeDev(): void {
    this.stopFollowing?.();
    this.stopFollowing = undefined;

    if (!this.dev) {
      return;
    }

    this.world.removeChild(this.dev);
    this.dev.destroy();
    this.dev = undefined;
  }

  /** Removes him and stops listening to the room, which may outlive this object. */
  public destroy(): void {
    this.stopListening();
    this.removeDev();
  }
}
