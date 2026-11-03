import { Container, Graphics, Text, type Renderer } from "pixi.js";

import { DEFAULT_THEME, type Theme } from "../config/themes";
import type {
  Minigame,
  MinigameDefinition,
  MinigameResult,
} from "../game/minigames/Minigame";

/** Room left around the board for the HTML UI (theme button, intel, chat log), in pixels. */
const SCREEN_MARGIN = { top: 64, side: 16, bottom: 16 };
const MAX_BOARD = { width: 720, height: 540 };
const BOARD_PADDING = 16;
const HEADER_HEIGHT = 40;

interface RunningMinigame {
  game: Minigame;
  resolve: (result: MinigameResult) => void;
}

/**
 * Runs one minigame at a time (F-070) on a board centred on the screen, with its title on
 * top. The board uses the theme's tile colours and the title its `label` colour, which
 * already keeps a 4.5:1 contrast with them. Escape quits (a loss).
 */
export class MinigameScene extends Container {
  private readonly renderer: Renderer;
  private readonly board = new Graphics();
  private readonly header: Text;
  private readonly playArea = new Container();

  private theme: Theme = DEFAULT_THEME;
  private running?: RunningMinigame;

  constructor(renderer: Renderer) {
    super();

    this.renderer = renderer;
    this.header = new Text({
      text: "",
      style: { fontFamily: "sans-serif", fontSize: 18, fontWeight: "bold" },
    });
    this.header.anchor.set(0.5, 0.5);

    this.addChild(this.board, this.header, this.playArea);
    this.visible = false;
  }

  public get isRunning(): boolean {
    return this.running !== undefined;
  }

  /** Starts `definition` and resolves when it ends (won, lost or quit). */
  public play(definition: MinigameDefinition): Promise<MinigameResult> {
    if (this.running) {
      return Promise.reject(new Error("A minigame is already running"));
    }

    return new Promise((resolve) => {
      this.header.text = `${definition.title}  ·  Esc to quit`;
      this.visible = true;
      const area = this.layout();
      const game = definition.create(
        { width: area.width, height: area.height, theme: this.theme },
        (result) => {
          this.finish(game, result);
        },
      );

      this.running = { game, resolve };
      this.playArea.addChild(game.view);
      window.addEventListener("keydown", this.handleKeyDown);
      // The renderer's event, not the window's: Pixi resizes the renderer a frame later.
      this.renderer.on("resize", this.handleResize);
    });
  }

  /** Ends the current minigame as a loss. */
  public quit(): void {
    if (this.running) {
      this.finish(this.running.game, { won: false });
    }
  }

  public update(deltaSeconds: number): void {
    this.running?.game.update(deltaSeconds);
  }

  public applyTheme(theme: Theme): void {
    this.theme = theme;
    this.header.style.fill = theme.label;
    this.layout();
    this.running?.game.applyTheme?.(theme);
  }

  public destroy(options?: boolean): void {
    this.removeListeners();
    this.running?.game.destroy();
    this.running = undefined;

    super.destroy(options);
  }

  private finish(game: Minigame, result: MinigameResult): void {
    // A minigame may report its end more than once (e.g. time out, then Escape): only the first counts.
    if (this.running?.game !== game) {
      return;
    }

    const { resolve } = this.running;

    this.running = undefined;
    this.removeListeners();
    this.playArea.removeChild(game.view);
    game.destroy();
    this.visible = false;

    resolve(result);
  }

  /** Draws the board for the current screen size and returns the play area's size. */
  private layout(): { width: number; height: number } {
    const boardWidth = Math.min(
      MAX_BOARD.width,
      this.renderer.width - 2 * SCREEN_MARGIN.side,
    );
    const boardHeight = Math.min(
      MAX_BOARD.height,
      this.renderer.height - SCREEN_MARGIN.top - SCREEN_MARGIN.bottom,
    );
    const left = (this.renderer.width - boardWidth) / 2;
    const top =
      SCREEN_MARGIN.top +
      (this.renderer.height -
        SCREEN_MARGIN.top -
        SCREEN_MARGIN.bottom -
        boardHeight) /
        2;

    this.board
      .clear()
      .roundRect(left, top, boardWidth, boardHeight, 12)
      .fill(this.theme.tile.fill)
      .stroke({ width: 3, color: this.theme.tile.stroke });
    this.header.style.fill = this.theme.label;
    this.header.position.set(left + boardWidth / 2, top + HEADER_HEIGHT / 2);
    this.playArea.position.set(left + BOARD_PADDING, top + HEADER_HEIGHT);

    return {
      width: Math.max(0, boardWidth - 2 * BOARD_PADDING),
      height: Math.max(0, boardHeight - HEADER_HEIGHT - BOARD_PADDING),
    };
  }

  private removeListeners(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.renderer.off("resize", this.handleResize);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.quit();
    }
  };

  private handleResize = (): void => {
    const area = this.layout();

    this.running?.game.resize?.(area.width, area.height);
  };
}
