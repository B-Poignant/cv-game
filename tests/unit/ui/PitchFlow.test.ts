// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "../../../src/ui/ChatLog";
import { PitchDialog } from "../../../src/ui/PitchDialog";
import { PitchFlow, type PitchHost } from "../../../src/ui/PitchFlow";

const CONTACT = { linkedin: "https://www.linkedin.com/in/someone" };

function createFlow() {
  const host = {
    setPaused: vi.fn<PitchHost["setPaused"]>(),
    pitch: vi.fn<PitchHost["pitch"]>(),
    cancelPitch: vi.fn<PitchHost["cancelPitch"]>(),
  };
  const dialog = new PitchDialog(document.body);
  const say = vi.fn<(message: ChatMessage) => void>();
  const flow = new PitchFlow(host, dialog, say, CONTACT);
  const pick = (name: string, value: string) => {
    dialog.element.querySelector<HTMLInputElement>(
      `input[name="${name}"][value="${value}"]`,
    )!.checked = true;
  };
  const button = (selector: string) =>
    dialog.element.querySelector<HTMLButtonElement>(selector)!;

  return { host, dialog, say, flow, pick, button };
}

// F-042, F-043
describe("PitchFlow", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("pauses the game and opens the dialog when Ben is caught", () => {
    const { host, dialog, flow } = createFlow();

    flow.handle({ type: "open" });

    expect(host.setPaused).toHaveBeenCalledExactlyOnceWith(true);
    expect(dialog.isOpen).toBe(true);
  });

  it("sends the offer, and keeps the game paused for the answer", async () => {
    const { host, flow, pick, button } = createFlow();
    flow.handle({ type: "open" });

    pick("stack", "php");
    pick("workMode", "remote");
    pick("role", "tech-lead");
    pick("line", "read-cv");
    button("button[type=submit]").click();

    await vi.waitFor(() =>
      expect(host.pitch).toHaveBeenCalledExactlyOnceWith({
        stack: "php",
        workMode: "remote",
        role: "tech-lead",
        line: "read-cv",
      }),
    );
    expect(host.setPaused).toHaveBeenLastCalledWith(true);
  });

  it("cancels and resumes the game when the dialog is closed", async () => {
    const { host, flow, button } = createFlow();
    flow.handle({ type: "open" });

    button("[aria-label=Close]").click();

    await vi.waitFor(() => expect(host.cancelPitch).toHaveBeenCalledOnce());
    expect(host.setPaused).toHaveBeenLastCalledWith(false);
    expect(host.pitch).not.toHaveBeenCalled();
  });

  it("posts a refusal as Ben's line", () => {
    const { say, flow, dialog } = createFlow();

    flow.handle({ type: "refused", line: "Do you even know what I do?" });

    expect(say).toHaveBeenCalledExactlyOnceWith({
      speaker: "Ben",
      text: "Do you even know what I do?",
    });
    expect(dialog.isOpen).toBe(false);
  });

  it("posts each of Ben's answers to a pitch", () => {
    const { say, flow } = createFlow();

    flow.handle({ type: "result", hired: true, lines: ["Hybrid…", "OK."] });

    expect(say.mock.calls).toEqual([
      [{ speaker: "Ben", text: "Hybrid…" }],
      [{ speaker: "Ben", text: "OK." }],
    ]);
  });

  it("shows the contact details after a good pitch, then resumes", async () => {
    const { host, dialog, flow, button } = createFlow();

    flow.handle({ type: "result", hired: true, lines: ["You got me."] });

    expect(dialog.element.querySelector(".reward a")?.textContent).toBe(
      "linkedin.com/in/someone",
    );
    button(".pitch-dialog__result > button").click();
    await vi.waitFor(() =>
      expect(host.setPaused).toHaveBeenLastCalledWith(false),
    );
  });

  it("keeps the contact details for a good pitch only", () => {
    const { dialog, flow } = createFlow();

    flow.handle({ type: "result", hired: false, lines: ["COBOL?"] });

    expect(dialog.element.querySelector(".reward")).toBeNull();
  });
});
