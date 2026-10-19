// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { BUILDINGS } from "../../../../shared/buildings";
import { CV } from "../../../../src/content/cv";
import { createMinigames } from "../../../../src/scenes/minigames/registry";

// F-070, F-071, F-072, F-074
describe("minigame registry", () => {
  it("gives every building on the map a minigame", () => {
    const minigames = createMinigames(CV);

    for (const { section } of BUILDINGS) {
      expect(minigames[section], section).toBeDefined();
    }
  });
});
