import type { Graphics } from "pixi.js";

/**
 * Colours a Graphics object was last drawn with, read from its drawing instructions.
 * Keeps tests independent of Pixi internals: adjust only here if Pixi changes them.
 */
export function drawnColours(graphics: Graphics): {
  fill?: number;
  stroke?: number;
} {
  const colourOf = (action: "fill" | "stroke") => {
    const instruction = graphics.context.instructions.find(
      (candidate) => candidate.action === action,
    );
    const style = (
      instruction?.data as { style?: { color?: number } } | undefined
    )?.style;

    return style?.color;
  };

  return { fill: colourOf("fill"), stroke: colourOf("stroke") };
}
