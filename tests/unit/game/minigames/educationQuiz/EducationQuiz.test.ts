// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { THEMES } from "../../../../../src/config/themes";
import { CV } from "../../../../../src/content/cv";
import { ChoiceButton } from "../../../../../src/game/minigames/ChoiceButton";
import {
  EducationQuiz,
  educationQuiz,
} from "../../../../../src/game/minigames/educationQuiz/EducationQuiz";
import {
  QUIZ_RULES,
  quizQuestions,
} from "../../../../../src/game/minigames/educationQuiz/quizRules";

const CONTEXT = { width: 600, height: 400, theme: THEMES[0] };
const QUESTIONS = quizQuestions(CV);

function createQuiz() {
  const finish = vi.fn();
  const quiz = new EducationQuiz(CONTEXT, finish, CV, Math.random);
  const buttons = () =>
    quiz.view.children
      .flatMap((child) => child.children)
      .filter((child): child is ChoiceButton => child instanceof ChoiceButton);
  const hud = () =>
    quiz.view.children.find((child) => child instanceof Text) as Text;
  const tap = (text: string) => {
    buttons()
      .find((button) => button.text === text)
      ?.emit("pointertap", undefined as never);
    quiz.update(QUIZ_RULES.feedbackSeconds);
  };

  return { quiz, finish, buttons, hud, tap };
}

// F-074
describe("EducationQuiz", () => {
  it("is the Education Campus minigame", () => {
    expect(educationQuiz(CV).title).toBe("EDUCATION CAMPUS: QUIZ");
  });

  it("asks the first question with its answers as buttons", () => {
    const { quiz, hud } = createQuiz();

    expect(hud().text).toContain(QUESTIONS[0].prompt);
    expect(hud().text).toContain("Question 1/3");
    expect([...quiz.choiceTexts].sort()).toEqual(
      [QUESTIONS[0].answer, ...QUESTIONS[0].wrong].sort(),
    );
  });

  it("marks the right answer, even after a wrong guess", () => {
    const { buttons } = createQuiz();
    const wrong = QUESTIONS[0].wrong[0];

    buttons()
      .find((button) => button.text === wrong)
      ?.emit("pointertap", undefined as never);

    const marks = Object.fromEntries(
      buttons().map((button) => [button.text, button.mark]),
    );
    expect(marks[QUESTIONS[0].answer]).toBe("right");
    expect(marks[wrong]).toBe("wrong");
  });

  it("moves on to the next question after the feedback", () => {
    const { hud, tap } = createQuiz();

    tap(QUESTIONS[0].answer);
    tap(QUESTIONS[1].wrong[0]);

    expect(hud().text).toContain(QUESTIONS[2].prompt);
  });

  it("wins with two right answers out of three", () => {
    const { quiz, finish, tap } = createQuiz();

    tap(QUESTIONS[0].answer);
    tap(QUESTIONS[1].wrong[0]);
    tap(QUESTIONS[2].answer);
    quiz.update(0.016);

    expect(finish).toHaveBeenCalledExactlyOnceWith({ won: true });
  });

  it("loses with fewer, and reports the end only once", () => {
    const { quiz, finish, tap } = createQuiz();

    for (const question of QUESTIONS) {
      tap(question.wrong[0]);
    }
    quiz.update(0.016);
    quiz.update(0.016);

    expect(finish).toHaveBeenCalledExactlyOnceWith({ won: false });
  });

  it("recolours its text with the theme", () => {
    const { quiz, hud, buttons } = createQuiz();

    quiz.applyTheme(THEMES[2]);

    expect(hud().style.fill).toBe(THEMES[2].label);
    expect(buttons()).not.toHaveLength(0);
  });

  it("wraps the question to the new width", () => {
    const { quiz, hud } = createQuiz();

    quiz.resize(300);

    expect(hud().style.wordWrapWidth).toBe(300);
  });
});
