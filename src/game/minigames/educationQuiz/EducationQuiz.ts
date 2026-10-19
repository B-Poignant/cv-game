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
  answerQuiz,
  createQuizState,
  currentQuestion,
  QUIZ_RULES,
  quizOutcome,
  quizQuestions,
  stepQuiz,
  type QuizState,
} from "./quizRules";

const HUD_HEIGHT = 72;
const CHOICE_HEIGHT = 48;
const CHOICE_GAP = 12;
const FONT = { fontFamily: "sans-serif", fontSize: 16 } as const;

/**
 * Education Campus's minigame (F-074): three multiple-choice questions about the education
 * section. The rules are in `quizRules.ts`; this class draws the question and its answers
 * as `ChoiceButton`s (mouse, touch, or Tab + Enter).
 */
export class EducationQuiz implements Minigame {
  public readonly view = new Container();

  private readonly state: QuizState;
  private readonly finish: (result: MinigameResult) => void;
  private readonly hud: Text;
  private readonly choiceLayer = new Container();

  private choices: ChoiceButton[] = [];
  private shownIndex = -1;
  private width: number;
  private theme: Theme;
  private finished = false;

  constructor(
    context: MinigameContext,
    finish: (result: MinigameResult) => void,
    cv: Cv,
    random: () => number = Math.random,
  ) {
    this.finish = finish;
    this.width = context.width;
    this.theme = context.theme;
    this.state = createQuizState(quizQuestions(cv), random);
    this.hud = new Text({
      text: "",
      style: { ...FONT, wordWrap: true, fontWeight: "bold" },
    });

    this.view.label = "education-quiz";
    this.view.addChild(this.hud, this.choiceLayer);
    this.render();
  }

  /** The answers on screen, in order. */
  public get choiceTexts(): string[] {
    return this.choices.map((choice) => choice.text);
  }

  public get rightAnswers(): number {
    return this.state.rightAnswers;
  }

  public update(deltaSeconds: number): void {
    if (this.finished) {
      return;
    }

    stepQuiz(this.state, deltaSeconds);

    const outcome = quizOutcome(this.state);

    if (outcome !== "playing") {
      this.finished = true;
      this.finish({ won: outcome === "won" });
      return;
    }

    if (this.shownIndex !== this.state.index) {
      this.render();
    }
  }

  public resize(width: number): void {
    this.width = width;
    this.layout();
  }

  public applyTheme(theme: Theme): void {
    this.theme = theme;
    this.hud.style.fill = theme.label;

    for (const choice of this.choices) {
      choice.applyTheme(theme);
    }
  }

  public destroy(): void {
    this.view.destroy({ children: true });
    this.choices = [];
  }

  /** Shows the current question and a fresh set of answers. */
  private render(): void {
    this.shownIndex = this.state.index;
    this.choiceLayer.removeChildren().forEach((child) => {
      child.destroy({ children: true });
    });
    this.choices = this.state.choices.map(
      (text) => new ChoiceButton(text, () => this.answer(text)),
    );
    this.choiceLayer.addChild(...this.choices);
    this.updateHud();
    this.layout();
    this.applyTheme(this.theme);
  }

  private answer(text: string): void {
    const isRight = answerQuiz(this.state, text);

    if (isRight === undefined) {
      return;
    }

    // The right answer is always shown, so a wrong guess still teaches the CV.
    const answer = currentQuestion(this.state)?.answer;

    for (const choice of this.choices) {
      if (choice.text === answer) {
        choice.setMark("right");
      } else {
        choice.setMark(choice.text === text ? "wrong" : "done");
      }
    }
    this.updateHud();
  }

  private updateHud(): void {
    const question = currentQuestion(this.state);
    const total = this.state.questions.length;

    this.hud.text =
      `Question ${String(this.state.index + 1)}/${String(total)}  ·  ` +
      `Right ${String(this.state.rightAnswers)} (${String(QUIZ_RULES.answersToWin)} to win)\n` +
      (question?.prompt ?? "");
  }

  private layout(): void {
    this.hud.style.wordWrapWidth = this.width;
    this.choices.forEach((choice, index) => {
      choice.setSize(this.width, CHOICE_HEIGHT);
      choice.position.set(0, HUD_HEIGHT + index * (CHOICE_HEIGHT + CHOICE_GAP));
    });
  }
}

/** Built from the CV by `createMinigames` (the scenes layer doesn't import content). */
export function educationQuiz(cv: Cv): MinigameDefinition {
  return {
    title: "EDUCATION CAMPUS: QUIZ",
    create: (context, finish) => new EducationQuiz(context, finish, cv),
  };
}
