import { Callbacks, type Room } from "@colyseus/sdk";

import type { CvRoomState, PlayerState } from "../../server/rooms/CvRoomState";
import { type IntelCardId, isIntelCardId } from "../../shared/intel";

/**
 * Follows the intel cards the server gives this visitor (F-031). Calls `onChange` with every
 * card held so far once the visitor is in the room, then again after each new card.
 */
export class LocalIntel {
  private readonly unsubscribers: (() => void)[] = [];

  constructor(
    room: Room<CvRoomState>,
    onChange: (cards: IntelCardId[]) => void,
  ) {
    const callbacks = Callbacks.get(room);

    this.unsubscribers.push(
      callbacks.onAdd("players", (player: PlayerState, sessionId: string) => {
        if (sessionId !== room.sessionId) {
          return;
        }

        const notify = () =>
          onChange(Array.from(player.intel).filter(isIntelCardId));

        notify();
        this.unsubscribers.push(
          callbacks.onAdd(player, "intel", notify, false),
        );
      }),
    );
  }

  public destroy(): void {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }

    this.unsubscribers.length = 0;
  }
}
