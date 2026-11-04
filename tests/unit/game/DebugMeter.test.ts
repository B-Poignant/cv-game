import { describe, expect, it } from "vitest";

import {
  DebugMeter,
  type DebugSample,
  directionOf,
  formatPosition,
  formatTile,
} from "../../../src/game/DebugMeter";

const SAMPLE: DebugSample = {
  player: { column: 4, row: 7 },
  others: 0,
  connected: false,
};

// F-051
describe("DebugMeter", () => {
  it("starts still, with no server, Ben or FPS until they are known", () => {
    const readout = new DebugMeter().update(0, SAMPLE);

    expect(readout.velocity).toEqual({ column: 0, row: 0 });
    expect(readout.lines).toEqual([
      "Player   (4.00, 7.00)  tile (4, 7)",
      "Server   —",
      "Speed    0.00 tiles/s  still",
      "Ben      —",
      "Others   0",
      "Network  offline",
      "FPS      —",
    ]);
  });

  it("measures the speed and direction from how far the player moved", () => {
    const meter = new DebugMeter();
    meter.update(0.1, SAMPLE);

    const readout = meter.update(0.1, {
      ...SAMPLE,
      player: { column: 4.3, row: 6.7 },
    });

    expect(readout.velocity.column).toBeCloseTo(3);
    expect(readout.velocity.row).toBeCloseTo(-3);
    expect(readout.lines[2]).toBe("Speed    4.24 tiles/s  ↗ up-right");
  });

  it("shows the server's position, Ben, the others and the connection", () => {
    const readout = new DebugMeter().update(1 / 60, {
      player: { column: 1.26, row: 2 },
      server: { column: 1, row: 2 },
      dev: { column: 10.5, row: 3.25 },
      others: 2,
      connected: true,
    });

    expect(readout.lines.slice(0, 2)).toEqual([
      "Player   (1.26, 2.00)  tile (1, 2)",
      "Server   (1.00, 2.00)",
    ]);
    expect(readout.lines.slice(3)).toEqual([
      "Ben      (10.50, 3.25)",
      "Others   2",
      "Network  online",
      "FPS      60",
    ]);
  });

  it("smooths the FPS so one slow frame doesn't make it jump", () => {
    const meter = new DebugMeter();
    meter.update(1 / 60, SAMPLE);

    const readout = meter.update(1 / 10, SAMPLE);

    expect(readout.lines[6]).toBe("FPS      55");
  });

  it("ignores a frame of no time for the speed and the FPS", () => {
    const meter = new DebugMeter();
    meter.update(1 / 60, SAMPLE);

    const readout = meter.update(0, {
      ...SAMPLE,
      player: { column: 9, row: 9 },
    });

    expect(readout.velocity).toEqual({ column: 0, row: 0 });
    expect(readout.lines[6]).toBe("FPS      60");
  });
});

describe("debug formatting", () => {
  it("writes a position with two decimals", () => {
    expect(formatPosition({ column: 3.14159, row: -0.5 })).toBe(
      "(3.14, -0.50)",
    );
  });

  // Tiles are centred on whole numbers: 3.4 stands on tile 3, 3.6 on tile 4.
  it("rounds a position to the tile it stands on", () => {
    expect(formatTile({ column: 3.4, row: 3.6 })).toBe("(3, 4)");
    expect(formatTile({ column: -0.4, row: 0 })).toBe("(0, 0)");
  });

  it.each([
    [{ column: 0, row: 0 }, "still"],
    [{ column: 0, row: -1 }, "↑ up"],
    [{ column: 0, row: 2 }, "↓ down"],
    [{ column: -1, row: 0 }, "← left"],
    [{ column: 0.5, row: 0 }, "→ right"],
    [{ column: -1, row: -1 }, "↖ up-left"],
    [{ column: 1, row: 1 }, "↘ down-right"],
    [{ column: -1, row: 1 }, "↙ down-left"],
  ])("names the direction of %o: %s", (velocity, name) => {
    expect(directionOf(velocity)).toBe(name);
  });
});
