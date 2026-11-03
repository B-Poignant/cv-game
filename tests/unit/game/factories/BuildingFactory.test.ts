// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { BuildingFactory } from "../../../../src/game/factories/BuildingFactory";
import { IsometricConverter } from "../../../../src/game/IsometricConverter";
import { aBuildingDefinition } from "../../../helpers/builders";

describe("BuildingFactory", () => {
  it("creates a building from its definition", () => {
    const definition = aBuildingDefinition({
      title: "PROJECTS",
      gridPosition: { column: 2, row: 7 },
      width: 4,
      height: 1,
      color: 0xff0000,
    });

    const building = new BuildingFactory(new IsometricConverter(64, 32)).create(
      definition,
    );

    expect(building).toMatchObject({
      title: "PROJECTS",
      gridPosition: { column: 2, row: 7 },
      gridWidth: 4,
      gridHeight: 1,
      color: 0xff0000,
    });
  });
});
