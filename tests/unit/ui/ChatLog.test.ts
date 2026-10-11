// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";

import { CHAT_LOG_LIMIT, ChatLog } from "../../../src/ui/ChatLog";

// F-052
describe("ChatLog", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("stays hidden until the first message", () => {
    const log = new ChatLog();

    expect(log.element.hidden).toBe(true);

    log.post({ text: "New intel: Séniorité" });

    expect(log.element.hidden).toBe(false);
  });

  it("shows who said each line, oldest first", () => {
    const log = new ChatLog();

    log.post({ speaker: "Ben", text: "Do you even know what I do?" });
    log.post({ text: "New intel: Séniorité" });

    expect(log.messages).toEqual([
      "Ben: Do you even know what I do?",
      "New intel: Séniorité",
    ]);
    expect(log.element.querySelector("strong")?.textContent).toBe("Ben");
  });

  it("is a log that screen readers announce", () => {
    const log = new ChatLog();

    expect(log.element.getAttribute("aria-label")).toBe("Messages");
    expect(log.element.querySelector("[role=log]")).not.toBeNull();
  });

  it("keeps text as plain text", () => {
    const log = new ChatLog();

    log.post({ speaker: "<i>Ben</i>", text: "<b>hi</b>" });

    expect(log.messages).toEqual(["<i>Ben</i>: <b>hi</b>"]);
    expect(log.element.querySelector("b, i")).toBeNull();
  });

  it(`keeps only the last ${CHAT_LOG_LIMIT} messages`, () => {
    const log = new ChatLog();

    for (let index = 0; index <= CHAT_LOG_LIMIT; index++) {
      log.post({ text: `message ${index}` });
    }

    expect(log.messages).toHaveLength(CHAT_LOG_LIMIT);
    expect(log.messages[0]).toBe("message 1");
    expect(log.messages.at(-1)).toBe(`message ${CHAT_LOG_LIMIT}`);
  });

  it("leaves the page when destroyed", () => {
    const log = new ChatLog();

    log.destroy();

    expect(document.body.contains(log.element)).toBe(false);
  });
});
