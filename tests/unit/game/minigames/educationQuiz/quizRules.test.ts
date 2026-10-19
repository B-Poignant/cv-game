import { describe, expect, it } from "vitest";

import { CV } from "../../../../../src/content/cv";
import type { Cv } from "../../../../../src/domain/Cv";
import {
  answerQuiz,
  createQuizState,
  currentQuestion,
  QUIZ_RULES,
  quizOutcome,
  quizQuestions,
  stepQuiz,
  type QuizQuestion,
} from "../../../../../src/game/minigames/educationQuiz/quizRules";

const QUESTIONS: QuizQuestion[] = [
  { prompt: "Q1", answer: "A1", wrong: ["W1", "X1"] },
  { prompt: "Q2", answer: "A2", wrong: ["W2", "X2"] },
  { prompt: "Q3", answer: "A3", wrong: ["W3", "X3"] },
];

/** Answers the current question and waits for its feedback to end. */
function answerAndWait(
  state: ReturnType<typeof createQuizState>,
  choice: string,
) {
  const result = answerQuiz(state, choice);
  stepQuiz(state, QUIZ_RULES.feedbackSeconds);
  return result;
}

// F-074
describe("education quiz rules", () => {
  describe("questions from the CV", () => {
    it("asks three questions whose answers come from the CV", () => {
      const questions = quizQuestions(CV);

      expect(questions.map((question) => question.answer)).toEqual([
        CV.education[0].diploma,
        CV.education[0].school,
        "Français, Anglais",
      ]);
    });

    it("never offers the real answer as a wrong one", () => {
      for (const { answer, wrong } of quizQuestions(CV)) {
        expect(wrong).not.toContain(answer);
        expect(new Set(wrong).size).toBe(wrong.length);
      }
    });

    it("leaves out questions the CV has nothing for", () => {
      const empty: Cv = { ...CV, education: [], languages: [] };

      expect(quizQuestions(empty)).toEqual([]);
    });
  });

  it("offers the answer and the wrong ones for the first question", () => {
    const state = createQuizState(QUESTIONS, () => 0.5);

    expect([...state.choices].sort()).toEqual(["A1", "W1", "X1"]);
    expect(currentQuestion(state)?.prompt).toBe("Q1");
  });

  it("counts a right answer, and not a wrong one", () => {
    const state = createQuizState(QUESTIONS);

    expect(answerAndWait(state, "A1")).toBe(true);
    expect(answerAndWait(state, "W2")).toBe(false);

    expect(state.rightAnswers).toBe(1);
  });

  it("shows the feedback before moving on to the next question", () => {
    const state = createQuizState(QUESTIONS);

    answerQuiz(state, "A1");
    stepQuiz(state, QUIZ_RULES.feedbackSeconds / 2);

    expect(state.index).toBe(0);

    stepQuiz(state, QUIZ_RULES.feedbackSeconds / 2);

    expect(state.index).toBe(1);
    expect([...state.choices].sort()).toEqual(["A2", "W2", "X2"]);
  });

  it.each([
    { label: "a second answer during the feedback", first: "A1", then: "W1" },
    { label: "an answer that isn't offered", first: "nope", then: "nope" },
  ])("ignores $label", ({ first, then }) => {
    const state = createQuizState(QUESTIONS);

    answerQuiz(state, first);

    expect(answerQuiz(state, then)).toBeUndefined();
  });

  it("is won with enough right answers once every question is answered", () => {
    const state = createQuizState(QUESTIONS);

    answerAndWait(state, "A1");
    answerAndWait(state, "A2");

    expect(quizOutcome(state)).toBe("playing");

    answerAndWait(state, "W3");

    expect(QUIZ_RULES.answersToWin).toBe(2);
    expect(quizOutcome(state)).toBe("won");
  });

  it("is lost with too few right answers", () => {
    const state = createQuizState(QUESTIONS);

    answerAndWait(state, "A1");
    answerAndWait(state, "W2");
    answerAndWait(state, "W3");

    expect(quizOutcome(state)).toBe("lost");
  });

  it("ignores answers once the quiz is over", () => {
    const state = createQuizState(QUESTIONS);
    for (const answer of ["A1", "A2", "A3"]) {
      answerAndWait(state, answer);
    }

    expect(answerQuiz(state, "A1")).toBeUndefined();
    expect(state.rightAnswers).toBe(3);
  });
});
