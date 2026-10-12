import { describe, expect, it, vi } from "vitest";

import type { CvSectionId } from "../../../src/domain/Cv";
import type {
  MinigameDefinition,
  MinigameResult,
} from "../../../src/game/minigames/Minigame";
import {
  MinigameFlow,
  type MinigameHost,
  type MinigamePlayer,
} from "../../../src/scenes/MinigameFlow";

const SKILLS_GAME: MinigameDefinition = {
  title: "SKILLS PARK",
  create: () => {
    throw new Error("not used: the player is faked");
  },
};

function setUp(result: MinigameResult = { won: true }) {
  const events: string[] = [];
  const host: MinigameHost = {
    visible: true,
    setPaused: (paused) => events.push(`paused: ${String(paused)}`),
    minigameEnded: (section, ended) =>
      events.push(`ended: ${section}, won: ${String(ended.won)}`),
  };
  const play = vi.fn(() => {
    events.push(`play (map visible: ${String(host.visible)})`);
    return Promise.resolve(result);
  });
  const player: MinigamePlayer & { isRunning: boolean } = {
    isRunning: false,
    play,
  };
  const panel = {
    open: (section: CvSectionId) => events.push(`open: ${section}`),
  };
  const chat = {
    post: ({ text }: { text: string }) => events.push(`say: ${text}`),
  };
  const flow = new MinigameFlow(
    host,
    player,
    { skills: SKILLS_GAME },
    panel,
    chat,
  );

  return { flow, host, player, play, events };
}

// F-070
describe("MinigameFlow", () => {
  it("knows which buildings have a minigame", () => {
    const { flow } = setUp();

    expect(flow.hasMinigame("skills")).toBe(true);
    expect(flow.hasMinigame("experience")).toBe(false);
  });

  it("hides the map, plays, then lets the map claim the card and opens the CV panel", async () => {
    const { flow, host, events } = setUp({ won: true });

    await flow.start("skills");

    expect(events).toEqual([
      "paused: true",
      "play (map visible: false)",
      "say: SKILLS PARK: you won!",
      "ended: skills, won: true",
      "open: skills",
    ]);
    expect(host.visible).toBe(true);
  });

  it("still opens the CV panel after a loss, so everyone reads the CV", async () => {
    const { flow, events } = setUp({ won: false });

    await flow.start("skills");

    expect(events.slice(2)).toEqual([
      "say: SKILLS PARK: not this time. The answers are in the CV.",
      "ended: skills, won: false",
      "open: skills",
    ]);
  });

  it("does nothing for a building without a minigame", async () => {
    const { flow, play, events } = setUp();

    await flow.start("experience");

    expect(play).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("doesn't start a second minigame while one is running", async () => {
    const { flow, player, play, events } = setUp();
    player.isRunning = true;

    await flow.start("skills");

    expect(play).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });
});
