// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DebugPanel } from "../../../src/ui/DebugPanel";

// F-051
describe("DebugPanel", () => {
  let parent: HTMLElement;

  beforeEach(() => {
    parent = document.createElement("div");
  });

  function parts(panel: DebugPanel) {
    const button = panel.element.querySelector("button");
    const readout = panel.element.querySelector("pre");
    if (!button || !readout) {
      throw new Error("DebugPanel is missing its button or readout");
    }
    return { button, readout };
  }

  it("adds a toggle button, off, and the hidden readout it controls", () => {
    const panel = new DebugPanel(parent);
    const { button, readout } = parts(panel);

    expect(parent.contains(panel.element)).toBe(true);
    expect(button.type).toBe("button");
    expect(button.textContent).toBe("🐞 Debug");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.getAttribute("aria-controls")).toBe(readout.id);
    expect(readout.hidden).toBe(true);
    expect(panel.isOpen).toBe(false);
  });

  it("opens and closes on click, tells its listeners, and gives focus back", () => {
    const panel = new DebugPanel(parent);
    const { button, readout } = parts(panel);
    const listener = vi.fn();
    panel.onToggle(listener);
    document.body.append(parent);
    button.focus();

    button.click();

    expect(panel.isOpen).toBe(true);
    expect(readout.hidden).toBe(false);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).not.toBe(button);

    button.click();

    expect(panel.isOpen).toBe(false);
    expect(listener.mock.calls).toEqual([[true], [false]]);
    parent.remove();
  });

  it("shows the lines as plain text, and only while open", () => {
    const panel = new DebugPanel(parent);
    const { readout } = parts(panel);

    panel.render(["closed"]);
    expect(readout.textContent).toBe("");

    panel.toggle();
    panel.render(["Player   (1.00, 2.00)", "<b>not html</b>"]);

    expect(readout.textContent).toBe("Player   (1.00, 2.00)\n<b>not html</b>");
    expect(readout.querySelector("b")).toBeNull();
  });

  it("removes itself and its listeners on destroy", () => {
    const panel = new DebugPanel(parent);
    const listener = vi.fn();
    panel.onToggle(listener);

    panel.destroy();
    panel.toggle();

    expect(parent.contains(panel.element)).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
