import type { BuildingDefinition } from "../../shared/buildings";
import type { GridPosition } from "../../shared/grid";

/**
 * Test data builders: valid defaults, override only what the test cares about.
 * Keeps tests focused on the one value that matters.
 */
export function aGridPosition(
  overrides: Partial<GridPosition> = {},
): GridPosition {
  return { column: 0, row: 0, ...overrides };
}

export function aBuildingDefinition(
  overrides: Partial<BuildingDefinition> = {},
): BuildingDefinition {
  return {
    title: "TEST",
    gridPosition: aGridPosition(),
    width: 2,
    height: 2,
    color: 0x123456,
    section: "experience",
    ...overrides,
  };
}
