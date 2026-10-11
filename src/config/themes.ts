export interface Theme {
  id: string;
  name: string;
  /** Canvas background, behind the map. */
  background: number;
  tile: {
    fill: number;
    stroke: number;
  };
  /** Text drawn on the map (building titles). Must stay readable on `tile.fill`. */
  label: number;
}

/** Cycled in this order by the theme button. The first one is the default. */
export const THEMES = [
  {
    id: "classic",
    name: "Classic",
    background: 0x1f2937,
    tile: { fill: 0x8bcf8b, stroke: 0x4d8f4d },
    label: 0x1f2937,
  },
  {
    id: "simpsons",
    name: "Simpsons",
    background: 0x70d1fe,
    tile: { fill: 0xfed90f, stroke: 0xc9a800 },
    label: 0x1f2937,
  },
  {
    id: "south-park",
    name: "South Park",
    background: 0x2e5d8a,
    tile: { fill: 0xf4f6f8, stroke: 0xb8c4cc },
    label: 0x1f2937,
  },
] as const satisfies readonly Theme[];

export const DEFAULT_THEME: Theme = THEMES[0];
