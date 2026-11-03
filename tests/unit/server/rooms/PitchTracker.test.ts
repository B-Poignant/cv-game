import { describe, expect, it } from "vitest";

import { PitchTracker } from "../../../../server/rooms/PitchTracker";

function createTracker() {
  return new PitchTracker({
    windowMs: 60_000,
    cooldownMs: 30_000,
    noticeMs: 3000,
  });
}

// F-042
describe("PitchTracker", () => {
  it("opens the pitch for a recruiter with enough intel", () => {
    expect(createTracker().touch("alice", true, 0)).toEqual({ kind: "open" });
  });

  it("refuses a recruiter without enough intel", () => {
    expect(createTracker().touch("alice", false, 0)).toEqual({
      kind: "no-intel",
    });
  });

  it("doesn't repeat a refusal for a few seconds", () => {
    const tracker = createTracker();
    tracker.touch("alice", false, 0);

    expect(tracker.touch("alice", false, 2999)).toEqual({ kind: "none" });
    expect(tracker.touch("alice", false, 3000)).toEqual({ kind: "no-intel" });
  });

  it("doesn't reopen a dialog that's already open", () => {
    const tracker = createTracker();
    tracker.touch("alice", true, 0);

    expect(tracker.touch("alice", true, 1000)).toEqual({ kind: "none" });
  });

  it("takes one offer while the dialog is open", () => {
    const tracker = createTracker();
    tracker.touch("alice", true, 0);

    expect(tracker.submit("alice", 59_999)).toBe("accepted");
    expect(tracker.submit("alice", 59_999)).toBe("none");
  });

  it("refuses an offer without a catch, and calls one after the time is up late", () => {
    const tracker = createTracker();
    expect(tracker.submit("alice", 0)).toBe("none");

    tracker.touch("alice", true, 0);
    expect(tracker.submit("alice", 60_000)).toBe("late");
    expect(tracker.submit("alice", 60_001)).toBe("none");
  });

  it("opens again once a timed-out dialog has expired", () => {
    const tracker = createTracker();
    tracker.touch("alice", true, 0);

    expect(tracker.touch("alice", true, 60_000)).toEqual({ kind: "open" });
  });

  it("makes a recruiter wait after a bad pitch, saying how long", () => {
    const tracker = createTracker();
    tracker.touch("alice", true, 0);
    tracker.submit("alice", 1000);
    tracker.fail("alice", 1000);

    expect(tracker.touch("alice", true, 2000)).toEqual({
      kind: "cooldown",
      secondsLeft: 29,
    });
    expect(tracker.touch("alice", true, 31_000)).toEqual({ kind: "open" });
  });

  it("waits a moment before reopening a dialog the recruiter closed", () => {
    const tracker = createTracker();
    tracker.touch("alice", true, 0);
    tracker.cancel("alice", 1000);

    expect(tracker.submit("alice", 1000)).toBe("none");
    expect(tracker.touch("alice", true, 3999)).toEqual({ kind: "none" });
    expect(tracker.touch("alice", true, 4000)).toEqual({ kind: "open" });
  });

  it("keeps recruiters apart, and forgets one who leaves", () => {
    const tracker = createTracker();
    tracker.touch("alice", true, 0);
    tracker.submit("alice", 0);
    tracker.fail("alice", 0);

    expect(tracker.touch("bob", true, 0)).toEqual({ kind: "open" });

    tracker.remove("alice");
    expect(tracker.touch("alice", true, 0)).toEqual({ kind: "open" });
  });
});
