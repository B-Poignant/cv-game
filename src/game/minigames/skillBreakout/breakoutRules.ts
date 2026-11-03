// The skill breakout's rules (F-071), free of Pixi so they can be unit tested.
// Positions are in field units: x from 0 (left) to `field.width`, y from 0 (top) to
// `field.height`. The view scales the whole field evenly, so a resize changes nothing here.

import { shuffle } from "../shuffle";

/** Tuning values. Exported so tests can reason about them. */
export const BREAKOUT_RULES = {
  field: { width: 400, height: 300 },
  columns: 5,
  rows: 4,
  /** Brick wall: distance from the top and the sides, gap between bricks, brick height. */
  wall: { top: 24, side: 10, gap: 4, brickHeight: 22 },
  /** `y` is the paddle's top edge. Speed in units per second. */
  paddle: { width: 72, height: 8, y: 280, speed: 400 },
  ballRadius: 5,
  /** Units per second at the start. */
  ballSpeed: 210,
  /** Breaking an empty brick speeds the ball up by this share, up to `maxBallSpeed`. */
  emptyBrickSpeedUp: 0.06,
  maxBallSpeed: 320,
  /** Hitting the paddle's edge sends the ball off at this angle from the vertical. */
  maxBounceAngle: Math.PI / 3,
  /** A new ball rests on the paddle this long, then leaves on its own. */
  serveDelaySeconds: 1,
  /** A served ball leaves at most this far from the vertical, either side. */
  maxServeAngle: Math.PI / 6,
  lives: 3,
  /** Longest frame simulated, so a hidden tab doesn't skip the game. */
  maxFrameSeconds: 0.1,
  /** Longest distance the ball moves in one collision check, so it can't skip a brick. */
  maxStep: 2,
} as const;

export interface Brick {
  readonly id: number;
  /** The skill it holds, or "" for an empty brick. */
  readonly word: string;
  /** Holds one of the dev's real skills: breaking all of these wins. */
  readonly skill: boolean;
  /** Top-left corner and size, in field units. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  broken: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface BreakoutState {
  /** Centre of the paddle. */
  paddleX: number;
  ball: Ball;
  /** Current ball speed, in units per second. */
  speed: number;
  /** Seconds before the resting ball leaves the paddle; 0 once it is in play. */
  serveIn: number;
  bricks: Brick[];
  lives: number;
}

export interface BreakoutInput {
  /** -1 left, 1 right, 0 still (keyboard). */
  direction: -1 | 0 | 1;
  /** Where the pointer is, in field units, if it moved more recently than a key was pressed. */
  targetX?: number;
}

export type BreakoutEvent =
  { type: "brick"; brick: Brick } | { type: "ball-lost"; livesLeft: number };

export type BreakoutOutcome = "playing" | "won" | "lost";

/**
 * A fresh game: every skill gets a brick, empty bricks fill the rest of the wall, and the
 * skills are shuffled across it.
 */
export function createBreakoutState(
  skills: readonly string[],
  random: () => number = Math.random,
): BreakoutState {
  const centre = BREAKOUT_RULES.field.width / 2;

  return {
    paddleX: centre,
    ball: restingBall(centre),
    speed: BREAKOUT_RULES.ballSpeed,
    serveIn: BREAKOUT_RULES.serveDelaySeconds,
    bricks: buildWall(skills, random),
    lives: BREAKOUT_RULES.lives,
  };
}

/**
 * Advances the game by `deltaSeconds` (capped at `maxFrameSeconds`): moves the paddle, serves
 * or moves the ball, bounces it and breaks the bricks it hits. Mutates `state`, returns what
 * happened. Does nothing once the game is over.
 */
export function stepBreakout(
  state: BreakoutState,
  deltaSeconds: number,
  input: BreakoutInput,
  random: () => number = Math.random,
): BreakoutEvent[] {
  if (breakoutOutcome(state) !== "playing") {
    return [];
  }

  const seconds = Math.min(deltaSeconds, BREAKOUT_RULES.maxFrameSeconds);

  movePaddle(state, seconds, input);

  if (state.serveIn > 0) {
    state.serveIn = Math.max(0, state.serveIn - seconds);
    state.ball = restingBall(state.paddleX);
    if (state.serveIn === 0) {
      serve(state, random);
    }
    return [];
  }

  return moveBall(state, seconds);
}

export function breakoutOutcome(state: BreakoutState): BreakoutOutcome {
  if (state.bricks.every((brick) => !brick.skill || brick.broken)) {
    return "won";
  }

  return state.lives <= 0 ? "lost" : "playing";
}

/** The skill bricks broken so far, in the order of the wall. */
export function skillsFound(state: BreakoutState): string[] {
  return state.bricks
    .filter((brick) => brick.skill && brick.broken)
    .map((brick) => brick.word);
}

export function skillCount(state: BreakoutState): number {
  return state.bricks.filter((brick) => brick.skill).length;
}

function buildWall(skills: readonly string[], random: () => number): Brick[] {
  const { columns, rows, wall, field } = BREAKOUT_RULES;
  const cells = columns * rows;
  const words = [
    ...skills.slice(0, cells),
    ...Array<string>(Math.max(0, cells - skills.length)).fill(""),
  ];
  const width =
    (field.width - 2 * wall.side - (columns - 1) * wall.gap) / columns;

  return shuffle(words, random).map((word, index) => ({
    id: index + 1,
    word,
    skill: word !== "",
    x: wall.side + (index % columns) * (width + wall.gap),
    y: wall.top + Math.floor(index / columns) * (wall.brickHeight + wall.gap),
    width,
    height: wall.brickHeight,
    broken: false,
  }));
}

