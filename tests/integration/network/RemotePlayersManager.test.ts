// @vitest-environment happy-dom
import { Container, Text } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import type { CvRoom } from "../../../server/rooms/CvRoom";
import { THEMES } from "../../../src/config/themes";
import { NameTag } from "../../../src/game/entities/NameTag";
import { IsometricConverter } from "../../../src/game/IsometricConverter";
import { RemotePlayer } from "../../../src/network/RemotePlayer";
import { RemotePlayersManager } from "../../../src/network/RemotePlayersManager";
import { PLAYER_SPAWN } from "../../../shared/world";
import { useColyseusServer } from "../../helpers/colyseus";

const converter = new IsometricConverter(64, 32);

// Real room state from the real server, rendered into a Pixi container.
describe("RemotePlayersManager", () => {
  const colyseus = useColyseusServer();

  /** "Me": a connected client whose world shows the other visitors. */
  async function joinAsMe() {
    const room = await colyseus().createRoom<CvRoom>("cv", {});
    const me = await colyseus().connectTo(room);
    const world = new Container();
    const manager = new RemotePlayersManager(world, converter, me);

    const remotePlayers = () =>
      world.children.filter((child) => child instanceof RemotePlayer);

    return { room, me, world, manager, remotePlayers };
  }

  it("does not draw the local player", async () => {
    const { room, remotePlayers } = await joinAsMe();

    await room.waitForNextPatch();

    expect(remotePlayers()).toHaveLength(0);
  });

  it("draws a visitor who joins, at their tile, with their name and company", async () => {
    const { room, remotePlayers } = await joinAsMe();

    const other = await colyseus().connectTo(room, {
      name: "Randy",
      company: "Tegridy Farms",
    });

    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(1));
    const [player] = remotePlayers();
    expect(player.sessionId).toBe(other.sessionId);
    expect(player.identity).toEqual({
      name: "Randy",
      company: "Tegridy Farms",
    });
    expect({ x: player.x, y: player.y }).toEqual(
      converter.toScreen(PLAYER_SPAWN),
    );
  });

  it("draws visitors who were already in the room", async () => {
    const room = await colyseus().createRoom<CvRoom>("cv", {});
    await colyseus().connectTo(room);
    const me = await colyseus().connectTo(room);
    const world = new Container();

    new RemotePlayersManager(world, converter, me);

    await vi.waitFor(() => expect(world.children).toHaveLength(1));
  });

  it("moves a visitor when the server accepts their move", async () => {
    const { room, remotePlayers } = await joinAsMe();
    const other = await colyseus().connectTo(room);
    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(1));

    other.send("move", {
      column: PLAYER_SPAWN.column + 1,
      row: PLAYER_SPAWN.row,
    });

    const expected = converter.toScreen({
      column: PLAYER_SPAWN.column + 1,
      row: PLAYER_SPAWN.row,
    });
    await vi.waitFor(() => {
      const [player] = remotePlayers();
      expect({ x: player.x, y: player.y }).toEqual(expected);
    });
  });

  // Moves arrive many times per second: logging each one floods the console.
  it("does not log while visitors move", async () => {
    const { room, remotePlayers } = await joinAsMe();
    const other = await colyseus().connectTo(room);
    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(1));
    const log = vi.spyOn(console, "log");

    other.send("move", {
      column: PLAYER_SPAWN.column + 1,
      row: PLAYER_SPAWN.row,
    });

    const expected = converter.toScreen({
      column: PLAYER_SPAWN.column + 1,
      row: PLAYER_SPAWN.row,
    });
    await vi.waitFor(() => {
      const [player] = remotePlayers();
      expect({ x: player.x, y: player.y }).toEqual(expected);
    });
    expect(log).not.toHaveBeenCalled();
  });

  // e2e waits for "[REMOTE] Player added to Pixi: <name>"; every other line was noise.
  it("logs one line per visitor drawn, and nothing when one leaves", async () => {
    const { room, remotePlayers } = await joinAsMe();
    const log = vi.spyOn(console, "log");

    const other = await colyseus().connectTo(room, {
      name: "Randy",
      company: "Tegridy Farms",
    });
    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(1));
    await other.leave();
    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(0));

    // The server runs in this process too: only look at the client's own lines.
    const clientLines = log.mock.calls.filter(([first]) =>
      String(first).startsWith("[REMOTE]"),
    );
    expect(clientLines).toEqual([["[REMOTE] Player added to Pixi:", "Randy"]]);
    log.mockRestore();
  });

  // A room can outlive the manager (reconnection): it must stop listening.
  it("stops drawing visitors once destroyed", async () => {
    const { room, manager, remotePlayers } = await joinAsMe();
    await room.waitForNextPatch();

    manager.destroy();
    await colyseus().connectTo(room);
    await room.waitForNextPatch();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(remotePlayers()).toHaveLength(0);
  });

  // F-012
  it("colours visitors' name tags with the theme, also visitors who join later", async () => {
    const { room, manager, remotePlayers } = await joinAsMe();
    const theme = THEMES[2];
    await colyseus().connectTo(room);
    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(1));

    manager.applyTheme(theme);
    await colyseus().connectTo(room);
    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(2));

    for (const player of remotePlayers()) {
      const texts = player.children
        .filter((child) => child instanceof NameTag)
        .flatMap((tag) =>
          tag.children.filter((child) => child instanceof Text),
        );
      expect(texts.map((text) => text.style.fill)).toEqual([
        theme.label,
        theme.label,
      ]);
    }
  });

  it("removes a visitor who leaves", async () => {
    const { room, remotePlayers } = await joinAsMe();
    const other = await colyseus().connectTo(room);
    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(1));

    await other.leave();

    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(0));
  });

  it("removes every visitor on destroy", async () => {
    const { room, manager, remotePlayers } = await joinAsMe();
    await colyseus().connectTo(room);
    await colyseus().connectTo(room);
    await vi.waitFor(() => expect(remotePlayers()).toHaveLength(2));

    manager.destroy();

    expect(remotePlayers()).toHaveLength(0);
  });
});
