// The education quiz's rules (F-074), free of Pixi so they can be unit tested.

import type { Cv } from "../../../domain/Cv";
import { shuffle } from "../shuffle";

/** Tuning values. Exported so tests can reason about them. */
export const QUIZ_RULES = {
  /** Right answers needed out of the questions asked. */
  answersToWin: 2,
  /** How long the right answer stays shown before the next question. */
  feedbackSeconds: 1.5,
} as const;

export interface QuizQuestion {
  /** In English, like the game UI. */
  readonly prompt: string;
  /** From the CV, in French. */
  readonly answer: string;
  /** Joke answers: recruiting clichés, never someone's real background. */
  readonly wrong: readonly string[];
}

export interface QuizState {
  readonly questions: readonly QuizQuestion[];
  /** The current question's answers, shuffled. */
  choices: string[];
  index: number;
  rightAnswers: number;
  /** The choice picked for the current question, while its feedback shows. */
  picked?: string;
  feedbackLeft: number;
  random: () => number;
}

export type QuizOutcome = "playing" | "won" | "lost";

/**
 * Three questions about the education section, built from the CV so they never disagree
 * with it: the diploma, the school and the languages. A question is left out when the CV
 * has nothing to ask about.
 */
export function quizQuestions(cv: Cv): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  if (cv.education.length > 0) {
    const [latest] = cv.education;

    questions.push(
      {
        prompt: "Which diploma does Ben hold?",
        answer: latest.diploma,
        wrong: ["MBA Synergie & Disruption", "Master Blockchain-native"],
      },
      {
        prompt: "Where did he study?",
        answer: latest.school,
        wrong: ["École des Rockstars Ninjas", "Université du Quick Call"],
      },
    );
  }

  if (cv.languages.length > 0) {
    questions.push({
      prompt: "Which languages does he speak?",
      answer: cv.languages.map((language) => language.name).join(", "),
      wrong: ["Français, Klingon", "COBOL, Fortran"],
    });
  }

  return questions;
}

export function createQuizState(
  questions: readonly QuizQuestion[],
  random: () => number = Math.random,
): QuizState {
  return {
    questions,
    choices: choicesFor(questions[0], random),
    index: 0,
    rightAnswers: 0,
    feedbackLeft: 0,
    random,
  };
}

export function currentQuestion(state: QuizState): QuizQuestion | undefined {
  return state.questions[state.index];
}

/**
 * Answers the current question. Returns whether `choice` was right, or undefined when the
 * answer is ignored (feedback still showing, not one of the choices, or the quiz is over).
 */
export function answerQuiz(
  state: QuizState,
  choice: string,
): boolean | undefined {
  const question = currentQuestion(state);

  if (
    !question ||
    state.picked !== undefined ||
    !state.choices.includes(choice)
  ) {
    return undefined;
  }

  const isRight = choice === question.answer;

  state.picked = choice;
  state.feedbackLeft = QUIZ_RULES.feedbackSeconds;
  if (isRight) {
    state.rightAnswers += 1;
  }

  return isRight;
}

/** Counts down the feedback after an answer, then moves on to the next question. */
export function stepQuiz(state: QuizState, deltaSeconds: number): void {
  if (state.picked === undefined) {
    return;
  }

  state.feedbackLeft -= deltaSeconds;

  if (state.feedbackLeft > 0) {
    return;
  }

  state.picked = undefined;
  state.feedbackLeft = 0;
  state.index += 1;
  state.choices = choicesFor(state.questions[state.index], state.random);
}

/** Over once every question was answered and its feedback shown. */
export function quizOutcome(state: QuizState): QuizOutcome {
  if (state.index < state.questions.length) {
    return "playing";
  }

  return state.rightAnswers >= QUIZ_RULES.answersToWin ? "won" : "lost";
}

function choicesFor(
  question: QuizQuestion | undefined,
  random: () => number,
): string[] {
  return question ? shuffle([question.answer, ...question.wrong], random) : [];
}
