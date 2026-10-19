// The buzzword catcher's rules (F-071), free of Pixi so they can be unit tested.
// Positions are fractions of the play area: x from 0 (left) to 1 (right), y from 0 (top)
// to 1 (bottom), so a resize only changes how the view scales them.

/** Tuning values. Exported so tests can reason about them. */
export const CATCHER_RULES = {
  durationSeconds: 40,
  targetScore: 6,
  pointsPerCatch: 1,
  /** Catching a word to dodge costs this many points. */
  pointsPerMistake: 2,
  spawnIntervalSeconds: 0.9,
  /** Chance that a new word is one to catch. */
  catchableShare: 0.6,
  /** Fraction of the height a word falls per second (a fall lasts about 2.7 s). */
  fallSpeed: 0.33,
  /** Fraction of the width the basket moves per second. */
  basketSpeed: 1.2,
  basketWidth: 0.2,
  /** Height of the basket's top edge, where words are caught or missed. */
  basketY: 0.9,
  /** Words spawn this far from the sides so their labels stay on the board. */
  sideMargin: 0.1,
  /** Longest frame simulated, so a hidden tab doesn't drop a burst of words at once. */
  maxFrameSeconds: 0.1,
} as const;

export interface FallingWord {
  readonly id: number;
  readonly word: string;
  /** In the dev's stack: catching it scores, catching any other word costs points. */
  readonly catchable: boolean;
  readonly x: number;
  y: number;
}

export interface CatcherState {
  basketX: number;
  words: FallingWord[];
  score: number;
  timeLeft: number;
  nextSpawnIn: number;
  nextId: number;
}

export interface CatcherInput {
  /** -1 left, 1 right, 0 still (keyboard). */
  direction: -1 | 0 | 1;
  /** Where the pointer is, if it moved more recently than a key was pressed. */
  targetX?: number;
}

/** A word that reached the basket's height this frame. */
export interface CatcherEvent {
  word: FallingWord;
  caught: boolean;
  /** Score change: positive for a good catch, negative for a mistake, 0 for a miss. */
  points: number;
}

export type CatcherOutcome = "playing" | "won" | "lost";

export interface WordPools {
  catchable: readonly string[];
  toDodge: readonly string[];
}

export function createCatcherState(): CatcherState {
  return {
    basketX: 0.5,
    words: [],
    score: 0,
    timeLeft: CATCHER_RULES.durationSeconds,
    // The first word drops right away.
    nextSpawnIn: 0,
    nextId: 1,
  };
}

/**
 * Advances the game by `deltaSeconds` (capped at `maxFrameSeconds`): moves the basket,
 * spawns and drops words, and scores the ones reaching the basket. Mutates `state`, returns
 * the words that reached the basket. Does nothing once the game is over.
 */
export function stepCatcher(
  state: CatcherState,
  deltaSeconds: number,
  input: CatcherInput,
  pools: WordPools,
  random: () => number = Math.random,
): CatcherEvent[] {
  if (catcherOutcome(state) !== "playing") {
    return [];
  }

  const seconds = Math.min(deltaSeconds, CATCHER_RULES.maxFrameSeconds);

  state.timeLeft = Math.max(0, state.timeLeft - seconds);
  moveBasket(state, seconds, input);
  spawnWords(state, seconds, pools, random);

  return dropWords(state, seconds);
}

export function catcherOutcome(state: CatcherState): CatcherOutcome {
  if (state.score >= CATCHER_RULES.targetScore) {
    return "won";
  }

  return state.timeLeft <= 0 ? "lost" : "playing";
}

/** Whether a word at `x` lands in a basket centred on `basketX`. */
export function isInBasket(x: number, basketX: number): boolean {
  return Math.abs(x - basketX) <= CATCHER_RULES.basketWidth / 2;
}

function moveBasket(
  state: CatcherState,
  seconds: number,
  input: CatcherInput,
): void {
  const reach = CATCHER_RULES.basketSpeed * seconds;
  const half = CATCHER_RULES.basketWidth / 2;
  let next = state.basketX + input.direction * reach;

  if (input.targetX !== undefined) {
    const gap = input.targetX - state.basketX;

    next = state.basketX + Math.sign(gap) * Math.min(Math.abs(gap), reach);
  }

  state.basketX = Math.min(1 - half, Math.max(half, next));
}

function spawnWords(
  state: CatcherState,
  seconds: number,
  pools: WordPools,
  random: () => number,
): void {
  state.nextSpawnIn -= seconds;

  while (state.nextSpawnIn <= 0) {
    state.words.push(newWord(state.nextId, pools, random));
    state.nextId += 1;
    state.nextSpawnIn += CATCHER_RULES.spawnIntervalSeconds;
  }
}

function newWord(
  id: number,
  pools: WordPools,
  random: () => number,
): FallingWord {
  const catchable = random() < CATCHER_RULES.catchableShare;
  const pool = catchable ? pools.catchable : pools.toDodge;
  const word = pool[Math.floor(random() * pool.length)] ?? "";
  const span = 1 - 2 * CATCHER_RULES.sideMargin;

  return {
    id,
    word,
    catchable,
    x: CATCHER_RULES.sideMargin + random() * span,
    y: 0,
  };
}

function dropWords(state: CatcherState, seconds: number): CatcherEvent[] {
  const events: CatcherEvent[] = [];

  for (const word of state.words) {
    word.y += CATCHER_RULES.fallSpeed * seconds;

    if (word.y >= CATCHER_RULES.basketY) {
      events.push(scoreWord(word, state.basketX));
    }
  }

  state.words = state.words.filter((word) => word.y < CATCHER_RULES.basketY);
  for (const event of events) {
    state.score = Math.max(0, state.score + event.points);
  }

  return events;
}

function scoreWord(word: FallingWord, basketX: number): CatcherEvent {
  if (!isInBasket(word.x, basketX)) {
    return { word, caught: false, points: 0 };
  }

  return {
    word,
    caught: true,
    points: word.catchable
      ? CATCHER_RULES.pointsPerCatch
      : -CATCHER_RULES.pointsPerMistake,
  };
}
