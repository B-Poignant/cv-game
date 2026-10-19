import { describe, expect, it } from "vitest";

import { DEV_BUBBLE_LINES } from "../../../src/config/devLines";
import { CHATTER_RULES, DevChatter } from "../../../src/game/DevChatter";

const LINES = { close: ["Bye!", "Nope."], idle: ["One more commit…"] };
const DEV = { column: 18, row: 18 };
const FAR = { column: 2, row: 2 };
const CLOSE = { column: 18, row: 18 - CHATTER_RULES.closeDistance };
const FRAME = 0.1;

/** Runs `seconds` of frames and returns every line said. */
function run(
  chatter: DevChatter,
  seconds: number,
  visitor: { column: number; row: number },
): string[] {
  const said: string[] = [];

  for (let time = 0; time < seconds - 1e-9; time += FRAME) {
    const line = chatter.update(FRAME, DEV, visitor);
    if (line) {
      said.push(line);
    }
  }

  return said;
}

// F-062
describe("DevChatter", () => {
  it("taunts the visitor as they come close", () => {
    const chatter = new DevChatter(LINES, () => 0);

    expect(chatter.update(FRAME, DEV, CLOSE)).toBe("Bye!");
  });

  it("says it once per approach, not every frame", () => {
    const chatter = new DevChatter(LINES, () => 0);

    expect(run(chatter, CHATTER_RULES.cooldownSeconds * 2, CLOSE)).toHaveLength(
      1,
    );
  });

  it("taunts again on a new approach, once the cooldown is over", () => {
    const chatter = new DevChatter(LINES, () => 0);
    chatter.update(FRAME, DEV, CLOSE);
    run(chatter, CHATTER_RULES.cooldownSeconds, FAR);

    expect(chatter.update(FRAME, DEV, CLOSE)).toBeDefined();
  });

  it("keeps quiet on an approach during the cooldown", () => {
    const chatter = new DevChatter(LINES, () => 0);
    chatter.update(FRAME, DEV, CLOSE);
    chatter.update(FRAME, DEV, FAR);

    expect(chatter.update(FRAME, DEV, CLOSE)).toBeUndefined();
  });

  it("never says the same line twice in a row", () => {
    const chatter = new DevChatter(LINES, () => 0);
    const first = chatter.update(FRAME, DEV, CLOSE);
    run(chatter, CHATTER_RULES.cooldownSeconds, FAR);

    expect(chatter.update(FRAME, DEV, CLOSE)).not.toBe(first);
  });

  it("mutters to himself after a long quiet spell", () => {
    const chatter = new DevChatter(LINES, () => 0);

    expect(run(chatter, CHATTER_RULES.idleSeconds - FRAME, FAR)).toEqual([]);
    expect(run(chatter, FRAME, FAR)).toEqual(["One more commit…"]);
  });

  it("keeps every line to one short bubble (GAME_DESIGN.md › Tone)", () => {
    const lines = Object.values(DEV_BUBBLE_LINES).flat();

    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line.length, line).toBeLessThanOrEqual(60);
    }
  });
});
