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

/**
 * The dev the recruiters chase (F-060): jeans, white shirt and glasses, with his name above.
 * The server moves him; this only draws him where the room state says.
 */
export class Dev extends Container {
  readonly devName: string;

  private readonly converter: IsometricConverter;
  private readonly nameLabel: Text;

  constructor(devName: string, converter: IsometricConverter) {
    super();

    this.devName = devName;
    this.converter = converter;

    this.addChild(createBody());
    this.nameLabel = this.createNameLabel();
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
