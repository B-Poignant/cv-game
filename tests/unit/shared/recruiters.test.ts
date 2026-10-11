import { describe, expect, it } from "vitest";

import {
  COMPANY_MAX_LENGTH,
  DEFAULT_RECRUITERS,
  NAME_MAX_LENGTH,
  normalizeIdentity,
  randomRecruiter,
} from "../../../shared/recruiters";

// F-012
describe("recruiter identities", () => {
  it.each(DEFAULT_RECRUITERS)(
    "accepts the default $name from $company as is",
    (identity) => {
      expect(normalizeIdentity(identity)).toEqual(identity);
    },
  );

  it("has no duplicate default names", () => {
    const names = DEFAULT_RECRUITERS.map(({ name }) => name);

    expect(new Set(names).size).toBe(names.length);
  });

  describe("randomRecruiter", () => {
    it("picks a default by the random number", () => {
      expect(randomRecruiter(() => 0)).toEqual(DEFAULT_RECRUITERS[0]);
      expect(randomRecruiter(() => 0.9999)).toEqual(DEFAULT_RECRUITERS.at(-1));
    });

    it("returns a copy, so changing it can't change the list", () => {
      const identity = randomRecruiter(() => 0);
      identity.name = "Changed";

      expect(DEFAULT_RECRUITERS[0].name).toBe("Homer");
    });
  });

  describe("normalizeIdentity", () => {
    it("trims and collapses spaces", () => {
      expect(
        normalizeIdentity({
          name: "  Jean   Dupont ",
          company: " ACME\tCorp ",
        }),
      ).toEqual({ name: "Jean Dupont", company: "ACME Corp" });
    });

    it("accepts accents and the allowed punctuation", () => {
      const identity = {
        name: "Zoé O'Brien-Ünal",
        company: "Ça & Là (Paris)!",
      };

      expect(normalizeIdentity(identity)).toEqual(identity);
    });

    it("accepts the longest allowed values", () => {
      const identity = {
        name: "n".repeat(NAME_MAX_LENGTH),
        company: "c".repeat(COMPANY_MAX_LENGTH),
      };

      expect(normalizeIdentity(identity)).toEqual(identity);
    });

    it.each([
      { label: "nothing", input: undefined },
      { label: "a string", input: "Homer" },
      { label: "a missing company", input: { name: "Homer" } },
      { label: "a number as name", input: { name: 42, company: "Acme" } },
      { label: "an empty name", input: { name: "", company: "Acme" } },
      { label: "a blank company", input: { name: "Homer", company: "   " } },
      {
        label: "a name that's too long",
        input: { name: "n".repeat(NAME_MAX_LENGTH + 1), company: "Acme" },
      },
      {
        label: "a company that's too long",
        input: { name: "Homer", company: "c".repeat(COMPANY_MAX_LENGTH + 1) },
      },
      {
        label: "markup",
        input: { name: "<img src=x>", company: "Acme" },
      },
      { label: "an emoji", input: { name: "Homer 🍩", company: "Acme" } },
    ])("rejects $label", ({ input }) => {
      expect(normalizeIdentity(input)).toBeUndefined();
    });
  });
});
