import { describe, expect, it } from "vitest";

import { DEV_PREFERENCES } from "../../../shared/preferences";

// The pitch (F-042) is scored against these: they must be unambiguous.
describe("DEV_PREFERENCES", () => {
  it("rates every work mode exactly once", () => {
    const { perfect, accepted, fails } = DEV_PREFERENCES.workMode;

    expect([...perfect, ...accepted, ...fails].sort()).toEqual([
      "hybrid",
      "onsite",
      "remote",
    ]);
  });

  it("matches the owner's answers: remote best, hybrid OK, onsite fails", () => {
    expect(DEV_PREFERENCES.workMode).toEqual({
      perfect: ["remote"],
      accepted: ["hybrid"],
      fails: ["onsite"],
    });
  });

  it("rates every role exactly once", () => {
    const { perfect, accepted, fails } = DEV_PREFERENCES.role;
    const roles = [...perfect, ...accepted, ...fails];

    expect(new Set(roles).size).toBe(roles.length);
    expect(roles).toHaveLength(8);
  });

  it("matches the owner's answers on roles: leading roles best, game dev and clichés fail", () => {
    expect(DEV_PREFERENCES.role).toEqual({
      perfect: ["lead-full-stack", "tech-lead", "engineering-manager"],
      accepted: ["full-stack", "back-end-php", "front-end"],
      fails: ["game-dev", "rockstar-ninja"],
    });
  });

  it("has a stack without duplicates", () => {
    const { stack } = DEV_PREFERENCES;

    expect(new Set(stack).size).toBe(stack.length);
  });
});
