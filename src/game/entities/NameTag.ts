import { Container, Text } from "pixi.js";

import { DEFAULT_THEME, type Theme } from "../../config/themes";
import type { RecruiterIdentity } from "../../../shared/recruiters";

/**
 * A recruiter's name with their company underneath (F-012), drawn above a character in the
 * theme's label colour so it stays readable on the tiles.
 */
export class NameTag extends Container {
  private readonly nameText: Text;
  private readonly companyText: Text;

  constructor(identity: RecruiterIdentity) {
    super();

    this.nameText = createLine(identity.name, 10, "bold", -10);
    this.companyText = createLine(identity.company, 9, "normal", 0);

    this.addChild(this.nameText, this.companyText);
  }

  public get identity(): RecruiterIdentity {
    return { name: this.nameText.text, company: this.companyText.text };
  }

  public applyTheme(theme: Theme): void {
    this.nameText.style.fill = theme.label;
    this.companyText.style.fill = theme.label;
  }
}

function createLine(
  text: string,
  fontSize: number,
  fontWeight: "bold" | "normal",
  y: number,
): Text {
  const line = new Text({
    text,
    style: {
      fontFamily: "monospace",
      fontSize,
      fontWeight,
      fill: DEFAULT_THEME.label,
    },
  });

  line.anchor.set(0.5);
  line.y = y;

  return line;
}
