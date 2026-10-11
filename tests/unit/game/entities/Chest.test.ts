// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { Chest } from "../../../../src/game/entities/Chest";

describe("Chest", () => {
  it("is clickable", () => {
    const chest = new Chest();

    expect(chest.eventMode).toBe("static");
    expect(chest.cursor).toBe("pointer");
  });

  it("has a visible shape", () => {
    const chest = new Chest();

    expect(chest.children).toHaveLength(1);
  });
});
