import { Application, type Ticker } from "pixi.js";

import { DEFAULT_THEME, THEMES } from "../config/themes";
import { MainScene } from "../scenes/MainScene";
import { MinigameFlow } from "../scenes/MinigameFlow";
import { MinigameScene } from "../scenes/MinigameScene";
import { createMinigames } from "../scenes/minigames/registry";
import { CV } from "../content/cv";
import { CONTACT } from "../content/contact";
import { intelCardText } from "../content/intel";
import { AchievementsPanel } from "../ui/AchievementsPanel";
import { AchievementToast } from "../ui/AchievementToast";
import { ChatLog } from "../ui/ChatLog";
import { CvPanel } from "../ui/CvPanel";
import { IdentityPanel } from "../ui/IdentityPanel";
import { IntelInventory } from "../ui/IntelInventory";
import { PitchDialog } from "../ui/PitchDialog";
import { PitchFlow } from "../ui/PitchFlow";
import { ThemeButton } from "../ui/ThemeButton";
import { AchievementTracker, browserStorage } from "./AchievementTracker";
import { ThemeCycle } from "./ThemeCycle";

export class Game {
  private readonly app: Application;
  private mainScene?: MainScene;
  private minigameScene?: MinigameScene;
  private themeButton?: ThemeButton;
  private cvPanel?: CvPanel;
  private identityPanel?: IdentityPanel;
  private intelInventory?: IntelInventory;
  private chatLog?: ChatLog;
  private pitchDialog?: PitchDialog;
  private achievementsPanel?: AchievementsPanel;
  private achievementToast?: AchievementToast;

  private started = false;
  private destroyed = false;

  constructor() {
    this.app = new Application();
  }

  public async start(): Promise<void> {
    if (this.started || this.destroyed) {
      return;
    }

    this.started = true;

    await this.app.init({
      resizeTo: window,
      antialias: false,
      background: DEFAULT_THEME.background,
    });

    document.body.appendChild(this.app.canvas);

    this.cvPanel = new CvPanel(CV);
    const chatLog = new ChatLog();
    this.chatLog = chatLog;
    const intelInventory = new IntelInventory(
      (card) => intelCardText(card, CV, new Date()),
      (text) => chatLog.post({ text }),
    );
    this.intelInventory = intelInventory;
    const achievements = this.createAchievements(chatLog);
    this.mainScene = new MainScene(this.app.renderer, {
      onBuildingSelected: (section) => this.cvPanel?.open(section),
      onIntelChange: (cards) => {
        intelInventory.update(cards);
        achievements.intelChanged(cards);
      },
      onIntelOutOfReach: () =>
        chatLog.post({ text: "Get closer to collect its intel." }),
      onPitchEvent: (event) => {
        pitchFlow.handle(event);
        if (event.type === "result") {
          achievements.pitched(event.hired);
        }
      },
      onDevLine: (line) => chatLog.post({ speaker: "Ben", text: line }),
      onSlowedChange: (slowed) => {
        if (slowed) {
          chatLog.post({
            text: "Spam! An exciting opportunity slows you down.",
          });
        }
      },
    });
    const minigameScene = new MinigameScene(this.app.renderer);
    this.minigameScene = minigameScene;
    this.mainScene.setMinigames(
      new MinigameFlow(
        this.mainScene,
        minigameScene,
        createMinigames(CV),
        this.cvPanel,
        chatLog,
      ),
    );
    this.pitchDialog = new PitchDialog();
    const pitchFlow = new PitchFlow(
      this.mainScene,
      this.pitchDialog,
      (message) => chatLog.post(message),
      CONTACT,
    );
    this.cvPanel.onOpenChange((open) => {
      this.mainScene?.setPaused(open);
      const section = this.cvPanel?.currentSection;
      if (open && section) {
        achievements.sectionOpened(section);
      }
    });

    this.app.stage.addChild(this.mainScene, minigameScene);

    const themes = new ThemeCycle(THEMES);
    themes.onChange((theme) => {
      this.mainScene?.applyTheme(theme);
      this.minigameScene?.applyTheme(theme);
    });
    this.mainScene.applyTheme(themes.current);
    minigameScene.applyTheme(themes.current);
    this.themeButton = new ThemeButton(themes);

    this.app.ticker.add(this.update);

    // The map shows behind the arrival panel, but nobody moves or joins until Start (F-012).
    this.mainScene.setPaused(true);
    this.identityPanel = new IdentityPanel();
    void this.identityPanel.choose().then((identity) => {
      achievements.arrived();
      this.mainScene?.join(identity);
      this.mainScene?.setPaused(false);
    });
  }

  /** Achievements (F-041): kept in this browser, announced by a toast and in the chat log. */
  private createAchievements(chatLog: ChatLog): AchievementTracker {
    const tracker = new AchievementTracker(browserStorage());
    const toast = new AchievementToast();

    this.achievementToast = toast;
    this.achievementsPanel = new AchievementsPanel(tracker);
    tracker.onUnlock((achievement) => {
      toast.show(achievement);
      chatLog.post({ text: `Achievement unlocked: ${achievement.title}` });
    });

    return tracker;
  }

  private update = (ticker: Ticker): void => {
    this.mainScene?.update(ticker.deltaMS / 1000);
    this.minigameScene?.update(ticker.deltaMS / 1000);
  };

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    this.app.ticker.remove(this.update);

    this.themeButton?.destroy();
    this.themeButton = undefined;

    this.cvPanel?.destroy();
    this.cvPanel = undefined;

    this.identityPanel?.destroy();
    this.identityPanel = undefined;

    this.intelInventory?.destroy();
    this.intelInventory = undefined;

    this.chatLog?.destroy();
    this.chatLog = undefined;

    this.pitchDialog?.destroy();
    this.pitchDialog = undefined;

    this.achievementsPanel?.destroy();
    this.achievementsPanel = undefined;

    this.achievementToast?.destroy();
    this.achievementToast = undefined;

    this.minigameScene?.destroy(true);
    this.minigameScene = undefined;

    this.mainScene?.destroy(true);
    this.mainScene = undefined;

    this.app.destroy(true);
  }
}
