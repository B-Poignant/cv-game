import { Callbacks, type Room } from "@colyseus/sdk";
import type { Container } from "pixi.js";

import type { CvRoomState, DevState } from "../../server/rooms/CvRoomState";
import type { Theme } from "../config/themes";
import { Dev } from "../game/entities/Dev";
import type { IsometricConverter } from "../game/IsometricConverter";

/** Draws the server-run dev (F-060) and keeps him where the room state says. */
export class RemoteDev {
  private readonly world: Container;
  private readonly converter: IsometricConverter;
  private readonly callbacks;

  private dev?: Dev;
  private theme?: Theme;

  constructor(
    world: Container,
    converter: IsometricConverter,
    room: Room<CvRoomState>,
  ) {
    this.world = world;
    this.converter = converter;
    this.callbacks = Callbacks.get(room);

    this.callbacks.listen("dev", (devState) => {
      this.show(devState);
    });
  }

  /** The drawn dev, once the room state has arrived. */
  public get character(): Dev | undefined {
    return this.dev;
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

    this.callbacks.onChange(devState, () => {
      this.moveTo(devState);
    });
  }

  private moveTo(devState: DevState): void {
    this.dev?.setGridPosition({ column: devState.column, row: devState.row });
  }

  private removeDev(): void {
    if (!this.dev) {
      return;
    }

    this.world.removeChild(this.dev);
    this.dev.destroy();
    this.dev = undefined;
  }

  public destroy(): void {
    this.removeDev();
  }
}
