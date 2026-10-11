import { describe, expect, it, vi } from "vitest";

import type { CvRoom } from "../../../server/rooms/CvRoom";
import { DEFAULT_RECRUITERS } from "../../../shared/recruiters";
import {
  createWorldCollisions,
  DEV_SPAWN,
  isWalkable,
  PLAYER_SPAWN,
} from "../../../shared/world";
import { useColyseusServer } from "../../helpers/colyseus";

const SPAWN = PLAYER_SPAWN;

describe("CvRoom", () => {
  const colyseus = useColyseusServer();

  /** Creates a room with one connected client. `connectTo` resolves once the initial state is synced. */
  async function joinRoom() {
    const room = await colyseus().createRoom<CvRoom>("cv", {});
    const client = await colyseus().connectTo(room);

    const player = () => room.state.players.get(client.sessionId)!;

    return { room, client, player };
  }

  describe("joining", () => {
    it("adds the player at the spawn point", async () => {
      const { room, client } = await joinRoom();

      const player = room.state.players.get(client.sessionId);

      expect(player).toMatchObject(SPAWN);
    });

    // F-012
    it("names the player with the identity they chose, cleaned up", async () => {
      const room = await colyseus().createRoom<CvRoom>("cv", {});
      const client = await colyseus().connectTo(room, {
        name: "  Homer ",
        company: "Springfield   Nuclear",
      });

      expect(room.state.players.get(client.sessionId)).toMatchObject({
        name: "Homer",
        company: "Springfield Nuclear",
      });
    });

    // F-012: the server never trusts what the client typed.
    it.each([
      { label: "no identity", options: undefined },
      { label: "an empty name", options: { name: "", company: "Acme" } },
      {
        label: "a name that's too long",
        options: { name: "n".repeat(21), company: "Acme" },
      },
      { label: "markup", options: { name: "<script>", company: "Acme" } },
      { label: "a non-string", options: { name: 42, company: ["Acme"] } },
    ])("gives a random default identity for $label", async ({ options }) => {
      const room = await colyseus().createRoom<CvRoom>("cv", {});
      const client = await colyseus().connectTo(room, options);

      const player = room.state.players.get(client.sessionId)!;

      expect(DEFAULT_RECRUITERS).toContainEqual({
        name: player.name,
        company: player.company,
      });
    });

    it("syncs every player to every client", async () => {
      const { room, client: first } = await joinRoom();
      const second = await colyseus().connectTo(room);

      expect(second.state.players.size).toBe(2);
      expect(second.state.players.get(first.sessionId)).toMatchObject(SPAWN);
    });

    it("removes the player when they leave", async () => {
      const { room, client } = await joinRoom();

      await client.leave();

      // The room disposes once empty, so poll the state instead of waiting for a patch.
      await vi.waitFor(() => {
        expect(room.state.players.has(client.sessionId)).toBe(false);
      });
    });
  });

  describe("moving", () => {
    it.each([
      { column: 1, row: 0, label: "one tile right" },
      { column: 0, row: -1, label: "one tile up" },
      { column: 0.05, row: 0, label: "a single frame of movement" },
      { column: 0.7, row: 0.7, label: "a short diagonal" },
    ])("accepts $label", async (step) => {
      const column = SPAWN.column + step.column;
      const row = SPAWN.row + step.row;
      const { room, client, player } = await joinRoom();

      client.send("move", { column, row });
      await room.waitForNextMessage();

      expect(player()).toMatchObject({ column, row });
    });

    it("broadcasts an accepted move to other clients", async () => {
      const { room, client: mover } = await joinRoom();
      const watcher = await colyseus().connectTo(room);

      mover.send("move", { column: SPAWN.column + 1, row: SPAWN.row });
      await watcher.waitForNextPatch();

      expect(watcher.state.players.get(mover.sessionId)).toMatchObject({
        column: SPAWN.column + 1,
        row: SPAWN.row,
      });
    });

    it("only moves the sender", async () => {
      const { room, client: mover } = await joinRoom();
      const other = await colyseus().connectTo(room);

      mover.send("move", { column: SPAWN.column + 1, row: SPAWN.row });
      await room.waitForNextMessage();

      expect(room.state.players.get(other.sessionId)).toMatchObject(SPAWN);
    });
  });

  // The server is authoritative: a modified client must not be able to cheat.
  describe("rejecting invalid moves", () => {
    it.each([
      { column: 2, row: 0, label: "a jump of two tiles" },
      { column: 0.8, row: 0.8, label: "a long diagonal (~1.13 tiles)" },
      { column: 10, row: 10, label: "a teleport" },
    ])("rejects $label", async (step) => {
      const { room, client, player } = await joinRoom();

      client.send("move", {
        column: SPAWN.column + step.column,
        row: SPAWN.row + step.row,
      });
      await room.waitForNextMessage();

      expect(player()).toMatchObject(SPAWN);
    });

    // Each move is short enough on its own; together they're far faster than walking.
    it("rejects a burst of moves faster than the player's speed", async () => {
      const { client, player } = await joinRoom();

      for (const up of [0.9, 1.8, 2.7, 3.6, 4.5]) {
        client.send("move", { column: SPAWN.column, row: SPAWN.row - up });
      }
      await vi.waitFor(() => expect(player().row).toBeLessThan(SPAWN.row));
      // Give the remaining messages time to arrive (the budget refills too slowly to allow a second jump in that time).
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(player()).toMatchObject({
        column: SPAWN.column,
        row: SPAWN.row - 0.9,
      });
    });

    // Tile 23 is the last one and ends at 23.5: past that is off the drawn map.
    it("rejects a step past the last tile, and accepts one inside it", async () => {
      const { room, client, player } = await joinRoom();
      player().column = 23;
      player().row = 10;

      client.send("move", { column: 23.6, row: 10 });
      await room.waitForNextMessage();
      expect(player()).toMatchObject({ column: 23, row: 10 });

      client.send("move", { column: 23.4, row: 10 });
      await room.waitForNextMessage();
      expect(player()).toMatchObject({ column: 23.4, row: 10 });
    });

    // EXPERIENCE covers columns 16–18, rows 5–6 (shared/buildings.ts).
    it("rejects a step into a building", async () => {
      const { room, client, player } = await joinRoom();
      player().column = 15;
      player().row = 5;

      client.send("move", { column: 16, row: 5 });
      await room.waitForNextMessage();

      expect(player()).toMatchObject({ column: 15, row: 5 });
    });

    it("rejects a small step that rounds onto a building", async () => {
      const { room, client, player } = await joinRoom();
      player().column = 15;
      player().row = 5;

      client.send("move", { column: 15.6, row: 5 });
      await room.waitForNextMessage();

      expect(player()).toMatchObject({ column: 15, row: 5 });
    });

    it("accepts a step along a building's wall", async () => {
      const { room, client, player } = await joinRoom();
      player().column = 15;
      player().row = 5;

      client.send("move", { column: 15, row: 4 });
      await room.waitForNextMessage();

      expect(player()).toMatchObject({ column: 15, row: 4 });
    });

    it.each([
      { column: -0.6, row: 0, label: "left of the map" },
      { column: 0, row: -0.6, label: "above the map" },
    ])("rejects a small step $label", async (target) => {
      const { room, client, player } = await joinRoom();
      // Put the player on the edge so only the bounds rule can reject the move.
      // Tile 0 starts at -0.5, so -0.6 is the first position off the map.
      player().column = 0;
      player().row = 0;

      client.send("move", target);
      await room.waitForNextMessage();

      expect(player()).toMatchObject({ column: 0, row: 0 });
    });

    it.each([
      { column: 24, row: 23, label: "right of the map" },
      { column: 23, row: 24, label: "below the map" },
    ])("rejects a small step $label", async (target) => {
      const { room, client, player } = await joinRoom();
      player().column = 23;
      player().row = 23;

      client.send("move", target);
      await room.waitForNextMessage();

      expect(player()).toMatchObject({ column: 23, row: 23 });
    });

    it.each([
      { payload: { column: NaN, row: 5 }, label: "NaN" },
      { payload: { column: "6", row: 5 }, label: "a string coordinate" },
      { payload: { column: 6 }, label: "a missing coordinate" },
      { payload: {}, label: "an empty message" },
    ])("ignores a malformed message: $label", async ({ payload }) => {
      const { room, client, player } = await joinRoom();

      client.send("move", payload);
      await room.waitForNextMessage();

      expect(player()).toMatchObject(SPAWN);
    });
  });

  // F-060
  describe("the dev", () => {
    it("syncs Ben near his spawn point to a client that joins", async () => {
      const { client } = await joinRoom();

      const dev = client.state.dev;
      expect(dev.name).toBe("Ben");
      expect(
        Math.hypot(dev.column - DEV_SPAWN.column, dev.row - DEV_SPAWN.row),
      ).toBeLessThan(1);
    });

    it("wanders on his own, and clients see him move", async () => {
      const { client } = await joinRoom();
      const start = {
        column: client.state.dev.column,
        row: client.state.dev.row,
      };

      await vi.waitFor(
        () => {
          expect({
            column: client.state.dev.column,
            row: client.state.dev.row,
          }).not.toEqual(start);
        },
        { timeout: 4000 },
      );
    });

    it("stays in place when DEV_WANDERS=false (used by e2e tests)", async () => {
      vi.stubEnv("DEV_WANDERS", "false");
      try {
        const { room } = await joinRoom();

        for (let sample = 0; sample < 5; sample += 1) {
          await room.waitForNextPatch();
        }
        expect(room.state.dev).toMatchObject(DEV_SPAWN);
      } finally {
        vi.unstubAllEnvs();
      }
    });

    // F-061
    it("runs away from a recruiter who comes close", async () => {
      // Wander targets land on his own tile, so without fleeing he stands still.
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const { room, player } = await joinRoom();
      const recruiter = player();
      recruiter.column = room.state.dev.column - 2;
      recruiter.row = room.state.dev.row;
      const gap = () =>
        Math.hypot(
          room.state.dev.column - recruiter.column,
          room.state.dev.row - recruiter.row,
        );

      for (let tick = 0; tick < 10; tick += 1) {
        await room.waitForNextTimestep();
      }

      expect(gap()).toBeGreaterThan(2.5);
    });

    it("only stands on walkable tiles", async () => {
      const { room } = await joinRoom();
      const collisions = createWorldCollisions();

      for (let sample = 0; sample < 10; sample += 1) {
        await room.waitForNextTimestep();
        expect(isWalkable(room.state.dev, collisions)).toBe(true);
      }
    });
  });

  // F-031. SKILLS covers columns 5–7, rows 5–6; EXPERIENCE columns 16–18, rows 5–6; the
  // chest is at (21, 21); spawn is (12, 12).
  describe("intel cards", () => {
    it("gives a building's card to a recruiter standing next to it", async () => {
      const { room, client, player } = await joinRoom();
      player().column = 6;
      player().row = 7;

      client.send("collect-intel", { source: "skills" });
      await room.waitForNextMessage();

      expect([...player().intel]).toEqual(["stack"]);
    });

    it("gives the chest's secret card, and syncs cards to the recruiter", async () => {
      const { client, player } = await joinRoom();
      player().column = 21;
      player().row = 20;

      client.send("collect-intel", { source: "chest" });
      await client.waitForNextPatch();

      expect([...client.state.players.get(client.sessionId)!.intel]).toEqual([
        "work-mode",
      ]);
    });

    it("keeps cards in the order they were earned", async () => {
      const { room, client, player } = await joinRoom();
      player().column = 21;
      player().row = 20;
      client.send("collect-intel", { source: "chest" });
      await room.waitForNextMessage();

      player().column = 15;
      player().row = 5;
      client.send("collect-intel", { source: "experience" });
      await room.waitForNextMessage();

      expect([...player().intel]).toEqual(["work-mode", "lead"]);
    });

    it("refuses a card to a recruiter too far away", async () => {
      const { room, client, player } = await joinRoom();

      client.send("collect-intel", { source: "skills" });
      client.send("collect-intel", { source: "experience" });
      client.send("collect-intel", { source: "chest" });
      await room.waitForNextMessage();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect([...player().intel]).toEqual([]);
    });

    it("gives each card only once", async () => {
      const { room, client, player } = await joinRoom();
      player().column = 6;
      player().row = 7;

      client.send("collect-intel", { source: "skills" });
      client.send("collect-intel", { source: "skills" });
      await room.waitForNextMessage();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect([...player().intel]).toEqual(["stack"]);
    });

    it.each([
      { label: "an unknown source", message: { source: "bank" } },
      { label: "a card id instead of a source", message: { source: "stack" } },
      { label: "a building with no card", message: { source: "education" } },
      { label: "no source", message: {} },
      { label: "not an object", message: "skills" },
    ])("ignores $label", async ({ message }) => {
      const { room, client, player } = await joinRoom();
      player().column = 6;
      player().row = 7;

      client.send("collect-intel", message);
      await room.waitForNextMessage();

      expect([...player().intel]).toEqual([]);
    });

    it("only gives the card to the sender", async () => {
      const { room, client, player } = await joinRoom();
      const other = await colyseus().connectTo(room);
      player().column = 6;
      player().row = 7;

      client.send("collect-intel", { source: "skills" });
      await room.waitForNextMessage();

      expect([...room.state.players.get(other.sessionId)!.intel]).toEqual([]);
    });
  });

  // F-042. With DEV_WANDERS=false, Ben stays at DEV_SPAWN (14, 14) and only moves count.
  describe("catching the dev and pitching", () => {
    const GOOD_OFFER = {
      stack: "php",
      workMode: "remote",
      role: "tech-lead",
      line: "read-cv",
    };

    /** A recruiter 0.7 tile from a still Ben, holding `intel` cards. */
    async function nextToBen({ intel = 3 } = {}) {
      vi.stubEnv("DEV_WANDERS", "false");
      const joined = await joinRoom().finally(() => vi.unstubAllEnvs());
      const { client, player } = joined;
      const events: unknown[] = [];
      client.onMessage("pitch", (event) => events.push(event));
      player().intel.push(...["stack", "lead", "work-mode"].slice(0, intel));
      player().column = DEV_SPAWN.column;
      player().row = DEV_SPAWN.row - 0.7;
      let step = 0;

      /** A small step that stays touching Ben: the server checks the catch after each move. */
      const touch = () => {
        step += 1;
        client.send("move", {
          column: DEV_SPAWN.column,
          row: DEV_SPAWN.row - 0.7 + (step % 2) * 0.05,
        });
      };

      return { ...joined, events, touch };
    }

    const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

    it("opens the pitch for a recruiter with 3 intel cards who touches Ben", async () => {
      const { events, touch } = await nextToBen();

      touch();

      await vi.waitFor(() => expect(events).toEqual([{ type: "open" }]));
    });

    it("refuses a recruiter with fewer than 3 cards", async () => {
      const { events, touch } = await nextToBen({ intel: 2 });

      touch();

      await vi.waitFor(() =>
        expect(events).toEqual([
          { type: "refused", line: "Do you even know what I do?" },
        ]),
      );
    });

    it("ignores a recruiter who isn't touching him", async () => {
      const { client, events, player } = await nextToBen();
      player().row = DEV_SPAWN.row - 1.5;

      client.send("move", { column: DEV_SPAWN.column, row: DEV_SPAWN.row - 1 });
      await settle();

      expect(events).toEqual([]);
    });

    it("catches a recruiter Ben walks into, without them moving", async () => {
      // Wander targets land on his own tile: he only moves to flee.
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const { room, client } = await joinRoom();
      const events: unknown[] = [];
      client.onMessage("pitch", (event) => events.push(event));
      const recruiter = room.state.players.get(client.sessionId)!;
      recruiter.intel.push("stack", "lead", "work-mode");
      recruiter.column = room.state.dev.column;
      recruiter.row = room.state.dev.row;

      await vi.waitFor(() => expect(events).toEqual([{ type: "open" }]));
    });

    it("hires on a good offer", async () => {
      const { client, events, touch } = await nextToBen();
      touch();
      await vi.waitFor(() => expect(events).toHaveLength(1));

      client.send("pitch", GOOD_OFFER);

      await vi.waitFor(() =>
        expect(events[1]).toEqual({
          type: "result",
          hired: true,
          lines: ["…OK. You actually read it. You got me."],
        }),
      );
    });

    it("refuses a bad offer, then makes the recruiter wait", async () => {
      const { client, events, touch } = await nextToBen();
      touch();
      await vi.waitFor(() => expect(events).toHaveLength(1));

      client.send("pitch", { ...GOOD_OFFER, workMode: "onsite" });
      await vi.waitFor(() =>
        expect(events[1]).toEqual({
          type: "result",
          hired: false,
          lines: ["5 days in the office? I'll pass."],
        }),
      );

      touch();
      await vi.waitFor(() =>
        expect(events[2]).toEqual({
          type: "refused",
          line: expect.stringMatching(
            /^Not again! Give me (29|30) s.$/,
          ) as string,
        }),
      );
    });

    it("ignores an offer from a recruiter who wasn't caught", async () => {
      const { client, events } = await nextToBen();

      client.send("pitch", GOOD_OFFER);
      await settle();

      expect(events).toEqual([]);
    });

    it("ignores an invalid offer, and still takes a valid one", async () => {
      const { client, events, touch } = await nextToBen();
      touch();
      await vi.waitFor(() => expect(events).toHaveLength(1));

      client.send("pitch", { ...GOOD_OFFER, stack: "rust" });
      client.send("pitch", "hire me");
      await settle();
      expect(events).toHaveLength(1);

      client.send("pitch", GOOD_OFFER);
      await vi.waitFor(() =>
        expect(events[1]).toMatchObject({ type: "result", hired: true }),
      );
    });

    it("ignores an offer after the recruiter closed the dialog", async () => {
      const { client, events, touch } = await nextToBen();
      touch();
      await vi.waitFor(() => expect(events).toHaveLength(1));

      client.send("pitch-cancel");
      client.send("pitch", GOOD_OFFER);
      await settle();

      expect(events).toHaveLength(1);
    });
  });
});
