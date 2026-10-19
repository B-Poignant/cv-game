// The career timeline's rules (F-072), free of Pixi so they can be unit tested.

import type { Experience } from "../../../domain/Experience";
import { shuffle } from "../shuffle";

/** Tuning values. Exported so tests can reason about them. */
export const TIMELINE_RULES = {
  /** Jobs drawn from the CV for one game. */
  cards: 5,
  /** The game is lost on this many wrong picks. */
  mistakesToLose: 3,
  durationSeconds: 60,
  /** Longest frame simulated, like the other minigames. */
  maxFrameSeconds: 0.1,
} as const;

export interface JobCard {
  readonly id: number;
  /** "Company — role", in French like the CV. */
  readonly label: string;
  /** `YYYY-MM`: the answer, never shown during the game. */
  readonly startDate: string;
}

export interface TimelineState {
  /** In the order they are shown (shuffled). */
  readonly cards: readonly JobCard[];
  /** Ids picked in the right order so far, oldest first. */
  placed: number[];
  mistakes: number;
  timeLeft: number;
}

export type TimelineOutcome = "playing" | "won" | "lost";

/** Up to `TIMELINE_RULES.cards` different jobs from the CV, shuffled. */
export function timelineCards(
  experiences: readonly Experience[],
  random: () => number = Math.random,
): JobCard[] {
  const jobs = experiences.map((experience, id) => ({
    id,
    label: `${experience.company} — ${experience.role}`,
    startDate: experience.startDate,
  }));

  return shuffle(shuffle(jobs, random).slice(0, TIMELINE_RULES.cards), random);
}

export function createTimelineState(cards: readonly JobCard[]): TimelineState {
  return {
    cards,
    placed: [],
    mistakes: 0,
    timeLeft: TIMELINE_RULES.durationSeconds,
  };
}

/**
 * The visitor picks the next job, oldest first. Right when nothing left started earlier
 * (jobs that started the same month are interchangeable). Returns "ignored" for a card
 * already placed, an unknown id, or once the game is over.
 */
export function pickJob(
  state: TimelineState,
  id: number,
): "right" | "wrong" | "ignored" {
  const card = state.cards.find((candidate) => candidate.id === id);

  if (
    timelineOutcome(state) !== "playing" ||
    !card ||
    state.placed.includes(id)
  ) {
    return "ignored";
  }

  const oldestLeft = state.cards
    .filter((candidate) => !state.placed.includes(candidate.id))
    .reduce((oldest, candidate) =>
      candidate.startDate < oldest.startDate ? candidate : oldest,
    );

  if (card.startDate !== oldestLeft.startDate) {
    state.mistakes += 1;
    return "wrong";
  }

  state.placed.push(id);
  return "right";
}

/** Runs the clock (frames capped at `maxFrameSeconds`). */
export function stepTimeline(state: TimelineState, deltaSeconds: number): void {
  if (timelineOutcome(state) !== "playing") {
    return;
  }

  const seconds = Math.min(deltaSeconds, TIMELINE_RULES.maxFrameSeconds);

  state.timeLeft = Math.max(0, state.timeLeft - seconds);
}

export function timelineOutcome(state: TimelineState): TimelineOutcome {
  if (state.placed.length === state.cards.length) {
    return "won";
  }

  if (state.mistakes >= TIMELINE_RULES.mistakesToLose || state.timeLeft <= 0) {
    return "lost";
  }

  return "playing";
}
