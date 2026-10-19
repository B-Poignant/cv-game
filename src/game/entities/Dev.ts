import { Container, Graphics, Text } from "pixi.js";

import { DEFAULT_THEME, type Theme } from "../../config/themes";
import type { GridPosition } from "../../../shared/grid";
import type { IsometricConverter } from "../IsometricConverter";

const SKIN = 0xffcc99;
const HAIR = 0x4b2e1a;
const SHIRT = 0xf8fafc;
const SHIRT_OUTLINE = 0x94a3b8;
const JEANS = 0x1e3a8a;
const GLASSES = 0x111827;

// The bubble has its own background, so its colours don't follow the theme (F-062).
const BUBBLE_FILL = 0xffffff;
const BUBBLE_TEXT = 0x1f2937;
const BUBBLE_PADDING = 6;
const BUBBLE_FONT_SIZE = 10;
const BUBBLE_MAX_WIDTH = 160;
/** Average glyph width for the bubble's font, as a share of its size. */
const GLYPH_WIDTH = 0.55;
const LINE_HEIGHT = 1.25;
/** How long a bubble stays up, in seconds. */
export const BUBBLE_SECONDS = 3.5;

/**
 * The dev the recruiters chase (F-060): jeans, white shirt and glasses, with his name above.
 * The server moves him; this only draws him where the room state says.
 */
export class Dev extends Container {
  readonly devName: string;

  private readonly converter: IsometricConverter;
  private readonly nameLabel: Text;
  private readonly bubble = new Container();
  private readonly bubbleFrame = new Graphics();
  private readonly bubbleText: Text;

  private bubbleLeft = 0;

  constructor(devName: string, converter: IsometricConverter) {
    super();

    this.devName = devName;
    this.converter = converter;

    this.addChild(createBody());
    this.nameLabel = this.createNameLabel();
    this.bubbleText = this.createBubble();
  }

  /** What the bubble above him says, or undefined when there's none. */
  public get speech(): string | undefined {
    return this.bubble.visible ? this.bubbleText.text : undefined;
  }

  /** Shows `line` in a speech bubble above him for `BUBBLE_SECONDS` (F-062). */
  public say(line: string): void {
    this.bubbleText.text = line;
    this.bubbleLeft = BUBBLE_SECONDS;
    this.bubble.visible = true;

    // Estimated rather than measured: measuring text needs a canvas (not there in tests).
    const textWidth = line.length * BUBBLE_FONT_SIZE * GLYPH_WIDTH;
    const width = Math.min(BUBBLE_MAX_WIDTH, textWidth);
    // Wrapping breaks between words, so lines run a little short of the full width.
    const lines = Math.ceil(textWidth / (BUBBLE_MAX_WIDTH * 0.85));
    const height = lines * BUBBLE_FONT_SIZE * LINE_HEIGHT;

    this.bubbleFrame
      .clear()
      .roundRect(
        -width / 2 - BUBBLE_PADDING,
        -height - BUBBLE_PADDING,
        width + 2 * BUBBLE_PADDING,
        height + 2 * BUBBLE_PADDING,
        6,
      )
      .fill(BUBBLE_FILL)
      .stroke({ color: BUBBLE_TEXT, width: 1 });
  }

  /** Counts down the bubble, then hides it. */
  public update(deltaSeconds: number): void {
    if (!this.bubble.visible) {
      return;
    }

    this.bubbleLeft -= deltaSeconds;
    if (this.bubbleLeft <= 0) {
      this.bubble.visible = false;
    }
  }

  public setGridPosition(position: GridPosition): void {
    const screenPosition = this.converter.toScreen(position);

    this.position.set(screenPosition.x, screenPosition.y);
  }

  /** Recolours the name so it stays readable on the theme's tiles. */
  public applyTheme(theme: Theme): void {
    this.nameLabel.style.fill = theme.label;
  }

  private createNameLabel(): Text {
    const label = new Text({
      text: this.devName,
      style: {
        fontFamily: "monospace",
        fontSize: 10,
        fontWeight: "bold",
        fill: DEFAULT_THEME.label,
      },
    });

    label.anchor.set(0.5);
    label.position.set(0, -36);
    this.addChild(label);

    return label;
  }

  private createBubble(): Text {
    const text = new Text({
      text: "",
      style: {
        fontFamily: "sans-serif",
        fontSize: BUBBLE_FONT_SIZE,
        lineHeight: BUBBLE_FONT_SIZE * LINE_HEIGHT,
        fill: BUBBLE_TEXT,
        wordWrap: true,
        wordWrapWidth: BUBBLE_MAX_WIDTH,
        align: "center",
      },
    });

    text.anchor.set(0.5, 1);
    this.bubble.addChild(this.bubbleFrame, text);
    this.bubble.position.set(0, -46);
    this.bubble.visible = false;
    this.addChild(this.bubble);

    return text;
  }
}

/** Same proportions as the recruiters (feet at y = 10), so he reads as a person, not a prop. */
function createBody(): Graphics {
  const body = new Graphics();

  // Jeans: two legs.
  body.rect(-6, 2, 5, 8).fill(JEANS);
  body.rect(1, 2, 5, 8).fill(JEANS);

  // White shirt, outlined so it stays visible on light tiles.
  body
    .roundRect(-8, -10, 16, 14, 4)
    .fill(SHIRT)
    .stroke({ color: SHIRT_OUTLINE, width: 1 });

  // Hair, then the face over it, a little lower so the hair shows on top.
  body.circle(0, -19, 8).fill(HAIR);
  body.circle(0, -17, 7).fill(SKIN);

  // Glasses: two lenses and a bridge.
  body.circle(-3, -17, 2.5).stroke({ color: GLASSES, width: 1 });
  body.circle(3, -17, 2.5).stroke({ color: GLASSES, width: 1 });
  body.moveTo(-0.5, -17).lineTo(0.5, -17).stroke({ color: GLASSES, width: 1 });

  return body;
}
