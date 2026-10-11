// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CV } from "../../../src/content/cv";
import { CvPanel } from "../../../src/ui/CvPanel";

describe("CvPanel", () => {
  let parent: HTMLElement;
  let panel: CvPanel;

  const dialog = () => parent.querySelector<HTMLElement>('[role="dialog"]')!;
  const title = () => dialog().querySelector("h1")?.textContent;
  const closeButton = () =>
    parent.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!;
  const pressKey = (key: string) =>
    document.dispatchEvent(new KeyboardEvent("keydown", { key }));

  beforeEach(() => {
    parent = document.createElement("div");
    document.body.appendChild(parent);
    panel = new CvPanel(CV, parent);
  });

  afterEach(() => {
    panel.destroy();
    parent.remove();
  });

  it("starts closed and hidden", () => {
    expect(panel.isOpen).toBe(false);
    expect(panel.element.hidden).toBe(true);
  });

  it("is an accessible modal dialog labelled by its title", () => {
    expect(dialog().getAttribute("aria-modal")).toBe("true");
    expect(dialog().getAttribute("aria-labelledby")).toBe(
      dialog().querySelector("h1")?.id,
    );
  });

  it.each([
    { section: "experience", expected: "Expérience" },
    { section: "skills", expected: "Compétences" },
  ] as const)("opens the $section section", ({ section, expected }) => {
    panel.open(section);

    expect(panel.isOpen).toBe(true);
    expect(panel.currentSection).toBe(section);
    expect(panel.element.hidden).toBe(false);
    expect(title()).toBe(expected);
  });

  it("moves keyboard focus into the dialog", () => {
    panel.open("experience");

    expect(document.activeElement).toBe(dialog());
  });

  it("replaces the content when another section opens", () => {
    panel.open("experience");

    panel.open("skills");

    expect(title()).toBe("Compétences");
    expect(dialog().textContent).not.toContain("BoondManager");
  });

  describe("closing", () => {
    beforeEach(() => panel.open("experience"));

    it("closes with the ✕ button", () => {
      closeButton().click();

      expect(panel.isOpen).toBe(false);
      expect(panel.element.hidden).toBe(true);
    });

    it("closes with Escape", () => {
      pressKey("Escape");

      expect(panel.isOpen).toBe(false);
    });

    it("ignores other keys", () => {
      pressKey("ArrowLeft");

      expect(panel.isOpen).toBe(true);
    });

    it("closes on a click on the backdrop", () => {
      panel.element.click();

      expect(panel.isOpen).toBe(false);
    });

    it("stays open on a click inside the dialog", () => {
      dialog().click();

      expect(panel.isOpen).toBe(true);
    });
  });

  describe("onOpenChange", () => {
    it("reports opening and closing once each", () => {
      const listener = vi.fn();
      panel.onOpenChange(listener);

      panel.open("experience");
      panel.open("skills");
      panel.close();
      panel.close();

      expect(listener.mock.calls).toEqual([[true], [false]]);
    });

    it("stops reporting after unsubscribing", () => {
      const listener = vi.fn();
      const unsubscribe = panel.onOpenChange(listener);

      unsubscribe();
      panel.open("experience");

      expect(listener).not.toHaveBeenCalled();
    });
  });

  it("removes itself and stops listening to Escape on destroy", () => {
    const listener = vi.fn();
    panel.onOpenChange(listener);
    panel.open("experience");
    listener.mockClear();

    panel.destroy();
    pressKey("Escape");

    expect(parent.contains(panel.element)).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
