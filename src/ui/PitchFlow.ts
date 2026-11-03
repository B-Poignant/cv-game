import type { PitchEvent, PitchOffer } from "../../shared/pitch";
import type { Contact } from "../domain/Contact";
import type { ChatMessage } from "./ChatLog";
import type { PitchDialog } from "./PitchDialog";
import { renderReward } from "./rewardSection";

/** What the pitch needs from the game scene (`MainScene`). */
export interface PitchHost {
  setPaused(paused: boolean): void;
  pitch(offer: PitchOffer): void;
  cancelPitch(): void;
}

/**
 * Turns the server's pitch events into UI (F-042, F-043): opens the dialog and pauses the
 * game, sends the offer back, shows Ben's answer (with the contact details after a good
 * pitch), and posts everything Ben says to the chat log (F-052).
 */
export class PitchFlow {
  private readonly host: PitchHost;
  private readonly dialog: PitchDialog;
  private readonly say: (message: ChatMessage) => void;
  private readonly contact: Contact;

  constructor(
    host: PitchHost,
    dialog: PitchDialog,
    say: (message: ChatMessage) => void,
    contact: Contact,
  ) {
    this.host = host;
    this.dialog = dialog;
    this.say = say;
    this.contact = contact;
    this.dialog.onCloseWhileWaiting = () => {
      this.host.cancelPitch();
      this.host.setPaused(false);
    };
  }

  public handle(event: PitchEvent): void {
    switch (event.type) {
      case "open":
        this.host.setPaused(true);
        void this.dialog.choose().then((offer) => {
          if (offer) {
            this.host.pitch(offer);
          } else {
            this.host.cancelPitch();
            this.host.setPaused(false);
          }
        });
        break;
      case "refused":
        this.say({ speaker: "Ben", text: event.line });
        // A late offer is refused instead of scored: nothing else will close the dialog.
        if (this.dialog.isWaiting) {
          this.dialog.close();
        }
        break;
      case "result":
        for (const line of event.lines) {
          this.say({ speaker: "Ben", text: line });
        }
        void this.dialog
          .showResult(
            event,
            event.hired ? renderReward(this.contact) : undefined,
          )
          .then(() => {
            this.host.setPaused(false);
          });
        break;
    }
  }
}
