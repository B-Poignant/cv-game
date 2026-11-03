import {
  Container,
  Graphics,
  Rectangle,
  Text,
  type FederatedPointerEvent,
} from "pixi.js";

import type { Theme } from "../../../config/themes";
import type {
  Minigame,
  MinigameContext,
  MinigameDefinition,
  MinigameResult,
} from "../Minigame";
import {
  BREAKOUT_RULES,
  breakoutOutcome,
  createBreakoutState,
  skillCount,
  skillsFound,
  stepBreakout,
  type BreakoutState,
} from "./breakoutRules";
import { SKILL_WORDS } from "./items";

/** Same layouts as the map (`Player`): arrows, AZERTY (q/d) and QWERTY (a/d). Lower-cased. */
const KEY_DIRECTIONS: Readonly<Partial<Record<string, -1 | 1>>> = {
  arrowleft: -1,
  q: -1,
  a: -1,
  arrowright: 1,
  d: 1,
};

const HUD_HEIGHT = 64;
const FONT = { fontFamily: "sans-serif", fontSize: 16 } as const;
/** Brick label size in field units, scaled with the field. */
const BRICK_FONT_SIZE = 11;
/** Room kept on each side of a brick label, in field units. */
const BRICK_PADDING = 3;
/** A bold sans-serif character is about this wide, as a share of the font size. */
const AVERAGE_CHAR_WIDTH = 0.62;

/**
 * Skills Park's minigame (F-071): a breakout. Only the bricks holding one of the dev's real
 * skills carry a word, and breaking all of them wins; empty bricks only speed the ball up. The rules
 * are in `breakoutRules.ts`; this class draws them and reads the keyboard and the pointer.
 */
export class SkillBreakout implements Minigame {
  public readonly view = new Container();

  private readonly state: BreakoutState;
  private readonly finish: (result: MinigameResult) => void;
  private readonly random: () => number;
  private readonly hud: Text;
  private readonly field = new Graphics();
  private readonly brickLabels = new Map<number, Text>();
  private readonly labelLayer = new Container();
  private readonly keys = { left: false, right: false };

  private theme: Theme;
  /** Field units to pixels, and where the field's top-left corner is drawn. */
  private scale = 1;
  private origin = { x: 0, y: HUD_HEIGHT };
  private targetX?: number;
  private finished = false;

  constructor(
    context: MinigameContext,
    finish: (result: MinigameResult) => void,
    skills: readonly string[] = SKILL_WORDS,
    random: () => number = Math.random,
  ) {
    this.finish = finish;
    this.random = random;
    this.theme = context.theme;
    this.state = createBreakoutState(skills, random);
    this.hud = new Text({ text: "", style: { ...FONT } });

    for (const brick of this.state.bricks.filter((b) => b.skill)) {
      const label = new Text({
        text: brick.word,
        style: { ...FONT, fontWeight: "bold" },
      });

      label.anchor.set(0.5);
      this.brickLabels.set(brick.id, label);
      this.labelLayer.addChild(label);
    }

    this.view.label = "skill-breakout";
    this.view.eventMode = "static";
    this.view.on("pointermove", this.handlePointerMove);
    this.view.addChild(this.hud, this.field, this.labelLayer);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.resize(context.width, context.height);
  }

  public get lives(): number {
    return this.state.lives;
  }

  public get found(): string[] {
    return skillsFound(this.state);
  }

  public get paddleX(): number {
    return this.state.paddleX;
  }

  public get ballX(): number {
    return this.state.ball.x;
  }

  public update(deltaSeconds: number): void {
    if (this.finished) {
      return;
    }

    const direction = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);

    stepBreakout(
      this.state,
      deltaSeconds,
      { direction: direction as -1 | 0 | 1, targetX: this.targetX },
      this.random,
    );
    this.draw();

    const outcome = breakoutOutcome(this.state);

