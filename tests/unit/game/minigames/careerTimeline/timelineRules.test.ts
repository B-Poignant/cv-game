import { describe, expect, it } from "vitest";

import { CV } from "../../../../../src/content/cv";
import {
  createTimelineState,
  pickJob,
  stepTimeline,
  TIMELINE_RULES,
  timelineCards,
  timelineOutcome,
  type JobCard,
} from "../../../../../src/game/minigames/careerTimeline/timelineRules";

/** Shown newest first, so the right order is the reverse. */
const CARDS: JobCard[] = [
  { id: 1, label: "Acme — Lead", startDate: "2020-01" },
  { id: 2, label: "Acme — Dev", startDate: "2015-06" },
  { id: 3, label: "Initech — Dev", startDate: "2010-03" },
];

// F-072
describe("career timeline rules", () => {
  describe("cards from the CV", () => {
    it("draws different jobs from the CV, labelled with the company and role", () => {
      const cards = timelineCards(CV.experiences);
      const labels = CV.experiences.map(
        (experience) => `${experience.company} — ${experience.role}`,
      );

      expect(cards).toHaveLength(TIMELINE_RULES.cards);
      expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
      for (const card of cards) {
        expect(labels).toContain(card.label);
      }
    });

    it("keeps every job when the CV has fewer than a game needs", () => {
      const cards = timelineCards(CV.experiences.slice(0, 2));

      expect(cards).toHaveLength(2);
    });

    it("never repeats a label, so each card is a distinct button", () => {
      const labels = CV.experiences.map(
        (experience) => `${experience.company} — ${experience.role}`,
      );

      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  it("is won by picking every job from the oldest to the newest", () => {
    const state = createTimelineState(CARDS);

    expect(pickJob(state, 3)).toBe("right");
    expect(pickJob(state, 2)).toBe("right");
    expect(timelineOutcome(state)).toBe("playing");
    expect(pickJob(state, 1)).toBe("right");

    expect(state.placed).toEqual([3, 2, 1]);
    expect(timelineOutcome(state)).toBe("won");
  });

  it("counts a job picked too early as a mistake, without placing it", () => {
    const state = createTimelineState(CARDS);

    expect(pickJob(state, 1)).toBe("wrong");

    expect(state.mistakes).toBe(1);
    expect(state.placed).toEqual([]);
  });

  it("accepts either of two jobs that started the same month", () => {
    const state = createTimelineState([
      { id: 1, label: "A", startDate: "2020-01" },
      { id: 2, label: "B", startDate: "2020-01" },
    ]);

    expect(pickJob(state, 2)).toBe("right");
    expect(pickJob(state, 1)).toBe("right");
  });

  it.each([
    { label: "a job already placed", id: 3 },
    { label: "an unknown job", id: 99 },
  ])("ignores $label", ({ id }) => {
    const state = createTimelineState(CARDS);
    pickJob(state, 3);

    expect(pickJob(state, id)).toBe("ignored");
    expect(state.mistakes).toBe(0);
  });

  it(`is lost after ${String(TIMELINE_RULES.mistakesToLose)} mistakes`, () => {
    const state = createTimelineState(CARDS);

    for (
      let mistake = 0;
      mistake < TIMELINE_RULES.mistakesToLose;
      mistake += 1
    ) {
      pickJob(state, 1);
    }

    expect(timelineOutcome(state)).toBe("lost");
    expect(pickJob(state, 3)).toBe("ignored");
  });

  it("is lost when time runs out", () => {
    const state = createTimelineState(CARDS);
    const frames =
      TIMELINE_RULES.durationSeconds / TIMELINE_RULES.maxFrameSeconds;

    for (let frame = 0; frame < frames + 1; frame += 1) {
      stepTimeline(state, TIMELINE_RULES.maxFrameSeconds);
    }

    expect(state.timeLeft).toBe(0);
    expect(timelineOutcome(state)).toBe("lost");
  });

  it("caps a long frame, so a hidden tab doesn't eat the clock", () => {
    const state = createTimelineState(CARDS);

    stepTimeline(state, 30);

    expect(state.timeLeft).toBeCloseTo(
      TIMELINE_RULES.durationSeconds - TIMELINE_RULES.maxFrameSeconds,
    );
  });
});
