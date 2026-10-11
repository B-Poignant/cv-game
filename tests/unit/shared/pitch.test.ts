import { describe, expect, it } from "vitest";

import {
  DEV_LINES,
  isPitchOffer,
  LINE_OPTIONS,
  type PitchCategory,
  type PitchOffer,
  rate,
  ROLE_OPTIONS,
  scorePitch,
  STACK_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../../../shared/pitch";

const PERFECT: PitchOffer = {
  stack: "php",
  workMode: "remote",
  role: "lead-full-stack",
  line: "read-cv",
};

const OPTIONS: Record<PitchCategory, readonly { id: string; reply: string }[]> =
  {
    stack: STACK_OPTIONS,
    workMode: WORK_MODE_OPTIONS,
    role: ROLE_OPTIONS,
    line: LINE_OPTIONS,
  };

/** Every option of a category, each in an otherwise perfect offer. */
function eachOption(category: PitchCategory): PitchOffer[] {
  return OPTIONS[category].map((option) => ({
    ...PERFECT,
    [category]: option.id,
  }));
}

const CATEGORIES = Object.keys(OPTIONS) as PitchCategory[];

// F-042
describe("the pitch", () => {
  describe("ratings (the owner's answers)", () => {
    it.each([
      ["stack", ["php", "typescript"], [], ["java", "python", "cobol"]],
      ["workMode", ["remote"], ["hybrid"], ["onsite"]],
      [
        "role",
        ["lead-full-stack", "tech-lead", "engineering-manager"],
        ["full-stack", "back-end-php", "front-end"],
        ["game-dev", "rockstar-ninja"],
      ],
      ["line", ["read-cv"], [], ["quick-call", "perfect-fit"]],
    ] as const)(
      "rates every %s option",
      (category, perfect, accepted, fails) => {
        const ratings = Object.fromEntries(
          eachOption(category).map((offer) => [
            offer[category],
            rate(offer, category),
          ]),
        );

        expect(ratings).toEqual({
          ...Object.fromEntries(perfect.map((id) => [id, "perfect"])),
          ...Object.fromEntries(accepted.map((id) => [id, "accepted"])),
          ...Object.fromEntries(fails.map((id) => [id, "fails"])),
        });
      },
    );
  });

  describe("scorePitch", () => {
    it("hires on a perfect offer", () => {
      expect(scorePitch(PERFECT)).toEqual({
        hired: true,
        lines: [DEV_LINES.hired],
      });
    });

    it("still hires on accepted parts, with a grumble for each", () => {
      expect(
        scorePitch({ ...PERFECT, workMode: "hybrid", role: "full-stack" }),
      ).toEqual({
        hired: true,
        lines: [
          "Hybrid… fine, if the coffee is good.",
          "No lead role? Fine… I guess.",
          DEV_LINES.hired,
        ],
      });
    });

    it("refuses any offer with a part that fails, saying why", () => {
      expect(scorePitch({ ...PERFECT, stack: "cobol" })).toEqual({
        hired: false,
        lines: ["COBOL? I said PHP or TypeScript. Read the CV!"],
      });
    });

    it("complains about onsite work first: it's the deal-breaker", () => {
      expect(
        scorePitch({
          stack: "java",
          workMode: "onsite",
          role: "rockstar-ninja",
          line: "quick-call",
        }),
      ).toEqual({ hired: false, lines: ["5 days in the office? I'll pass."] });
    });

    it.each(CATEGORIES)(
      "refuses every failing %s option with its own reply",
      (category) => {
        for (const offer of eachOption(category)) {
          if (rate(offer, category) === "fails") {
            const { hired, lines } = scorePitch(offer);
            expect(hired).toBe(false);
            expect(lines).toHaveLength(1);
            expect(lines[0]).not.toBe("");
          }
        }
      },
    );
  });

  describe("the dev's lines (GAME_DESIGN.md › Tone)", () => {
    it.each(CATEGORIES)(
      "has a short reply for every %s option that isn't perfect, and none otherwise",
      (category) => {
        for (const offer of eachOption(category)) {
          const { reply } = OPTIONS[category].find(
            (option) => option.id === offer[category],
          )!;

          if (rate(offer, category) === "perfect") {
            expect(reply).toBe("");
          } else {
            expect(reply.length).toBeGreaterThan(0);
            expect(reply.length).toBeLessThanOrEqual(60);
          }
        }
      },
    );

    it("keeps the other lines short", () => {
      for (const line of [
        DEV_LINES.hired,
        DEV_LINES.noIntel,
        DEV_LINES.cooldown(30),
      ]) {
        expect(line.length).toBeLessThanOrEqual(60);
      }
    });
  });

  describe("isPitchOffer", () => {
    it("accepts an offer with one known option per part", () => {
      expect(isPitchOffer(PERFECT)).toBe(true);
    });

    it.each([
      { label: "nothing", value: undefined },
      { label: "a string", value: "php" },
      { label: "a missing part", value: { ...PERFECT, line: undefined } },
      { label: "an unknown option", value: { ...PERFECT, stack: "rust" } },
      {
        label: "an option from another part",
        value: { ...PERFECT, role: "remote" },
      },
    ])("rejects $label", ({ value }) => {
      expect(isPitchOffer(value)).toBe(false);
    });
  });
});
