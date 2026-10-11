import { describe, expect, it, vi } from "vitest";

import type { CvRoom } from "../../../server/rooms/CvRoom";
import type { PitchEvent, PitchOffer } from "../../../shared/pitch";
import { DEV_SPAWN } from "../../../shared/world";
import { PitchChannel } from "../../../src/network/PitchChannel";
import { useColyseusServer } from "../../helpers/colyseus";

const GOOD_OFFER: PitchOffer = {
  stack: "typescript",
  workMode: "hybrid",
  role: "engineering-manager",
  line: "read-cv",
};

// F-042: the server catches and scores, the client passes messages on.
describe("PitchChannel", () => {
  const colyseus = useColyseusServer();

  /** A recruiter with 3 cards, touching a still Ben. */
  async function caught() {
    vi.stubEnv("DEV_WANDERS", "false");
    const room = await colyseus()
      .createRoom<CvRoom>("cv", {})
      .finally(() => vi.unstubAllEnvs());
    const me = await colyseus().connectTo(room);
    const onEvent = vi.fn<(event: PitchEvent) => void>();
    const channel = new PitchChannel(me, onEvent);
    const player = room.state.players.get(me.sessionId)!;
    player.intel.push("stack", "lead", "work-mode");
    player.column = DEV_SPAWN.column;
    player.row = DEV_SPAWN.row - 0.7;

    me.send("move", { column: DEV_SPAWN.column, row: DEV_SPAWN.row - 0.65 });
    await vi.waitFor(() =>
      expect(onEvent).toHaveBeenCalledWith({ type: "open" }),
    );

    return { me, onEvent, channel };
  }

  it("reports the dialog opening, then the dev's answer to an offer", async () => {
    const { onEvent, channel } = await caught();

    channel.pitch(GOOD_OFFER);

    await vi.waitFor(() =>
      expect(onEvent).toHaveBeenLastCalledWith({
        type: "result",
        hired: true,
        lines: ["Hybrid… fine, if the coffee is good.", expect.any(String)],
      }),
    );
  });

  it("cancels the pitch: the server then ignores an offer", async () => {
    const { onEvent, channel } = await caught();

    channel.cancel();
    channel.pitch(GOOD_OFFER);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onEvent).toHaveBeenCalledOnce();
  });

  it("stops reporting once destroyed", async () => {
    const { onEvent, channel } = await caught();

    channel.destroy();
    channel.pitch(GOOD_OFFER);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onEvent).toHaveBeenCalledOnce();
  });
});
