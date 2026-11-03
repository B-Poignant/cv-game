import { describe, expect, it, vi } from "vitest";

import { MoveThrottle } from "../../../src/network/MoveThrottle";

const INTERVAL = 50;

function createThrottle() {
  const send = vi.fn<(position: { column: number; row: number }) => void>();
  const throttle = new MoveThrottle(send, INTERVAL);

  return { send, throttle };
}

const at = (column: number) => ({ column, row: 0 });

describe("MoveThrottle", () => {
  it("sends the first move straight away", () => {
    const { send, throttle } = createThrottle();

    throttle.push(at(1), 0);

    expect(send).toHaveBeenCalledExactlyOnceWith(at(1));
  });

  it("holds moves made within the interval, then sends only the latest", () => {
    const { send, throttle } = createThrottle();
    throttle.push(at(1), 0);

    throttle.push(at(2), 16);
    throttle.push(at(3), 33);
    throttle.flush(49);
    expect(send).toHaveBeenCalledOnce();

    throttle.flush(INTERVAL);
    expect(send).toHaveBeenLastCalledWith(at(3));
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("sends the last position once the player stops, so the server isn't left behind", () => {
    const { send, throttle } = createThrottle();
    throttle.push(at(1), 0);
    throttle.push(at(2), 10);

    throttle.flush(100);

    expect(send).toHaveBeenLastCalledWith(at(2));
  });

  it("sends nothing when there is no new move", () => {
    const { send, throttle } = createThrottle();
    throttle.push(at(1), 0);

    throttle.flush(100);
    throttle.flush(200);

    expect(send).toHaveBeenCalledOnce();
  });

  it("never sends more than one move per interval", () => {
    const { send, throttle } = createThrottle();

    // 240 frames a second for one second.
    for (let frame = 0; frame < 240; frame += 1) {
      const now = (frame * 1000) / 240;
      throttle.push(at(frame), now);
      throttle.flush(now);
    }

    expect(send.mock.calls.length).toBeLessThanOrEqual(1000 / INTERVAL);
  });
});
