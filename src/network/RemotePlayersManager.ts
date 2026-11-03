import { Callbacks } from "@colyseus/sdk";
import type { Container } from "pixi.js";
import type { Room } from "@colyseus/sdk";

import type { CvRoomState, PlayerState } from "../../server/rooms/CvRoomState";

import type { GridPosition } from "../../shared/grid";
import type { Theme } from "../config/themes";
import { IsometricConverter } from "../game/IsometricConverter";
import { RemotePlayer } from "./RemotePlayer";

export class RemotePlayersManager {
  private readonly players = new Map<string, RemotePlayer>();

  private readonly callbacks;
  private readonly unsubscribers: (() => void)[] = [];
  private readonly world: Container;
  private readonly converter: IsometricConverter;
  private readonly room: Room<CvRoomState>;
  private theme?: Theme;

  constructor(
    world: Container,
    converter: IsometricConverter,
    room: Room<CvRoomState>,
  ) {
    this.world = world;
    this.converter = converter;
    this.room = room;
    this.callbacks = Callbacks.get(this.room);

    this.listenToPlayers();
  }

  private listenToPlayers(): void {
    this.unsubscribers.push(
      this.callbacks.onAdd(
        "players",
        (playerState: PlayerState, sessionId: string) => {
          if (sessionId === this.room.sessionId) {
            return;
          }

          this.addPlayer(sessionId, playerState);
          this.unsubscribers.push(
            this.callbacks.onChange(playerState, () => {
              this.updatePlayer(sessionId, playerState);
            }),
          );
        },
      ),
      this.callbacks.onRemove(
        "players",
        (_playerState: PlayerState, sessionId: string) => {
          this.removePlayer(sessionId);
        },
      ),
    );
  }

  private addPlayer(sessionId: string, playerState: PlayerState): void {
    const player = new RemotePlayer(
      sessionId,
      { name: playerState.name, company: playerState.company },
      this.converter,
    );

    if (this.theme) {
      player.applyTheme(this.theme);
    }

    this.players.set(sessionId, player);

    this.world.addChild(player);

    this.updatePlayer(sessionId, playerState);

    console.log("[REMOTE] Player added to Pixi:", playerState.name);
  }

  private updatePlayer(sessionId: string, playerState: PlayerState): void {
    const player = this.players.get(sessionId);

    if (!player) {
      console.warn("[REMOTE] RemotePlayer not found:", sessionId);

      return;
    }

    const position: GridPosition = {
      column: playerState.column,
      row: playerState.row,
    };

    player.setGridPosition(position);
  }

  private removePlayer(sessionId: string): void {
    const player = this.players.get(sessionId);

    if (!player) {
      return;
    }

    this.world.removeChild(player);
    player.destroy();

    this.players.delete(sessionId);
  }

  /** Recolours every visitor's name tag, now and for visitors who join later. */
  public applyTheme(theme: Theme): void {
    this.theme = theme;

    for (const player of this.players.values()) {
      player.applyTheme(theme);
    }
  }

  /** Removes every visitor and stops listening to the room, which may outlive this object. */
  public destroy(): void {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers.length = 0;

    for (const player of this.players.values()) {
      this.world.removeChild(player);
      player.destroy();
    }

    this.players.clear();
  }
}