    if (outcome !== "playing") {
      this.finished = true;
      this.finish({ won: outcome === "won" });
    }
  }

  public resize(width: number, height: number): void {
    const { field } = BREAKOUT_RULES;

    this.scale = Math.max(
      0,
      Math.min(width / field.width, (height - HUD_HEIGHT) / field.height),
    );
    this.origin = {
      x: (width - field.width * this.scale) / 2,
      y: HUD_HEIGHT,
    };
    this.view.hitArea = new Rectangle(0, 0, width, height);
    this.fitLabels();
    this.draw();
  }

  public applyTheme(theme: Theme): void {
    this.theme = theme;
    this.draw();
  }

  public destroy(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.view.off("pointermove", this.handlePointerMove);
    this.view.destroy({ children: true });
    this.brickLabels.clear();
  }

  private draw(): void {
    const found = skillsFound(this.state);

    this.hud.style.fill = this.theme.label;
    this.hud.text =
      `Skills ${String(found.length)}/${String(skillCount(this.state))}  ·  ` +
      `Balls ${String(this.state.lives)}\n` +
      "Break the bricks that hold the dev's real skills. ←/→ or the mouse.\n" +
      (found.length > 0 ? `Found: ${found.join(", ")}` : "");

    this.drawField();
    this.drawBricks();
  }

  private drawField(): void {
    const { field, paddle, ballRadius } = BREAKOUT_RULES;
    const colour = this.theme.label;
    const { ball } = this.state;

    this.field
      .clear()
      .rect(
        this.toX(0),
        this.toY(0),
        field.width * this.scale,
        field.height * this.scale,
      )
      .stroke({ width: 2, color: colour })
      .roundRect(
        this.toX(this.state.paddleX - paddle.width / 2),
        this.toY(paddle.y),
        paddle.width * this.scale,
        paddle.height * this.scale,
        4,
      )
      .fill(colour)
      .circle(this.toX(ball.x), this.toY(ball.y), ballRadius * this.scale)
      .fill(colour);

    // Bricks are outlines; only the skill ones carry a word.
    for (const brick of this.state.bricks) {
      if (!brick.broken) {
        this.field
          .roundRect(
            this.toX(brick.x),
            this.toY(brick.y),
            brick.width * this.scale,
            brick.height * this.scale,
            3,
          )
          .stroke({ width: 2, color: colour });
      }
    }
  }

  private drawBricks(): void {
    for (const brick of this.state.bricks) {
      const label = this.brickLabels.get(brick.id);

      if (!label) {
        continue;
      }

      label.visible = !brick.broken;
      label.style.fill = this.theme.label;
      label.position.set(
        this.toX(brick.x + brick.width / 2),
        this.toY(brick.y + brick.height / 2),
      );
    }
  }

  /**
   * Sizes the brick labels to the field's scale, with a smaller font for words too long for
   * their brick. The width is estimated from the length, so it works before the first render.
   */
  private fitLabels(): void {
    for (const brick of this.state.bricks) {
      const label = this.brickLabels.get(brick.id);

      if (!label) {
        continue;
      }

      const room = brick.width - 2 * BRICK_PADDING;
      const fitting =
        room / (AVERAGE_CHAR_WIDTH * Math.max(1, brick.word.length));

      label.style.fontSize = Math.max(
        1,
        Math.min(BRICK_FONT_SIZE, fitting) * this.scale,
      );
    }
  }

  private toX(x: number): number {
    return this.origin.x + x * this.scale;
  }

  private toY(y: number): number {
    return this.origin.y + y * this.scale;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.setKey(event.key, true);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.setKey(event.key, false);
  };

  private setKey(key: string, pressed: boolean): void {
    const direction = KEY_DIRECTIONS[key.toLowerCase()];

    if (direction === undefined) {
      return;
    }

    // The keyboard takes over from the pointer until the pointer moves again.
    this.targetX = undefined;
    if (direction < 0) {
      this.keys.left = pressed;
    } else {
      this.keys.right = pressed;
    }
  }

  private handlePointerMove = (event: FederatedPointerEvent): void => {
    if (this.scale <= 0) {
      return;
    }

    this.targetX =
      (event.getLocalPosition(this.view).x - this.origin.x) / this.scale;
  };
}

export const SKILL_BREAKOUT: MinigameDefinition = {
  title: "SKILLS PARK: SKILL BREAKOUT",
  create: (context, finish) => new SkillBreakout(context, finish),
};
