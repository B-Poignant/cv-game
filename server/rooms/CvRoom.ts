import { type Client, Room } from "colyseus";

import {
  createWorldCollisions,
  DEV_FLEE_RADIUS,
  DEV_NAME,
  DEV_SPAWN,
  DEV_SPEED,
  DEV_SPRINT,
  isWalkable,
  PLAYER_SPAWN,
  PLAYER_SPEED,
} from "../../shared/world";
import {
  INTEL_NEEDED_TO_PITCH,
  intelCardFrom,
  isIntelSource,
  isWithinIntelReach,
} from "../../shared/intel";
import {
  CATCH_DISTANCE,
  DEV_LINES,
  isPitchOffer,
  type PitchEvent,
  PITCH_COOLDOWN_SECONDS,
  scorePitch,
} from "../../shared/pitch";
import { normalizeIdentity, randomRecruiter } from "../../shared/recruiters";
import { CvRoomState, DevState, PlayerState } from "./CvRoomState";
import { DevWanderer } from "./DevWanderer";
import { MoveBudget } from "./MoveBudget";
import { PitchTracker } from "./PitchTracker";

/** Longest single move, in tiles: also how much movement a client can save up. */
const MAX_MOVE_DISTANCE = 1;

/** Headroom over PLAYER_SPEED for uneven frame and network timing. */
const SPEED_TOLERANCE = 1.25;

/** How often the server moves the dev, in milliseconds (20 times a second). */
export const SIMULATION_INTERVAL_MS = 50;

/** Time to send an offer once the pitch dialog opens (F-042). */
const PITCH_WINDOW_MS = 60_000;

/** Minimum time between two "no" from the dev to the same recruiter. */
const PITCH_NOTICE_MS = 3000;

/** `DEV_WANDERS=false` keeps the dev in place (e2e tests compare screenshots). */
function devWanders(): boolean {
  return process.env.DEV_WANDERS !== "false";
}

interface MoveMessage {
  column: number;
  row: number;
}

export class CvRoom extends Room {
  public maxClients = 10;

  public state = new CvRoomState();

  private readonly collisions = createWorldCollisions();

  private readonly moveBudgets = new Map<string, MoveBudget>();

  private readonly pitches = new PitchTracker({
    windowMs: PITCH_WINDOW_MS,
    cooldownMs: PITCH_COOLDOWN_SECONDS * 1000,
    noticeMs: PITCH_NOTICE_MS,
  });

  private readonly devWanderer = new DevWanderer(this.collisions, DEV_SPAWN, {
    speed: DEV_SPEED,
    fleeRadius: DEV_FLEE_RADIUS,
    sprint: DEV_SPRINT,
    maxTargetDistance: 5,
    minPauseSeconds: 0.5,
    maxPauseSeconds: 2,
    random: Math.random,
  });

  public onCreate(): void {
    const dev = new DevState();

    dev.name = DEV_NAME;
    dev.column = DEV_SPAWN.column;
    dev.row = DEV_SPAWN.row;
    this.state.dev = dev;

    this.onMessage("move", (client: Client, message: MoveMessage) => {
      this.handleMove(client, message);
    });

    this.onMessage("collect-intel", (client: Client, message: unknown) => {
      this.handleCollectIntel(client, message);
    });

    this.onMessage("pitch", (client: Client, message: unknown) => {
      this.handlePitch(client, message);
    });

    this.onMessage("pitch-cancel", (client: Client) => {
      this.pitches.cancel(client.sessionId, performance.now());
    });

    if (devWanders()) {
      this.setTimestep((deltaMs) => {
        this.moveDev(deltaMs / 1000);
      }, SIMULATION_INTERVAL_MS);
    }
  }

  /** `options` comes from the client: an identity it typed (F-012), never trusted as is. */
  public onJoin(client: Client, options?: unknown): void {
    const player = new PlayerState();
    const identity = normalizeIdentity(options) ?? randomRecruiter();

    player.name = identity.name;
    player.company = identity.company;
    player.column = PLAYER_SPAWN.column;
    player.row = PLAYER_SPAWN.row;

    this.state.players.set(client.sessionId, player);
    this.moveBudgets.set(
      client.sessionId,
      new MoveBudget(
        MAX_MOVE_DISTANCE,
        PLAYER_SPEED * SPEED_TOLERANCE,
        performance.now(),
      ),
    );

    console.log(`${identity.name} (${client.sessionId}) joined the CV room`);
  }

