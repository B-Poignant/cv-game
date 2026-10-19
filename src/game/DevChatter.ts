import type { GridPosition } from "../../shared/grid";
import { DEV_FLEE_RADIUS } from "../../shared/world";
import type { DevBubbleLines } from "../config/devLines";

/** Tuning values. Exported so tests can reason about them. */
export const CHATTER_RULES = {
  /** He taunts the visitor once they come this close, in tiles: when he starts running (F-061). */
  closeDistance: DEV_FLEE_RADIUS,
  /** He mutters to himself after this long with the visitor far away. */
  idleSeconds: 20,
  /** At least this long between two bubbles, so he never spams the chat log. */
  cooldownSeconds: 8,
} as const;

/**
 * Decides when Ben speaks to this visitor, and what he says (F-062). Pixi-free: `MainScene`
 * feeds it positions each frame and shows the line it returns. Each visitor gets lines
 * about their own situation; nothing goes through the server, since a bubble changes nothing
 * in the game.
 */
export class DevChatter {
  private readonly lines: DevBubbleLines;
  private readonly random: () => number;

  private cooldown = 0;
  private idleFor = 0;
  private wasClose = false;
  private lastLine?: string;

  constructor(lines: DevBubbleLines, random: () => number = Math.random) {
    this.lines = lines;
    this.random = random;
  }

  /**
   * Advances `deltaSeconds` and returns a line when Ben has something to say: as the visitor
   * comes close (once per approach), or after a long quiet spell.
   */
  public update(
    deltaSeconds: number,
    dev: GridPosition,
    visitor: GridPosition,
  ): string | undefined {
    this.cooldown = Math.max(0, this.cooldown - deltaSeconds);

    const isClose =
      Math.hypot(dev.column - visitor.column, dev.row - visitor.row) <=
      CHATTER_RULES.closeDistance;
    const justArrived = isClose && !this.wasClose;

    this.wasClose = isClose;

    if (isClose) {
      this.idleFor = 0;
      return justArrived ? this.say("close") : undefined;
    }

    this.idleFor += deltaSeconds;

    if (this.idleFor < CHATTER_RULES.idleSeconds) {
      return undefined;
    }

    this.idleFor = 0;
    return this.say("idle");
  }

  private say(situation: keyof DevBubbleLines): string | undefined {
    if (this.cooldown > 0) {
      return undefined;
    }

    const line = this.pick(this.lines[situation]);

    if (line !== undefined) {
      this.cooldown = CHATTER_RULES.cooldownSeconds;
      this.lastLine = line;
    }

    return line;
  }

  /** A random line, but never the same one twice in a row. */
  private pick(lines: readonly string[]): string | undefined {
    const candidates =
      lines.length > 1 ? lines.filter((line) => line !== this.lastLine) : lines;

    return candidates[Math.floor(this.random() * candidates.length)];
  }
}
