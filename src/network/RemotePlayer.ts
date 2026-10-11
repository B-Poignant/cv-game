import { Container, Graphics } from "pixi.js";

import type { GridPosition } from "../../shared/grid";
import type { RecruiterIdentity } from "../../shared/recruiters";
import type { Theme } from "../config/themes";
import { NameTag } from "../game/entities/NameTag";
import { IsometricConverter } from "../game/IsometricConverter";

export class RemotePlayer extends Container {
  readonly sessionId: string;

  private readonly converter: IsometricConverter;
  private readonly nameTag: NameTag;

  constructor(
    sessionId: string,
    identity: RecruiterIdentity,
    converter: IsometricConverter,
  ) {
    super();

    this.sessionId = sessionId;
    this.converter = converter;

    this.createCharacter();

    this.nameTag = new NameTag(identity);
    this.nameTag.y = -34;
    this.addChild(this.nameTag);
  }

  /** The visitor's name and company (F-012). */
  public get identity(): RecruiterIdentity {
    return this.nameTag.identity;
  }

  public setGridPosition(position: GridPosition): void {
    const screenPosition = this.converter.toScreen(position);

    this.position.set(screenPosition.x, screenPosition.y);
  }

  public applyTheme(theme: Theme): void {
    this.nameTag.applyTheme(theme);
  }

  private createCharacter(): void {
    const body = new Graphics();

    body.circle(0, -18, 8).fill(0xffcc99);

    body.roundRect(-8, -10, 16, 20, 4).fill(0xef4444);

    this.addChild(body);
  }
}
