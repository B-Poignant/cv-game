// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";

import { ACHIEVEMENTS } from "../../../src/config/achievements";
import { AchievementTracker } from "../../../src/game/AchievementTracker";
import { AchievementsPanel } from "../../../src/ui/AchievementsPanel";

function createPanel() {
  const tracker = new AchievementTracker(undefined, () => 0);
  const panel = new AchievementsPanel(tracker);
  const button = panel.element.querySelector("button")!;
  const items = () =>
    [...panel.element.querySelectorAll("li")].map((item) => item.textContent);

  return { tracker, panel, button, items };
}

// F-041
describe("AchievementsPanel", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("shows how many achievements are unlocked", () => {
    const { button } = createPanel();

    expect(button.textContent).toBe(`🏆 0/${String(ACHIEVEMENTS.length)}`);
    expect(button.getAttribute("aria-label")).toBe(
      `Achievements: 0 of ${String(ACHIEVEMENTS.length)}`,
    );
  });

  it("opens and closes the list with the button", () => {
    const { panel, button } = createPanel();

    button.click();

    expect(panel.isOpen).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");

    button.click();

    expect(panel.isOpen).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("lists every achievement, locked until unlocked", () => {
    const { tracker, button, items } = createPanel();

    expect(items()).toHaveLength(ACHIEVEMENTS.length);
    expect(items()[2]).toContain("🔒 Found the chest");

    tracker.intelChanged(["work-mode"]);

    expect(items()[2]).toContain("✓ Found the chest");
    expect(button.textContent).toBe(`🏆 1/${String(ACHIEVEMENTS.length)}`);
  });

  it("leaves the page when destroyed", () => {
    const { panel } = createPanel();

    panel.destroy();

    expect(document.querySelector(".achievements")).toBeNull();
  });
});
