import { describe, expect, it, vi } from "vitest";

import type { CvRoom } from "../../../server/rooms/CvRoom";
import type { IntelCardId } from "../../../shared/intel";
import { LocalIntel } from "../../../src/network/LocalIntel";
import { useColyseusServer } from "../../helpers/colyseus";

// F-031: the server gives cards, the client follows its own.
describe("LocalIntel", () => {
  const colyseus = useColyseusServer();

  async function joinAsMe() {
    const room = await colyseus().createRoom<CvRoom>("cv", {});
    const me = await colyseus().connectTo(room);
    const onChange = vi.fn<(cards: IntelCardId[]) => void>();
    const intel = new LocalIntel(me, onChange);
    const myPlayer = () => room.state.players.get(me.sessionId)!;

    return { room, me, onChange, intel, myPlayer };
  }

  it("reports no cards once in the room", async () => {
    const { onChange } = await joinAsMe();

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
  });

  it("reports every card held after the server gives one", async () => {
    const { me, onChange, myPlayer } = await joinAsMe();
    myPlayer().column = 21;
    myPlayer().row = 20;
    me.send("collect-intel", { source: "chest" });
    await vi.waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(["work-mode"]),
    );

    myPlayer().column = 15;
    myPlayer().row = 5;
    me.send("collect-intel", { source: "experience" });

    await vi.waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(["work-mode", "lead"]),
    );
  });

  it("ignores other visitors' cards", async () => {
    const { room, onChange } = await joinAsMe();
    const other = await colyseus().connectTo(room);
    const otherPlayer = room.state.players.get(other.sessionId)!;
    otherPlayer.column = 21;
    otherPlayer.row = 20;
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
    onChange.mockClear();

    other.send("collect-intel", { source: "chest" });
    await other.waitForNextPatch();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("stops reporting once destroyed", async () => {
    const { me, onChange, intel, myPlayer } = await joinAsMe();
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
    intel.destroy();
    onChange.mockClear();
    myPlayer().column = 21;
    myPlayer().row = 20;

    me.send("collect-intel", { source: "chest" });
    await me.waitForNextPatch();

    expect(onChange).not.toHaveBeenCalled();
  });
});
