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
  CATCHER_RULES,
  catcherOutcome,
  createCatcherState,
  stepCatcher,
  type CatcherState,
  type WordPools,
} from "./catcherRules";
import { WORDS_TO_CATCH, WORDS_TO_DODGE } from "./items";

/** Same layouts as the map (`Player`): arrows, AZERTY (q/d) and QWERTY (a/d). Lower-cased. */
const KEY_DIRECTIONS: Readonly<Partial<Record<string, -1 | 1>>> = {
  arrowleft: -1,
  q: -1,
  a: -1,
  arrowright: 1,
  d: 1,
};

const HUD_HEIGHT = 48;
const BASKET_HEIGHT = 14;
const FONT = { fontFamily: "sans-serif", fontSize: 16 } as const;

/**
 * Skills Park's minigame (F-071): words fall, the basket catches the dev's stack and should
 * dodge the rest. The rules are in `catcherRules.ts`; this class draws them and reads the
 * keyboard and the pointer.
 */
export class BuzzwordCatcher implements Minigame {
  public readonly view = new Container();

  private readonly state: CatcherState = createCatcherState();
  private readonly finish: (result: MinigameResult) => void;
  private readonly pools: WordPools;
  private readonly random: () => number;
  private readonly hud: Text;
  private readonly basket = new Graphics();
  private readonly wordLayer = new Container();
  private readonly wordViews = new Map<number, Text>();
  private readonly keys = { left: false, right: false };

  private width: number;
  private height: number;
  private theme: Theme;
  private targetX?: number;
  private finished = false;

  constructor(
    context: MinigameContext,
    finish: (result: MinigameResult) => void,
    pools: WordPools = { catchable: WORDS_TO_CATCH, toDodge: WORDS_TO_DODGE },
    random: () => number = Math.random,
  ) {
    this.finish = finish;
    this.pools = pools;
    this.random = random;
    this.width = context.width;
    this.height = context.height;
    this.theme = context.theme;
    this.hud = new Text({ text: "", style: { ...FONT } });

    this.view.label = "buzzword-catcher";
    this.view.eventMode = "static";
    this.view.on("pointermove", this.handlePointerMove);
    this.view.addChild(this.hud, this.wordLayer, this.basket);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.resize(context.width, context.height);
  }

  public get score(): number {
    return this.state.score;
  }

  public get basketX(): number {
    return this.state.basketX;
  }

  public update(deltaSeconds: number): void {
    if (this.finished) {
      return;
    }

    const direction = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);

    stepCatcher(
      this.state,
      deltaSeconds,
      { direction: direction as -1 | 0 | 1, targetX: this.targetX },
      this.pools,
      this.random,
    );
    this.draw();

    const outcome = catcherOutcome(this.state);

    if (outcome !== "playing") {
      this.finished = true;
      this.finish({ won: outcome === "won" });
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.view.hitArea = new Rectangle(0, 0, width, height);
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
    this.wordViews.clear();
  }

  private draw(): void {
    const seconds = Math.ceil(this.state.timeLeft);

    this.hud.style.fill = this.theme.label;
    this.hud.text =
      `Score ${String(this.state.score)}/${String(CATCHER_RULES.targetScore)}  ·  ${String(seconds)} s\n` +
      "Catch the dev's stack, dodge the rest. ←/→ or the mouse.";

    this.drawBasket();
    this.drawWords();
  }

  private drawBasket(): void {
    const width = CATCHER_RULES.basketWidth * this.width;
    const left = this.state.basketX * this.width - width / 2;

    this.basket
      .clear()
      .roundRect(left, this.toY(CATCHER_RULES.basketY), width, BASKET_HEIGHT, 6)
      .fill(this.theme.label);
  }

  private drawWords(): void {
    const alive = new Set(this.state.words.map((word) => word.id));

    for (const [id, text] of this.wordViews) {
      if (!alive.has(id)) {
        text.destroy();
        this.wordViews.delete(id);
      }
    }

    for (const word of this.state.words) {
      const text =
        this.wordViews.get(word.id) ?? this.addWordView(word.id, word.word);

      // Every word looks the same: telling the stack from the buzzwords is the game.
      text.style.fill = this.theme.label;
      text.position.set(word.x * this.width, this.toY(word.y));
    }
  }

  private addWordView(id: number, word: string): Text {
    const text = new Text({
      text: word,
      style: { ...FONT, fontWeight: "bold" },
    });

    text.anchor.set(0.5, 1);
    this.wordLayer.addChild(text);
    this.wordViews.set(id, text);

    return text;
  }

  /** Words fall between the HUD and the bottom of the play area. */
  private toY(fraction: number): number {
    return HUD_HEIGHT + fraction * (this.height - HUD_HEIGHT - BASKET_HEIGHT);
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
    if (this.width <= 0) {
      return;
    }

    this.targetX = event.getLocalPosition(this.view).x / this.width;
  };
}

export const BUZZWORD_CATCHER: MinigameDefinition = {
  title: "SKILLS PARK: BUZZWORD CATCHER",
  create: (context, finish) => new BuzzwordCatcher(context, finish),
};
