// @vitest-environment happy-dom
import { Container } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import type { CvRoom } from "../../../server/rooms/CvRoom";
import { spamSubject } from "../../../shared/spam";
import { PLAYER_SPAWN } from "../../../shared/world";
import { THEMES } from "../../../src/config/themes";
import { SpamEmail } from "../../../src/game/entities/SpamEmail";
import { IsometricConverter } from "../../../src/game/IsometricConverter";
import { RemoteSpam } from "../../../src/network/RemoteSpam";
import { useColyseusServer } from "../../helpers/colyseus";

const converter = new IsometricConverter(64, 32);

// F-063: the real server flies the emails, the client draws them and slows its player.
describe("RemoteSpam", () => {
  const colyseus = useColyseusServer();

  /** Math.random is fixed at 0.1: each email flies along the visitor's row, from the left. */
  async function joinNearTheLeftEdge() {
    vi.stubEnv("SPAM_FLIES", "true");
    vi.stubEnv("DEV_WANDERS", "false");
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const room = await colyseus().createRoom<CvRoom>("cv", {});
    const me = await colyseus().connectTo(room);
    const world = new Container();
    const onSlowedChange = vi.fn();
    const remoteSpam = new RemoteSpam(world, converter, me, onSlowedChange);
    const player = room.state.players.get(me.sessionId)!;
    // A few tiles in, so an email is on screen for about a second before it hits.
    player.column = 5;
    player.row = PLAYER_SPAWN.row;

    const emails = () =>
      world.children.filter((child) => child instanceof SpamEmail);

    return { room, me, world, remoteSpam, onSlowedChange, emails };
  }

  it("draws each flying email with its subject, and removes it once it's gone", async () => {
    const { remoteSpam, emails } = await joinNearTheLeftEdge();
    remoteSpam.applyTheme(THEMES[1]);

    await vi.waitFor(() => expect(emails()).toHaveLength(1), { timeout: 4000 });
    const [email] = emails();
    expect(email.subject).toBe(spamSubject(email.emailId));
    expect(remoteSpam.drawn).toEqual([email]);

    // It hits the visitor and disappears.
    await vi.waitFor(() => expect(emails()).toHaveLength(0), { timeout: 4000 });
  });

  it("reports when this visitor is slowed down, and when they recover", async () => {
    const { onSlowedChange } = await joinNearTheLeftEdge();

    await vi.waitFor(() => expect(onSlowedChange).toHaveBeenCalledWith(true), {
      timeout: 4000,
    });
    await vi.waitFor(
      () => expect(onSlowedChange).toHaveBeenLastCalledWith(false),
      { timeout: 4000 },
    );
    expect(onSlowedChange).toHaveBeenCalledTimes(2);
  });

  it("removes the emails and stops listening when destroyed", async () => {
    const { remoteSpam, emails, onSlowedChange } = await joinNearTheLeftEdge();
    await vi.waitFor(() => expect(emails()).toHaveLength(1), { timeout: 4000 });

    remoteSpam.destroy();

    expect(emails()).toHaveLength(0);
    expect(onSlowedChange).not.toHaveBeenCalled();
  });
});
