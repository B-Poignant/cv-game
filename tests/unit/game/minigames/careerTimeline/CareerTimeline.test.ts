// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { THEMES } from "../../../../../src/config/themes";
import { CV } from "../../../../../src/content/cv";
import {
  CareerTimeline,
  careerTimeline,
} from "../../../../../src/game/minigames/careerTimeline/CareerTimeline";
import { ChoiceButton } from "../../../../../src/game/minigames/ChoiceButton";
import { TIMELINE_RULES } from "../../../../../src/game/minigames/careerTimeline/timelineRules";

const CONTEXT = { width: 600, height: 400, theme: THEMES[0] };

/** Labels of the CV's jobs from the oldest to the newest. */
const CHRONOLOGICAL = [...CV.experiences]
  .sort((a, b) => a.startDate.localeCompare(b.startDate))
  .map((experience) => `${experience.company} — ${experience.role}`);

function createTimeline() {
  const finish = vi.fn();
  const timeline = new CareerTimeline(CONTEXT, finish, CV, Math.random);
  const buttons = timeline.view.children.filter(
    (child): child is ChoiceButton => child instanceof ChoiceButton,
  );
  const hud = timeline.view.children.find(
    (child) => child instanceof Text,
  ) as Text;
  const tap = (label: string) =>
    buttons
      .find((button) => button.text === label)
      ?.emit("pointertap", undefined as never);
  const inOrder = () =>
    CHRONOLOGICAL.filter((label) => timeline.cardLabels.includes(label));

  return { timeline, finish, buttons, hud, tap, inOrder };
}

// F-072
describe("CareerTimeline", () => {
  it("is the Experience Avenue minigame", () => {
    expect(careerTimeline(CV).title).toBe("EXPERIENCE AVENUE: CAREER TIMELINE");
  });

  it("shows jobs from the CV as buttons, and how to play", () => {
    const { buttons, hud } = createTimeline();

    expect(buttons).toHaveLength(TIMELINE_RULES.cards);
    expect(hud.text).toContain("from the oldest to the newest");
    expect(hud.text).toContain("Placed 0/5");
  });

  it("wins once every job is picked from the oldest to the newest", () => {
    const { finish, tap, inOrder } = createTimeline();

    for (const label of inOrder()) {
      tap(label);
    }

    expect(finish).toHaveBeenCalledExactlyOnceWith({ won: true });
  });

  it("marks a job picked too early, until the next pick", () => {
    const { buttons, tap, inOrder, hud } = createTimeline();
    const newest = inOrder().at(-1)!;
    const card = buttons.find((button) => button.text === newest)!;

    tap(newest);

    expect(card.mark).toBe("wrong");
    expect(hud.text).toContain(
      `${String(TIMELINE_RULES.mistakesToLose - 1)} mistakes left`,
    );

    tap(inOrder()[0]);

    expect(card.mark).toBe("open");
  });

  it("loses after too many mistakes", () => {
    const { finish, tap, inOrder } = createTimeline();
    // Any job but the oldest is picked too early. A job marked wrong can't be picked again
    // until the next pick, so each mistake is on a different one.
    const tooEarly = inOrder().slice(1).reverse();

    for (const label of tooEarly.slice(0, TIMELINE_RULES.mistakesToLose)) {
      tap(label);
    }

    expect(finish).toHaveBeenCalledExactlyOnceWith({ won: false });
  });

  it("loses when time runs out, and reports it only once", () => {
    const { timeline, finish } = createTimeline();
    const frames =
      TIMELINE_RULES.durationSeconds / TIMELINE_RULES.maxFrameSeconds;

    for (let frame = 0; frame < frames + 5; frame += 1) {
      timeline.update(TIMELINE_RULES.maxFrameSeconds);
    }

    expect(finish).toHaveBeenCalledExactlyOnceWith({ won: false });
  });

  it("recolours its text with the theme, and fits a smaller board", () => {
    const { timeline, hud, buttons } = createTimeline();

    timeline.applyTheme(THEMES[1]);
    timeline.resize(300, 300);

    expect(hud.style.fill).toBe(THEMES[1].label);
    expect(hud.style.wordWrapWidth).toBe(300);
    expect(buttons.at(-1)!.y).toBeLessThan(300);
  });
});
