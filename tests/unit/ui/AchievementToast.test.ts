// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACHIEVEMENTS } from "../../../src/config/achievements";
import { AchievementToast, TOAST_MS } from "../../../src/ui/AchievementToast";

const [HIRED, READ_CV] = ACHIEVEMENTS;

// F-041
describe("AchievementToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("is a status message, hidden until an achievement is unlocked", () => {
    const toast = new AchievementToast();

    expect(toast.element.getAttribute("role")).toBe("status");
    expect(toast.text).toBeUndefined();
  });

  it("announces the achievement, then hides", () => {
    const toast = new AchievementToast();

    toast.show(HIRED);

    expect(toast.text).toBe("🏆 Achievement unlocked: Hired the dev");

    vi.advanceTimersByTime(TOAST_MS);

    expect(toast.text).toBeUndefined();
  });

  it("replaces the last one, and keeps the new one up for the full time", () => {
    const toast = new AchievementToast();
    toast.show(HIRED);
    vi.advanceTimersByTime(TOAST_MS - 1);

    toast.show(READ_CV);
    vi.advanceTimersByTime(TOAST_MS - 1);

    expect(toast.text).toContain(READ_CV.title);
  });

  it("leaves the page when destroyed", () => {
    const toast = new AchievementToast();
    toast.show(HIRED);

    toast.destroy();
    vi.advanceTimersByTime(TOAST_MS);

    expect(document.querySelector(".achievement-toast")).toBeNull();
  });
});
