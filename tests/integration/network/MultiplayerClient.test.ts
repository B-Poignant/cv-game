import { describe, expect, it, vi } from "vitest";

import { MultiplayerClient } from "../../../src/network/MultiplayerClient";
import { testPort, useColyseusServer } from "../../helpers/colyseus";

// Real client against the real server, over a real WebSocket.
describe("MultiplayerClient", () => {
  useColyseusServer();

  const endpoint = () => `http://localhost:${testPort()}`;

  // F-012
  it("joins with the visitor's identity", async () => {
    const client = new MultiplayerClient(endpoint());

    await client.connect({ name: "Moe", company: "Moe's Tavern" });

    const room = client.getRoom();
    await vi.waitFor(() => {
      expect(room.state.players.get(room.sessionId)).toMatchObject({
        name: "Moe",
        company: "Moe's Tavern",
      });
    });
    await client.disconnect();
  });

  it("starts disconnected", () => {
    const client = new MultiplayerClient(endpoint());

    expect(client.isConnected()).toBe(false);
    expect(() => client.getRoom()).toThrow("not connected");
  });

  it("joins the cv room and receives its own player", async () => {
    const client = new MultiplayerClient(endpoint());

    await client.connect();

    const room = client.getRoom();
    expect(client.isConnected()).toBe(true);
    expect(room.name).toBe("cv");
    await vi.waitFor(() => {
      expect(room.state.players.has(room.sessionId)).toBe(true);
    });

    await client.disconnect();
  });

  it("does not join twice when connect is called again", async () => {
    const client = new MultiplayerClient(endpoint());
    await client.connect();
    const firstSession = client.getRoom().sessionId;

    await client.connect();

    expect(client.getRoom().sessionId).toBe(firstSession);

    await client.disconnect();
  });

  it("puts two clients in the same room", async () => {
    const alice = new MultiplayerClient(endpoint());
    const bob = new MultiplayerClient(endpoint());

    await alice.connect();
    await bob.connect();

    expect(bob.getRoom().roomId).toBe(alice.getRoom().roomId);

    await Promise.all([alice.disconnect(), bob.disconnect()]);
  });

  it("disconnects cleanly", async () => {
    const client = new MultiplayerClient(endpoint());
    await client.connect();

    await client.disconnect();

    expect(client.isConnected()).toBe(false);
    await expect(client.disconnect()).resolves.toBeUndefined();
  });

  it("rejects and stays disconnected when the server is unreachable", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = new MultiplayerClient("http://localhost:1");

    await expect(client.connect()).rejects.toThrow();

    expect(client.isConnected()).toBe(false);
    expect(error).toHaveBeenCalledWith(
      "[MULTIPLAYER] Unable to connect",
      expect.anything(),
    );
  });
});
