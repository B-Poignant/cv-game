import { describe, expect, it, vi } from "vitest";

import { BUILDINGS } from "../../../shared/buildings";
import { SPEED_HIRE_MS } from "../../../src/config/achievements";
import {
  ACHIEVEMENTS_STORAGE_KEY,
  AchievementTracker,
  browserStorage,
  type AchievementStorage,
} from "../../../src/game/AchievementTracker";

/** A Map standing in for localStorage. */
function memoryStorage(saved?: string): AchievementStorage & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>();
  if (saved !== undefined) {
    data.set(ACHIEVEMENTS_STORAGE_KEY, saved);
  }

  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

function createTracker(storage = memoryStorage()) {
  let time = 0;
  const tracker = new AchievementTracker(storage, () => time);
  const unlocked = vi.fn();
  tracker.onUnlock((achievement) => {
    unlocked(achievement.id);
  });

  return {
    tracker,
    storage,
    unlocked,
    wait: (ms: number) => {
      time += ms;
    },
  };
}

// F-041
describe("AchievementTracker", () => {
  it("starts with nothing unlocked", () => {
    const { tracker } = createTracker();

    expect(tracker.unlocked).toEqual([]);
  });

  it("unlocks 'Read the whole CV' once every section was opened", () => {
    const { tracker, unlocked } = createTracker();
    const [first, ...others] = BUILDINGS.map((building) => building.section);

    tracker.sectionOpened(first);
    tracker.sectionOpened(first);

    expect(unlocked).not.toHaveBeenCalled();

    for (const section of others) {
      tracker.sectionOpened(section);
    }

    expect(unlocked).toHaveBeenCalledExactlyOnceWith("read-cv");
  });

  it("unlocks 'Found the chest' with the chest's card", () => {
    const { tracker, unlocked } = createTracker();

    tracker.intelChanged(["stack"]);
    tracker.intelChanged(["stack", "work-mode"]);

    expect(unlocked).toHaveBeenCalledExactlyOnceWith("chest");
  });

  it("unlocks the hire, the first try and the speed hire on a quick first good pitch", () => {
    const { tracker, unlocked, wait } = createTracker();
    tracker.arrived();
    wait(SPEED_HIRE_MS - 1);

    tracker.pitched(true);

    expect(unlocked.mock.calls.flat()).toEqual([
      "hired",
      "first-try",
      "speed-hire",
    ]);
  });

  it("doesn't count a hire after a bad pitch as a first try", () => {
    const { tracker, unlocked } = createTracker();
    tracker.arrived();

    tracker.pitched(false);
    tracker.pitched(true);

    expect(unlocked.mock.calls.flat()).not.toContain("first-try");
    expect(unlocked.mock.calls.flat()).toContain("hired");
  });

  it("doesn't count a hire after 2 minutes as a speed hire", () => {
    const { tracker, unlocked, wait } = createTracker();
    tracker.arrived();
    wait(SPEED_HIRE_MS);

    tracker.pitched(true);

    expect(unlocked.mock.calls.flat()).not.toContain("speed-hire");
  });

  it("unlocks nothing on a bad pitch", () => {
    const { tracker, unlocked } = createTracker();

    tracker.pitched(false);

    expect(unlocked).not.toHaveBeenCalled();
  });

  describe("between visits", () => {
    it("saves what's unlocked", () => {
      const { tracker, storage } = createTracker();

      tracker.intelChanged(["work-mode"]);

      expect(storage.data.get(ACHIEVEMENTS_STORAGE_KEY)).toBe('["chest"]');
    });

    it("remembers what a previous visit unlocked, without announcing it again", () => {
      const { tracker, unlocked } = createTracker(memoryStorage('["chest"]'));

      tracker.intelChanged(["work-mode"]);

      expect(tracker.isUnlocked("chest")).toBe(true);
      expect(unlocked).not.toHaveBeenCalled();
    });

    it.each([
      { label: "unknown ids", saved: '["chest", "hacked"]', kept: ["chest"] },
      { label: "not a list", saved: '{"chest": true}', kept: [] },
      { label: "broken JSON", saved: "[chest", kept: [] },
    ])("ignores $label", ({ saved, kept }) => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const { tracker } = createTracker(memoryStorage(saved));

      expect(tracker.unlocked.map((achievement) => achievement.id)).toEqual(
        kept,
      );
    });

    it("still works for this visit when storage fails", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const broken: AchievementStorage = {
        getItem: () => {
          throw new Error("SecurityError");
        },
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      };
      const { tracker, unlocked } = createTracker(
        broken as ReturnType<typeof memoryStorage>,
      );

      tracker.intelChanged(["work-mode"]);

      expect(unlocked).toHaveBeenCalledWith("chest");
      expect(warn).toHaveBeenCalledTimes(2);
    });

    // Node has no window, like a sandboxed frame that blocks storage.
    it("finds no browser storage where there is none", () => {
      expect(browserStorage()).toBeUndefined();
    });

    it("works without any storage", () => {
      const tracker = new AchievementTracker(undefined, () => 0);

      tracker.intelChanged(["work-mode"]);

      expect(tracker.isUnlocked("chest")).toBe(true);
    });
  });

  it("stops calling a listener that unsubscribed", () => {
    const tracker = new AchievementTracker(undefined, () => 0);
    const listener = vi.fn();
    const unsubscribe = tracker.onUnlock(listener);

    unsubscribe();
    tracker.intelChanged(["work-mode"]);

    expect(listener).not.toHaveBeenCalled();
  });
});
