// @vitest-environment happy-dom
import { Text } from "pixi.js";
import { describe, expect, it } from "vitest";

import { spamSubject } from "../../../../shared/spam";
import { DEFAULT_THEME, THEMES } from "../../../../src/config/themes";
import { SpamEmail } from "../../../../src/game/entities/SpamEmail";
import { IsometricConverter } from "../../../../src/game/IsometricConverter";

const converter = new IsometricConverter(64, 32);

function subjectOf(email: SpamEmail): Text {
  return email.children.find((child) => child instanceof Text) as Text;
}

// F-063
describe("SpamEmail", () => {
  it("shows the subject its id picks, in the default theme's label colour", () => {
    const email = new SpamEmail(3, converter);

    expect(email.subject).toBe(spamSubject(3));
    expect(subjectOf(email).style.fill).toBe(DEFAULT_THEME.label);
  });

  it.each(THEMES)("recolours its subject for the $name theme", (theme) => {
    const email = new SpamEmail(1, converter);

    email.applyTheme(theme);

    expect(subjectOf(email).style.fill).toBe(theme.label);
  });

  it("is drawn on the screen position of its tile", () => {
    const email = new SpamEmail(1, converter);

    email.setGridPosition({ column: 4, row: 9 });

    expect({ x: email.x, y: email.y }).toEqual(
      converter.toScreen({ column: 4, row: 9 }),
    );
  });
});
