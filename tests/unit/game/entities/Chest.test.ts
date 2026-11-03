// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { Chest } from "../../../../src/game/entities/Chest";

// F-040: hidden in a bush, it shows itself (and can be opened) only up close.
describe("Chest", () => {
  it("starts hidden: only the bush shows, and it can't be clicked or reached with Tab", () => {
    const chest = new Chest();

    expect(chest.revealed).toBe(false);
    expect(chest.box.visible).toBe(false);
    expect(chest.bush.visible).toBe(true);
    expect(chest.eventMode).toBe("none");
    expect(chest.accessible).toBe(false);
  });

  it("once revealed, is a button that can be clicked or opened with Enter", () => {
    const chest = new Chest();

    chest.revealed = true;

    expect(chest.box.visible).toBe(true);
    expect(chest.eventMode).toBe("static");
    expect(chest.cursor).toBe("pointer");
    expect(chest).toMatchObject({
      accessible: true,
      accessibleType: "button",
      accessibleHint: "Open the chest",
    });
  });

  it("hides again when the recruiter walks away", () => {
    const chest = new Chest();
    chest.revealed = true;

    chest.revealed = false;

    expect(chest.box.visible).toBe(false);
    expect(chest.eventMode).toBe("none");
    expect(chest.accessible).toBe(false);
  });
});