  public onLeave(client: Client, code?: number): void {
    console.log(`Player ${client.sessionId} left the CV room`, {
      code,
    });

    this.state.players.delete(client.sessionId);
    this.moveBudgets.delete(client.sessionId);
    this.pitches.remove(client.sessionId);
  }

  /** The dev wanders (F-060) and runs from nearby recruiters (F-061). Only the server moves him. */
  private moveDev(deltaSeconds: number): void {
    const recruiters = [...this.state.players.values()];
    const position = this.devWanderer.update(deltaSeconds, recruiters);

    this.state.dev.column = position.column;
    this.state.dev.row = position.row;

    for (const client of this.clients) {
      this.checkCatch(client);
    }
  }

  /**
   * A recruiter touching the dev (F-042): the server decides, from its own positions, whether
   * the pitch dialog opens or the dev says no.
   */
  private checkCatch(client: Client): void {
    const player = this.state.players.get(client.sessionId);

    if (!player || distanceBetween(player, this.state.dev) >= CATCH_DISTANCE) {
      return;
    }

    const outcome = this.pitches.touch(
      client.sessionId,
      player.intel.length >= INTEL_NEEDED_TO_PITCH,
      performance.now(),
    );

    switch (outcome.kind) {
      case "open":
        client.send("pitch", { type: "open" } satisfies PitchEvent);
        break;
      case "no-intel":
        client.send("pitch", {
          type: "refused",
          line: DEV_LINES.noIntel,
        } satisfies PitchEvent);
        break;
      case "cooldown":
        client.send("pitch", {
          type: "refused",
          line: DEV_LINES.cooldown(outcome.secondsLeft),
        } satisfies PitchEvent);
        break;
      case "none":
        break;
    }
  }

  /** Scores an offer sent while the recruiter's pitch dialog is open. Anything else is ignored. */
  private handlePitch(client: Client, message: unknown): void {
    if (!this.state.players.has(client.sessionId) || !isPitchOffer(message)) {
      return;
    }

    const now = performance.now();

    if (!this.pitches.submit(client.sessionId, now)) {
      return;
    }

    const result = scorePitch(message);

    if (!result.hired) {
      this.pitches.fail(client.sessionId, now);
    }

    client.send("pitch", { type: "result", ...result } satisfies PitchEvent);
  }

  private handleMove(client: Client, message: MoveMessage): void {
    const player = this.state.players.get(client.sessionId);
    const budget = this.moveBudgets.get(client.sessionId);

    if (!player || !budget) {
      return;
    }

    if (!this.isValidPosition(message)) {
      return;
    }

    // Distance per move and speed over time: a client can't jump or move too fast.
    if (!budget.tryMove(distanceBetween(player, message), performance.now())) {
      return;
    }

    player.column = message.column;
    player.row = message.row;

    this.checkCatch(client);
  }

  /**
   * Gives the card of a building or the chest (F-031), once, to a recruiter standing close
   * enough. The client only names the source: the server checks everything else.
   */
  private handleCollectIntel(client: Client, message: unknown): void {
    const player = this.state.players.get(client.sessionId);
    const source =
      typeof message === "object" && message !== null && "source" in message
        ? message.source
        : undefined;

    if (!player || !isIntelSource(source)) {
      return;
    }

    const card = intelCardFrom(source);

    if (
      !card ||
      player.intel.includes(card) ||
      !isWithinIntelReach(player, source)
    ) {
      return;
    }

    player.intel.push(card);
  }

  /** Finite numbers, inside the map and not inside a building (same rule as the client). */
  private isValidPosition(position: MoveMessage): boolean {
    return (
      Number.isFinite(position.column) &&
      Number.isFinite(position.row) &&
      isWalkable(position, this.collisions)
    );
  }
}

function distanceBetween(from: MoveMessage, to: MoveMessage): number {
  return Math.hypot(to.column - from.column, to.row - from.row);
}
