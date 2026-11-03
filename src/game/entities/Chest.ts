import { Container, Graphics } from "pixi.js";

/**
 * The hidden chest (F-040): a bush on its tile, which hides the chest until a recruiter comes
 * within reach. Revealed, the chest sits beside the bush and is a button, clicked or opened
 * with Tab and Enter like the buildings; hidden, it can be neither.
 */
export class Chest extends Container {
  readonly bush = new Graphics();
  readonly box = new Graphics();
  private isRevealed = false;

  constructor() {
    super();

    this.bush
      .circle(-9, -6, 9)
      .circle(9, -6, 9)
      .circle(0, -14, 10)
      .fill(0x2f7d32)
      .circle(-3, -16, 4)
      .circle(6, -9, 3)
      .fill(0x4caf50);

    this.box.roundRect(-15, -10, 30, 20, 3).fill(0xa16207);
    this.box.rect(-2, -10, 4, 20).fill(0xfacc15);

    this.addChild(this.bush, this.box);

    this.accessibleType = "button";
    this.accessibleTitle = "Chest";
    this.accessibleHint = "Open the chest";
    this.revealed = false;
  }

  get revealed(): boolean {
    return this.isRevealed;
  }

  set revealed(revealed: boolean) {
    this.isRevealed = revealed;
    this.box.visible = revealed;
    // The bush steps aside to show the chest.
    this.bush.position.set(revealed ? 18 : 0, revealed ? -6 : 0);
    this.eventMode = revealed ? "static" : "none";
    this.cursor = revealed ? "pointer" : "default";
    // Pixi's accessibility layer only lists it (as a <button>) while revealed.
    this.accessible = revealed;
  }
}
