// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import type { IntelCardId } from "../../../shared/intel";
import { IntelInventory } from "../../../src/ui/IntelInventory";

const TEXTS: Record<IntelCardId, { title: string; text: string }> = {
  stack: { title: "Stack principale", text: "PHP" },
  lead: { title: "Séniorité", text: "4 ans de lead" },
  "work-mode": { title: "Critère éliminatoire", text: "<b>sur site</b>" },
};

function createInventory() {
  const announce = vi.fn<(text: string) => void>();
  const inventory = new IntelInventory((id) => TEXTS[id], announce);
  const root = inventory.element;

  return {
    inventory,
    title: () => root.querySelector("h2")?.textContent,
    cards: () =>
      [...root.querySelectorAll("li")].map((item) => item.textContent),
    empty: root.querySelector<HTMLParagraphElement>(".intel-inventory__empty")!,
    announce,
  };
}

// F-031
describe("IntelInventory", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("stays hidden until the room says which cards the visitor has", () => {
    const { inventory } = createInventory();

    expect(inventory.isShown).toBe(false);

    inventory.update([]);

    expect(inventory.isShown).toBe(true);
  });

  it("is labelled by its count out of the cards needed to pitch", () => {
    const { inventory, title } = createInventory();

    inventory.update(["stack"]);

    expect(title()).toBe("Intel 1/3");
    expect(
      document.getElementById(
        inventory.element.getAttribute("aria-labelledby")!,
      )?.textContent,
    ).toBe("Intel 1/3");
  });

  it("explains how to get cards while there are none", () => {
    const { inventory, empty } = createInventory();

    inventory.update([]);
    expect(empty.hidden).toBe(false);

    inventory.update(["lead"]);
    expect(empty.hidden).toBe(true);
  });

  it("lists each card's title and text, as plain text", () => {
    const { inventory, cards } = createInventory();

    inventory.update(["lead", "work-mode"]);

    expect(cards()).toEqual([
      "Séniorité4 ans de lead",
      "Critère éliminatoire<b>sur site</b>",
    ]);
    expect(inventory.element.querySelector("b")).toBeNull();
  });

  it("announces a new card, but not the ones held on arrival", () => {
    const { inventory, announce } = createInventory();

    inventory.update(["stack"]);
    expect(announce).not.toHaveBeenCalled();

    inventory.update(["stack", "lead"]);
    expect(announce).toHaveBeenCalledExactlyOnceWith("New intel: Séniorité");
  });

  it("leaves the page when destroyed", () => {
    const { inventory } = createInventory();

    inventory.destroy();

    expect(document.body.contains(inventory.element)).toBe(false);
  });
});
