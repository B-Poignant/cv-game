import { Container, Graphics, Text } from "pixi.js";

import type { GridPosition } from "../../../shared/grid";
import { spamSubject } from "../../../shared/spam";
import { DEFAULT_THEME, type Theme } from "../../config/themes";
import type { IsometricConverter } from "../IsometricConverter";

const ENVELOPE = 0xfef3c7;
const ENVELOPE_OUTLINE = 0xb45309;
/** Flies above the ground, like the building titles. */
const FLIGHT_HEIGHT = 24;

/**
 * A flying spam email (F-063): an envelope with its subject under it, in the theme's label
 * colour so it stays readable on the tiles. The server moves it; this only draws it.
 */
export class SpamEmail extends Container {
  public readonly emailId: number;

  private readonly converter: IsometricConverter;
  private readonly subjectText: Text;

  constructor(emailId: number, converter: IsometricConverter) {
    super();

    this.emailId = emailId;
    this.converter = converter;
    this.label = "spam-email";
    this.subjectText = new Text({
      text: spamSubject(emailId),
      style: {
        fontFamily: "monospace",
        fontSize: 9,
        fontWeight: "bold",
        fill: DEFAULT_THEME.label,
      },
    });
    this.subjectText.anchor.set(0.5, 0);
    this.subjectText.position.set(0, -FLIGHT_HEIGHT + 8);

    this.addChild(createEnvelope(), this.subjectText);
  }

  public get subject(): string {
    return this.subjectText.text;
  }

  public setGridPosition(position: GridPosition): void {
    const screenPosition = this.converter.toScreen(position);

    this.position.set(screenPosition.x, screenPosition.y);
  }

  public applyTheme(theme: Theme): void {
    this.subjectText.style.fill = theme.label;
  }
}

function createEnvelope(): Graphics {
  const envelope = new Graphics();
  const top = -FLIGHT_HEIGHT - 6;

  envelope
    .rect(-9, top, 18, 12)
    .fill(ENVELOPE)
    .stroke({ color: ENVELOPE_OUTLINE, width: 1 });
  envelope
    .moveTo(-9, top)
    .lineTo(0, top + 7)
    .lineTo(9, top)
    .stroke({ color: ENVELOPE_OUTLINE, width: 1 });

  return envelope;
}
