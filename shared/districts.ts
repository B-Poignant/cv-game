import type { CvSectionId } from "./buildings";
import type { GridPosition } from "./grid";
import { MAP_SIZE } from "./world";

// The map is the CV (F-005): one district per CV section, each one a quarter of the map
// around that section's building. The quarter with no district yet will be the Projects Lab.

export interface DistrictDefinition {
  /** Painted on the ground, in English like the rest of the game UI. */
  name: string;
  section: CvSectionId;
  /** Top corner of the area. */
  gridPosition: GridPosition;
  /** Area size in tiles. */
  width: number;
  height: number;
}

const HALF_COLUMNS = MAP_SIZE.columns / 2;
const HALF_ROWS = MAP_SIZE.rows / 2;

export const DISTRICTS = [
  {
    name: "Skills Park",
    section: "skills",
    gridPosition: { column: 0, row: 0 },
    width: HALF_COLUMNS,
    height: HALF_ROWS,
  },
  {
    name: "Experience Avenue",
    section: "experience",
    gridPosition: { column: HALF_COLUMNS, row: 0 },
    width: HALF_COLUMNS,
    height: HALF_ROWS,
  },
  {
    name: "Education Campus",
    section: "education",
    gridPosition: { column: 0, row: HALF_ROWS },
    width: HALF_COLUMNS,
    height: HALF_ROWS,
  },
] as const satisfies readonly DistrictDefinition[];

/** The district covering `position` (rounded to its tile), if any. */
export function districtAt(
  position: GridPosition,
): DistrictDefinition | undefined {
  const column = Math.round(position.column);
  const row = Math.round(position.row);

  return DISTRICTS.find(
    ({ gridPosition, width, height }) =>
      column >= gridPosition.column &&
      column < gridPosition.column + width &&
      row >= gridPosition.row &&
      row < gridPosition.row + height,
  );
}

/** The area's outline, along the tile edges (tiles are centred on whole numbers). */
export function districtCorners(
  district: DistrictDefinition,
): [GridPosition, GridPosition, GridPosition, GridPosition] {
  const left = district.gridPosition.column - 0.5;
  const top = district.gridPosition.row - 0.5;
  const right = left + district.width;
  const bottom = top + district.height;

  return [
    { column: left, row: top },
    { column: right, row: top },
    { column: right, row: bottom },
    { column: left, row: bottom },
  ];
}

/** Where the name is painted: centred along the district's far edge, below its building. */
export function districtLabelPosition(
  district: DistrictDefinition,
): GridPosition {
  return {
    column: district.gridPosition.column + (district.width - 1) / 2,
    row: district.gridPosition.row + district.height - 2,
  };
}
