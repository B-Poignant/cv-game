// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";

import { CONTACT } from "../../../src/content/contact";
import { renderReward } from "../../../src/ui/rewardSection";

const FULL = {
  linkedin: "https://www.linkedin.com/in/someone",
  email: "someone@example.com",
  cvPdf: "/cv.pdf",
};

function rows(section: HTMLElement) {
  return [...section.querySelectorAll("li")].map((row) => ({
    label: row.querySelector(".reward__label")?.textContent,
    text: row.querySelector("a")?.textContent,
    href: row.querySelector("a")?.getAttribute("href"),
  }));
}

// F-043
describe("renderReward", () => {
  it("lists the owner's LinkedIn", () => {
    const section = renderReward(CONTACT);

    expect(rows(section)).toEqual([
      {
        label: "LinkedIn",
        text: "linkedin.com/in/benjaminpoignant",
        href: "https://www.linkedin.com/in/benjaminpoignant",
      },
    ]);
  });

  it("shows only the details the owner shared", () => {
    const section = renderReward({});

    expect(rows(section)).toEqual([]);
    expect(section.querySelector(".reward__download")).toBeNull();
  });

  it("adds an email and the CV PDF when there are some", () => {
    const section = renderReward(FULL);

    expect(rows(section).map((row) => row.label)).toEqual([
      "LinkedIn",
      "Email",
    ]);
    expect(rows(section)[1].href).toBe("mailto:someone@example.com");
    const download =
      section.querySelector<HTMLAnchorElement>(".reward__download")!;
    expect(download.getAttribute("href")).toBe("/cv.pdf");
    expect(download.hasAttribute("download")).toBe(true);
  });

  it("opens LinkedIn in a new tab, without giving it access to the game", () => {
    const link = renderReward(FULL).querySelector("a")!;

    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
  });

  it("copies a detail to the clipboard and says so", async () => {
    const writeText = vi.fn(async () => {});
    const section = renderReward(FULL, { writeText });
    const [copyLinkedIn, copyEmail] = section.querySelectorAll("button");

    copyLinkedIn.click();
    copyEmail.click();

    expect(writeText.mock.calls).toEqual([
      ["https://www.linkedin.com/in/someone"],
      ["someone@example.com"],
    ]);
    await vi.waitFor(() => expect(copyLinkedIn.textContent).toBe("Copied!"));
    expect(copyLinkedIn.getAttribute("aria-label")).toBe("Copy LinkedIn");
  });

  it.each([
    {
      label: "the clipboard refuses",
      clipboard: { writeText: () => Promise.reject(new Error("denied")) },
    },
    { label: "there is no clipboard (not HTTPS)", clipboard: null },
  ])("says so when $label", async ({ clipboard }) => {
    const button = renderReward(FULL, clipboard).querySelector("button")!;

    button.click();

    await vi.waitFor(() => expect(button.textContent).toBe("Copy failed"));
  });
});
