import type { GridPosition } from "./grid";

/** CV sections a building can open (F-030). */
export type CvSectionId = "experience" | "skills" | "education";

export interface BuildingDefinition {
  title: string;
  /** Top corner of the footprint. */
  gridPosition: GridPosition;
  /** Footprint size in tiles. */
  width: number;
  height: number;
  color: number;
  /** CV section shown when the building is opened (F-030). */
  section: CvSectionId;
}

/**
 * The buildings on the map, one in the middle of each district (F-005, `shared/districts.ts`).
 * The server uses the footprints to block moves (F-022).
 */
export const BUILDINGS = [
  {
    title: "EXPERIENCE",
    gridPosition: { column: 16, row: 5 },
    width: 3,
    height: 2,
    color: 0x7c3aed,
    section: "experience",
  },
  {
    title: "SKILLS",
    gridPosition: { column: 5, row: 5 },
    width: 3,
    height: 2,
    color: 0x2563eb,
    section: "skills",
  },
  {
    title: "EDUCATION",
    gridPosition: { column: 5, row: 17 },
    width: 3,
    height: 2,
    color: 0x059669,
    section: "education",
  },
] as const satisfies readonly BuildingDefinition[];
