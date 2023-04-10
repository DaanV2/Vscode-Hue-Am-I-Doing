import { Application, Bridge } from "@daanv2/hue";
import { ActivitiesConfig, BridgeConfig } from "../types/bridgeConfig";
import { BridgeHandler } from "./bridge";
import { Events } from "../events/events";

export type ActionType = keyof ActivitiesConfig;

export interface ActivityEvents {
  afterActivity: (parent: ActivityHandler) => void;
  onBridgedAdded: (parent: ActivityHandler, bridge: BridgeHandler) => void;
}

export class ActivityHandler extends Events<ActivityEvents> {
  public apps: BridgeHandler[] = [];

  constructor() {
    super();
    this.apps = [];
  }

  public setConfig(input: BridgeConfig[]): this {
    this.apps = [];

    input.forEach((item) => this.addConfig(item));

    return this;
  }

  public addConfig(item: BridgeConfig): this {
    if (!item) {
      return this;
    }
    if (item.appId === "" || item.appKey === "") {
      return this;
    }

    console.info("Setting up bridge", item.bridgeId);
    const bridge = new Bridge(item.bridgeId, item.ip);
    const app = new Application(bridge, item.appKey);
    app.appId = item.appId;

    const b = new BridgeHandler(item, app);

    this.apps = this.apps.filter((item) => item.config.bridgeId !== b.config.bridgeId);
    this.apps.push(b);
    this.call("onBridgedAdded", this, b);

    return this;
  }

  public getBridge(id: string): BridgeHandler | undefined {
    return this.apps.find((item) => item.config.bridgeId === id);
  }

  public getConfig() {
    return this.apps.map((item) => item.config);
  }

  public async setOops(): Promise<boolean> {
    return this.performAction("onOops");
  }

  public async setVibin(): Promise<boolean> {
    return this.performAction("onVibin");
  }

  public async setNothing(): Promise<boolean> {
    return this.performAction("onNothing");
  }

  public async setBad(): Promise<boolean> {
    return this.performAction("onBad");
  }

  public async performAction(name: ActionType, abort?: AbortSignal): Promise<boolean> {
    console.info(`Performing ${name} actions`);
    const promises = this.apps.map(async (item) => {
      const action = item.config.actions[name];

      return item.performAction(action, abort);
    });

    return Promise.all(promises)
      .then((out) => {
        for (const item of out) {
          if (!item) {
            return false;
          }
        }

        return true;
      })
      .finally(() => {
        this.call("afterActivity", this);
      });
  }
}
