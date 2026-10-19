import { Container, Text } from "pixi.js";

import type { Theme } from "../../../config/themes";
import type { Cv } from "../../../domain/Cv";
import { ChoiceButton } from "../ChoiceButton";
import type {
  Minigame,
  MinigameContext,
  MinigameDefinition,
  MinigameResult,
} from "../Minigame";
import {
  createTimelineState,
  pickJob,
  stepTimeline,
  TIMELINE_RULES,
  timelineCards,
  timelineOutcome,
  type TimelineState,
} from "./timelineRules";

const HUD_HEIGHT = 56;
const MAX_CARD_HEIGHT = 56;
const CARD_GAP = 10;
const FONT = { fontFamily: "sans-serif", fontSize: 16 } as const;

/**
 * Experience Avenue's minigame (F-072): jobs from the CV, shuffled; pick them from the
 * oldest to the newest. The rules are in `timelineRules.ts`; this class draws the cards as
 * `ChoiceButton`s (mouse, touch, or Tab + Enter).
 */
export class CareerTimeline implements Minigame {
  public readonly view = new Container();

  private readonly state: TimelineState;
  private readonly finish: (result: MinigameResult) => void;
  private readonly hud: Text;
  private readonly cards: ChoiceButton[];

  private width: number;
  private height: number;
  private finished = false;

  constructor(
    context: MinigameContext,
    finish: (result: MinigameResult) => void,
    cv: Cv,
    random: () => number = Math.random,
  ) {
    this.finish = finish;
    this.width = context.width;
    this.height = context.height;
    this.state = createTimelineState(timelineCards(cv.experiences, random));
    this.hud = new Text({ text: "", style: { ...FONT, wordWrap: true } });
    this.cards = this.state.cards.map(
      (card) => new ChoiceButton(card.label, () => this.pick(card.id)),
    );

    this.view.label = "career-timeline";
    this.view.addChild(this.hud, ...this.cards);
    this.applyTheme(context.theme);
    this.layout();
    this.updateHud();
  }

  /** The job labels on screen, in order. */
  public get cardLabels(): string[] {
    return this.cards.map((card) => card.text);
  }

  public update(deltaSeconds: number): void {
    if (this.finished) {
      return;
    }

    stepTimeline(this.state, deltaSeconds);
    this.updateHud();
    this.endIfOver();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.layout();
  }

  public applyTheme(theme: Theme): void {
    this.hud.style.fill = theme.label;

    for (const card of this.cards) {
      card.applyTheme(theme);
    }
  }

  public destroy(): void {
    this.view.destroy({ children: true });
  }

  private pick(id: number): void {
    const result = pickJob(this.state, id);
    const index = this.state.cards.findIndex((card) => card.id === id);

    if (result === "ignored" || index < 0) {
      return;
    }

    const card = this.cards[index];

    for (const other of this.cards) {
      if (other.mark === "wrong") {
        other.setMark("open");
      }
    }
    card.setMark(result);
    this.updateHud();
    this.endIfOver();
  }

  private endIfOver(): void {
    const outcome = timelineOutcome(this.state);

    if (outcome === "playing") {
      return;
    }

    this.finished = true;
    this.finish({ won: outcome === "won" });
  }

  private updateHud(): void {
    const mistakesLeft = TIMELINE_RULES.mistakesToLose - this.state.mistakes;

    this.hud.text =
      `Placed ${String(this.state.placed.length)}/${String(this.cards.length)}  ·  ` +
      `${String(mistakesLeft)} mistakes left  ·  ${String(Math.ceil(this.state.timeLeft))} s\n` +
      "Pick his jobs from the oldest to the newest.";
  }

  private layout(): void {
    const count = Math.max(1, this.cards.length);
    const cardHeight = Math.min(
      MAX_CARD_HEIGHT,
      (this.height - HUD_HEIGHT) / count - CARD_GAP,
    );

    this.hud.style.wordWrapWidth = this.width;
    this.cards.forEach((card, index) => {
      card.setSize(this.width, Math.max(0, cardHeight));
      card.position.set(0, HUD_HEIGHT + index * (cardHeight + CARD_GAP));
    });
  }
}

/** Built from the CV by `createMinigames` (the scenes layer doesn't import content). */
export function careerTimeline(cv: Cv): MinigameDefinition {
  return {
    title: "EXPERIENCE AVENUE: CAREER TIMELINE",
    create: (context, finish) => new CareerTimeline(context, finish, cv),
  };
}
