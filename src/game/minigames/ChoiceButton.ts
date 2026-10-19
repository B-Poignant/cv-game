import { Container, Graphics, Text } from "pixi.js";

import { DEFAULT_THEME, type Theme } from "../../config/themes";

/** How a choice looks: still open, or marked after an answer. */
export type ChoiceMark = "open" | "right" | "wrong" | "done";

const MARK_PREFIX: Record<ChoiceMark, string> = {
  open: "",
  right: "✓ ",
  wrong: "✗ ",
  done: "",
};

const PADDING = 12;
const FONT_SIZE = 15;

/**
 * A clickable answer in a minigame (F-072, F-074): a framed label in the theme's `label`
 * colour. Pixi's accessibility layer (Tab) turns it into a real <button> named after the
 * label, so it also works with the keyboard and screen readers. Marks use a ✓ / ✗ prefix,
 * not colour alone.
 */
export class ChoiceButton extends Container {
  public readonly text: string;

  private readonly frame = new Graphics();
  private readonly labelText: Text;
  private readonly onSelect: () => void;

  private boxWidth = 0;
  private boxHeight = 0;
  private theme: Theme = DEFAULT_THEME;
  private currentMark: ChoiceMark = "open";

  constructor(text: string, onSelect: () => void) {
    super();

    this.text = text;
    this.onSelect = onSelect;
    this.labelText = new Text({
      text,
      style: {
        fontFamily: "sans-serif",
        fontSize: FONT_SIZE,
        fill: DEFAULT_THEME.label,
        wordWrap: true,
      },
    });
    this.labelText.anchor.set(0, 0.5);
    this.addChild(this.frame, this.labelText);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.accessible = true;
    this.accessibleType = "button";
    this.accessibleHint = text;
    // pointertap: a full click or tap, also fired by the accessibility layer (Enter).
    this.on("pointertap", this.handleTap);
  }

  public get mark(): ChoiceMark {
    return this.currentMark;
  }

  /** Marks the choice. Anything but "open" stops it from being picked again. */
  public setMark(mark: ChoiceMark): void {
    this.currentMark = mark;
    this.cursor = mark === "open" ? "pointer" : "default";
    this.draw();
  }

  /** Sizes the frame, in pixels. */
  public setSize(width: number, height: number): void {
    this.boxWidth = width;
    this.boxHeight = height;
    this.draw();
  }

  public applyTheme(theme: Theme): void {
    this.theme = theme;
    this.draw();
  }

  public override destroy(options?: Parameters<Container["destroy"]>[0]): void {
    this.off("pointertap", this.handleTap);
    super.destroy(options);
  }

  private handleTap = (): void => {
    if (this.currentMark === "open") {
      this.onSelect();
    }
  };

  private draw(): void {
    const isMarked = this.currentMark !== "open";

    this.frame
      .clear()
      .roundRect(0, 0, this.boxWidth, this.boxHeight, 8)
      .stroke({ color: this.theme.label, width: isMarked ? 3 : 1.5 });
    this.frame.alpha = this.currentMark === "done" ? 0.5 : 1;
    this.labelText.text = MARK_PREFIX[this.currentMark] + this.text;
    this.labelText.style.fill = this.theme.label;
    this.labelText.style.fontWeight = isMarked ? "bold" : "normal";
    this.labelText.style.wordWrapWidth = Math.max(
      0,
      this.boxWidth - 2 * PADDING,
    );
    this.labelText.position.set(PADDING, this.boxHeight / 2);
  }
}
