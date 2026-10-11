import type { Room } from "@colyseus/sdk";
import { describe, expect, it, vi } from "vitest";

import type { CvRoomState } from "../../../server/rooms/CvRoomState";
import { PitchChannel } from "../../../src/network/PitchChannel";

/** A room that hands the "pitch" listener to the test. */
function fakeRoom() {
  let listener: ((payload: unknown) => void) | undefined;
  const room = {
    onMessage: (_type: string, callback: (payload: unknown) => void) => {
      listener = callback;
      return () => {
        listener = undefined;
      };
    },
    send: vi.fn(),
  };

  return {
    room: room as unknown as Room<CvRoomState>,
    send: room.send,
    receive: (payload: unknown) => listener?.(payload),
  };
}

// F-042. The real server round trip is in tests/integration/network/PitchChannel.test.ts.
describe("PitchChannel", () => {
  it.each([
    { type: "open" },
    { type: "refused", line: "Do you even know what I do?" },
    { type: "result", hired: false, lines: ["COBOL?"] },
  ])("passes on a $type event", (event) => {
    const { room, receive } = fakeRoom();
    const onEvent = vi.fn();
    new PitchChannel(room, onEvent);

    receive(event);

    expect(onEvent).toHaveBeenCalledExactlyOnceWith(event);
  });

  it.each([
    { label: "nothing", payload: undefined },
    { label: "no type", payload: { line: "Hi" } },
    { label: "an unknown type", payload: { type: "hired" } },
    { label: "a refusal without a line", payload: { type: "refused" } },
    {
      label: "a result without lines",
      payload: { type: "result", hired: true },
    },
    {
      label: "a result with a non-text line",
      payload: { type: "result", hired: true, lines: [42] },
    },
  ])("ignores $label", ({ payload }) => {
    const { room, receive } = fakeRoom();
    const onEvent = vi.fn();
    new PitchChannel(room, onEvent);

    receive(payload);

    expect(onEvent).not.toHaveBeenCalled();
  });

  it("sends offers and cancellations as room messages", () => {
    const { room, send } = fakeRoom();
    const channel = new PitchChannel(room, vi.fn());
    const offer = {
      stack: "php",
      workMode: "remote",
      role: "tech-lead",
      line: "read-cv",
    } as const;

    channel.pitch(offer);
    channel.cancel();

    expect(send.mock.calls).toEqual([["pitch", offer], ["pitch-cancel"]]);
  });
});
