import { describe, expect, it } from "vitest";

import {
  formatDuration,
  formatMonth,
  formatPeriod,
  formatWorkMode,
  monthsBetween,
} from "../../../src/content/format";

// A fixed "today" so durations of the current job don't change over time.
const NOW = new Date(Date.UTC(2026, 9, 15)); // 15 Oct 2026

describe("formatMonth", () => {
  it.each([
    { value: "2023-07", expected: "juil. 2023" },
    { value: "2014-05", expected: "mai 2014" },
    { value: "2008-12", expected: "déc. 2008" },
  ])("formats $value as $expected", ({ value, expected }) => {
    expect(formatMonth(value)).toBe(expected);
  });
});

describe("monthsBetween", () => {
  it("counts both ends, like LinkedIn", () => {
    expect(monthsBetween("2023-07", "2023-07", NOW)).toBe(1);
  });

  it("counts up to today for a current job", () => {
    expect(monthsBetween("2023-07", undefined, NOW)).toBe(40);
  });
});

describe("formatDuration", () => {
  it.each([
    { months: 6, expected: "6 mois" },
    { months: 12, expected: "1 an" },
    { months: 22, expected: "1 an 10 mois" },
    { months: 48, expected: "4 ans" },
    { months: 40, expected: "3 ans 4 mois" },
  ])("formats $months months as $expected", ({ months, expected }) => {
    expect(formatDuration(months)).toBe(expected);
  });
});

// Durations as shown on the owner's LinkedIn profile.
describe("formatPeriod matches LinkedIn", () => {
  it.each([
    {
      start: "2023-07",
      end: undefined,
      expected: "juil. 2023 – aujourd'hui · 3 ans 4 mois",
    },
    {
      start: "2021-10",
      end: "2023-07",
      expected: "oct. 2021 – juil. 2023 · 1 an 10 mois",
    },
    {
      start: "2019-07",
      end: "2021-10",
      expected: "juil. 2019 – oct. 2021 · 2 ans 4 mois",
    },
    {
      start: "2014-10",
      end: "2018-09",
      expected: "oct. 2014 – sept. 2018 · 4 ans",
    },
    {
      start: "2014-05",
      end: "2014-10",
      expected: "mai 2014 – oct. 2014 · 6 mois",
    },
  ])("$start → $end", ({ start, end, expected }) => {
    expect(formatPeriod(start, end, NOW)).toBe(expected);
  });
});

describe("formatWorkMode", () => {
  it.each([
    { mode: "remote", expected: "À distance" },
    { mode: "hybrid", expected: "Hybride" },
    { mode: "onsite", expected: "Sur site" },
  ] as const)("labels $mode as $expected", ({ mode, expected }) => {
    expect(formatWorkMode(mode)).toBe(expected);
  });
});
