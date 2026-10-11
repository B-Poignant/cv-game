import { Container, Graphics } from "pixi.js";

export class Chest extends Container {
  constructor() {
    super();

    const chest = new Graphics();

    chest.roundRect(-15, -10, 30, 20, 3).fill(0xa16207);

    chest.rect(-2, -10, 4, 20).fill(0xfacc15);

    this.addChild(chest);

    this.eventMode = "static";
    this.cursor = "pointer";
  }
}
