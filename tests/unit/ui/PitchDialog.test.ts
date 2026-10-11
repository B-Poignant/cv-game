// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";

import {
  LINE_OPTIONS,
  ROLE_OPTIONS,
  STACK_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../../../shared/pitch";
import { PitchDialog } from "../../../src/ui/PitchDialog";

function createDialog() {
  const dialog = new PitchDialog(document.body);
  const root = dialog.element;
  const form = root.querySelector<HTMLFormElement>("[role=dialog]")!;

  return {
    dialog,
    form,
    title: () =>
      document.getElementById(form.getAttribute("aria-labelledby")!)
        ?.textContent,
    groups: () =>
      [...root.querySelectorAll("fieldset")].map((fieldset) => ({
        legend: fieldset.querySelector("legend")?.textContent,
        options: [...fieldset.querySelectorAll("label")].map(
          (label) => label.textContent,
        ),
      })),
    pick: (name: string, value: string) => {
      root.querySelector<HTMLInputElement>(
        `input[name="${name}"][value="${value}"]`,
      )!.checked = true;
    },
    submit: root.querySelector<HTMLButtonElement>("button[type=submit]")!,
    error: root.querySelector<HTMLParagraphElement>("[role=alert]")!,
    replies: () =>
      [...root.querySelectorAll(".pitch-dialog__replies li")].map(
        (item) => item.textContent,
      ),
    close: root.querySelector<HTMLButtonElement>("[aria-label=Close]")!,
    escape: () =>
      root.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
  };
}

function pickGoodOffer(pick: (name: string, value: string) => void) {
  pick("stack", "php");
  pick("workMode", "remote");
  pick("role", "tech-lead");
  pick("line", "read-cv");
}

// F-042
describe("PitchDialog", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("is a labelled modal dialog, hidden until the dev is caught", () => {
    const { dialog, form, title } = createDialog();

    expect(dialog.isOpen).toBe(false);
    void dialog.choose();

    expect(dialog.isOpen).toBe(true);
    expect(form.getAttribute("aria-modal")).toBe("true");
    expect(title()).toBe("Make Ben an offer");
  });

  it("offers every option of each part of the offer", () => {
    const { groups } = createDialog();

    expect(groups()).toEqual([
      { legend: "Stack", options: STACK_OPTIONS.map((o) => o.label) },
      { legend: "Work mode", options: WORK_MODE_OPTIONS.map((o) => o.label) },
      { legend: "Role", options: ROLE_OPTIONS.map((o) => o.label) },
      { legend: "Opening line", options: LINE_OPTIONS.map((o) => o.label) },
    ]);
  });

  it("resolves with the offer, then waits for the dev's answer", async () => {
    const { dialog, pick, submit } = createDialog();
    const offer = dialog.choose();

    pickGoodOffer(pick);
    submit.click();

    await expect(offer).resolves.toEqual({
      stack: "php",
      workMode: "remote",
      role: "tech-lead",
      line: "read-cv",
    });
    expect(dialog.isOpen).toBe(true);
    expect(submit.disabled).toBe(true);
    expect(submit.textContent).toBe("Ben is thinking…");
  });

  it("asks for every part before pitching", () => {
    const { dialog, pick, submit, error } = createDialog();
    let pitched = false;
    void dialog.choose().then(() => {
      pitched = true;
    });

    pick("stack", "php");
    submit.click();

    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe(
      "Pick one option in each part of the offer.",
    );
    expect(pitched).toBe(false);
  });

  it.each(["✕", "Escape"])(
    "resolves with nothing and closes with %s",
    async (how) => {
      const { dialog, close, escape } = createDialog();
      const offer = dialog.choose();

      if (how === "Escape") {
        escape();
      } else {
        close.click();
      }

      await expect(offer).resolves.toBeUndefined();
      expect(dialog.isOpen).toBe(false);
    },
  );

  it("starts from a blank offer each time", async () => {
    const { dialog, pick, form, close } = createDialog();
    const first = dialog.choose();
    pick("stack", "php");
    close.click();
    await first;

    void dialog.choose();

    expect(form.querySelectorAll("input:checked")).toHaveLength(0);
  });

  it("shows a good pitch's answer as plain text, and closes when done", async () => {
    const { dialog, pick, submit, title, replies } = createDialog();
    const offer = dialog.choose();
    pickGoodOffer(pick);
    submit.click();
    await offer;

    const closed = dialog.showResult({
      hired: true,
      lines: ["Hybrid… fine.", "<b>You got me.</b>"],
    });

    expect(title()).toBe("You got me!");
    expect(replies()).toEqual([
      "Ben: “Hybrid… fine.”",
      "Ben: “<b>You got me.</b>”",
    ]);
    expect(dialog.element.querySelector("b")).toBeNull();

    dialog.element
      .querySelector<HTMLButtonElement>(".pitch-dialog__result button")!
      .click();
    await closed;
    expect(dialog.isOpen).toBe(false);
  });

  // F-043
  it("shows extra content under the answer, only for that result", () => {
    const { dialog } = createDialog();
    const reward = document.createElement("section");
    reward.textContent = "Contact details";

    void dialog.showResult({ hired: true, lines: ["Hi"] }, reward);
    expect(dialog.element.contains(reward)).toBe(true);

    void dialog.showResult({ hired: false, lines: ["No"] });
    expect(dialog.element.contains(reward)).toBe(false);
  });

  it("titles a refused pitch", () => {
    const { dialog, title } = createDialog();

    void dialog.showResult({ hired: false, lines: ["COBOL?"] });

    expect(title()).toBe("Not this time");
  });

  it("leaves the page when destroyed", () => {
    const { dialog } = createDialog();

    dialog.destroy();

    expect(document.body.contains(dialog.element)).toBe(false);
  });
});
