import { BUILDINGS, type CvSectionId } from "./buildings";
import type { GridPosition } from "./grid";
import { CHEST_POSITION } from "./world";

/** Where intel comes from: a building (by its CV section) or the hidden chest (F-040). */
export type IntelSource = CvSectionId | "chest";

/**
 * The intel cards (F-031) and where each one is earned. Their French text is built on the
 * client from the CV (`src/content/intel.ts`): the server only deals with ids.
 */
export const INTEL_CARDS = [
  { id: "stack", source: "skills" },
  { id: "lead", source: "experience" },
  { id: "education", source: "education" },
  { id: "work-mode", source: "chest" },
] as const satisfies readonly { id: string; source: IntelSource }[];

export type IntelCardId = (typeof INTEL_CARDS)[number]["id"];

/** Cards a recruiter needs before pitching to the dev (F-042). */
export const INTEL_NEEDED_TO_PITCH = 3;

/** How close a recruiter must stand to a building or the chest to earn its card, in tiles. */
export const INTEL_REACH = 2;

export function isIntelSource(value: unknown): value is IntelSource {
  return INTEL_CARDS.some((card) => card.source === value);
}

export function isIntelCardId(value: unknown): value is IntelCardId {
  return INTEL_CARDS.some((card) => card.id === value);
}

export function intelCardFrom(source: IntelSource): IntelCardId | undefined {
  return INTEL_CARDS.find((card) => card.source === source)?.id;
}

/** Distance in tiles from `position` to the nearest tile of the source (0 when on it). */
export function distanceToSource(
  position: GridPosition,
  source: IntelSource,
): number {
  if (source === "chest") {
    return distanceToArea(position, CHEST_POSITION, 1, 1);
  }

  const building = BUILDINGS.find((candidate) => candidate.section === source);

  return building
    ? distanceToArea(
        position,
        building.gridPosition,
        building.width,
        building.height,
      )
    : Infinity;
}

export function isWithinIntelReach(
  position: GridPosition,
  source: IntelSource,
): boolean {
  return distanceToSource(position, source) <= INTEL_REACH;
}

function distanceToArea(
  position: GridPosition,
  corner: GridPosition,
  width: number,
  height: number,
): number {
  const lastColumn = corner.column + width - 1;
  const lastRow = corner.row + height - 1;
  const dx = Math.max(
    corner.column - position.column,
    0,
    position.column - lastColumn,
  );
  const dy = Math.max(corner.row - position.row, 0, position.row - lastRow);

  return Math.hypot(dx, dy);
}
