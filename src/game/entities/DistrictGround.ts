import { Container, Graphics, Text } from "pixi.js";

import { DEFAULT_THEME, type Theme } from "../../config/themes";
import {
  districtCorners,
  type DistrictDefinition,
  districtLabelPosition,
} from "../../../shared/districts";
import type { IsometricConverter } from "../IsometricConverter";

/**
 * A district painted on the ground (F-005): its outline along the tile edges and its name,
 * written along the column axis, both in the theme's `label` colour.
 */
export class DistrictGround extends Container {
  public readonly district: DistrictDefinition;

  private readonly outline = new Graphics();
  private readonly nameText: Text;
  private readonly converter: IsometricConverter;

  constructor(district: DistrictDefinition, converter: IsometricConverter) {
    super();

    this.district = district;
    this.converter = converter;

    this.nameText = new Text({
      text: district.name.toUpperCase(),
      style: {
        fontFamily: "monospace",
        fontSize: 20,
        fontWeight: "bold",
        letterSpacing: 2,
        fill: DEFAULT_THEME.label,
      },
    });
    this.nameText.anchor.set(0.5);

    const position = converter.toScreen(districtLabelPosition(district));
    this.nameText.position.set(position.x, position.y);
    // Along the column axis, so the name lies flat on the isometric ground.
    this.nameText.rotation = Math.atan2(
      converter.tileHeight,
      converter.tileWidth,
    );

    this.addChild(this.outline, this.nameText);
    this.applyTheme(DEFAULT_THEME);
  }

  public get labelText(): string {
    return this.nameText.text;
  }

  public applyTheme(theme: Theme): void {
    const [first, ...rest] = districtCorners(this.district).map((corner) =>
      this.converter.toScreen(corner),
    );

    this.outline.clear().moveTo(first.x, first.y);

    for (const { x, y } of rest) {
      this.outline.lineTo(x, y);
    }

    this.outline
      .closePath()
      .stroke({ color: theme.label, width: 2, alpha: 0.4 });
    this.nameText.style.fill = theme.label;
  }
}