function restingBall(paddleX: number): Ball {
  return {
    x: paddleX,
    y: BREAKOUT_RULES.paddle.y - BREAKOUT_RULES.ballRadius,
    vx: 0,
    vy: 0,
  };
}

function serve(state: BreakoutState, random: () => number): void {
  const angle = (random() * 2 - 1) * BREAKOUT_RULES.maxServeAngle;

  setDirection(state, angle);
}

/** Sends the ball upwards at `angle` from the vertical (positive is to the right). */
function setDirection(state: BreakoutState, angle: number): void {
  state.ball.vx = state.speed * Math.sin(angle);
  state.ball.vy = -state.speed * Math.cos(angle);
}

function movePaddle(
  state: BreakoutState,
  seconds: number,
  input: BreakoutInput,
): void {
  const { paddle, field } = BREAKOUT_RULES;
  const reach = paddle.speed * seconds;
  const half = paddle.width / 2;
  let next = state.paddleX + input.direction * reach;

  if (input.targetX !== undefined) {
    const gap = input.targetX - state.paddleX;

    next = state.paddleX + Math.sign(gap) * Math.min(Math.abs(gap), reach);
  }

  state.paddleX = Math.min(field.width - half, Math.max(half, next));
}

function moveBall(state: BreakoutState, seconds: number): BreakoutEvent[] {
  const steps = Math.max(
    1,
    Math.ceil((state.speed * seconds) / BREAKOUT_RULES.maxStep),
  );
  const events: BreakoutEvent[] = [];

  for (let step = 0; step < steps; step += 1) {
    state.ball.x += (state.ball.vx * seconds) / steps;
    state.ball.y += (state.ball.vy * seconds) / steps;

    bounceOffWalls(state.ball);
    bounceOffPaddle(state);

    const brick = hitBrick(state);

    if (brick) {
      events.push({ type: "brick", brick });
      if (breakoutOutcome(state) === "won") {
        break;
      }
    }

    if (
      state.ball.y - BREAKOUT_RULES.ballRadius >
      BREAKOUT_RULES.field.height
    ) {
      state.lives -= 1;
      state.serveIn = BREAKOUT_RULES.serveDelaySeconds;
      state.ball = restingBall(state.paddleX);
      events.push({ type: "ball-lost", livesLeft: state.lives });
      break;
    }
  }

  return events;
}

function bounceOffWalls(ball: Ball): void {
  const radius = BREAKOUT_RULES.ballRadius;
  const { width } = BREAKOUT_RULES.field;

  if (ball.x - radius < 0) {
    ball.x = radius;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + radius > width) {
    ball.x = width - radius;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y - radius < 0) {
    ball.y = radius;
    ball.vy = Math.abs(ball.vy);
  }
}

/** The further from the paddle's centre the ball lands, the wider it bounces off. */
function bounceOffPaddle(state: BreakoutState): void {
  const { paddle, ballRadius, maxBounceAngle } = BREAKOUT_RULES;
  const { ball } = state;
  const half = paddle.width / 2;
  const touches =
    ball.vy > 0 &&
    ball.y + ballRadius >= paddle.y &&
    ball.y - ballRadius <= paddle.y + paddle.height &&
    Math.abs(ball.x - state.paddleX) <= half + ballRadius;

  if (!touches) {
    return;
  }

  const offset = Math.max(-1, Math.min(1, (ball.x - state.paddleX) / half));

  ball.y = paddle.y - ballRadius;
  setDirection(state, offset * maxBounceAngle);
}

/** Breaks the first brick the ball overlaps, if any, and bounces the ball off it. */
function hitBrick(state: BreakoutState): Brick | undefined {
  const { ball } = state;
  const radius = BREAKOUT_RULES.ballRadius;
  const brick = state.bricks.find(
    (candidate) => !candidate.broken && overlaps(ball, candidate, radius),
  );

  if (!brick) {
    return undefined;
  }

  brick.broken = true;

  const overlapX =
    Math.min(ball.x + radius, brick.x + brick.width) -
    Math.max(ball.x - radius, brick.x);
  const overlapY =
    Math.min(ball.y + radius, brick.y + brick.height) -
    Math.max(ball.y - radius, brick.y);

  // Bounce along the shallower overlap: a ball entering from a side bounces sideways.
  if (overlapX < overlapY) {
    ball.vx =
      ball.x < brick.x + brick.width / 2
        ? -Math.abs(ball.vx)
        : Math.abs(ball.vx);
  } else {
    ball.vy =
      ball.y < brick.y + brick.height / 2
        ? -Math.abs(ball.vy)
        : Math.abs(ball.vy);
  }

  if (!brick.skill) {
    speedUp(state);
  }

  return brick;
}

function overlaps(ball: Ball, brick: Brick, radius: number): boolean {
  const nearestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
  const nearestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));

  return (ball.x - nearestX) ** 2 + (ball.y - nearestY) ** 2 < radius ** 2;
}

function speedUp(state: BreakoutState): void {
  const next = Math.min(
    BREAKOUT_RULES.maxBallSpeed,
    state.speed * (1 + BREAKOUT_RULES.emptyBrickSpeedUp),
  );
  const ratio = next / state.speed;

  state.speed = next;
  state.ball.vx *= ratio;
  state.ball.vy *= ratio;
}
