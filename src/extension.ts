import * as vscode from "vscode";
import { ConfigHandler } from "./handlers";
import { ActivityHandler } from "./handlers/activity";
import { BRIDGE_CONFIG_KEY, BridgeConfig } from "./types/bridgeConfig";
import { Icons } from "./assets/icons";
import { migrateConfig } from "./handlers/config/migration";

export class ExtensionController {
  public config: ConfigHandler;
  public activity: ActivityHandler;
  public uri: vscode.Uri;
  public readonly assets: {
    readonly base: vscode.Uri;
    readonly hueIcons: Icons;
  };

  constructor(context: vscode.ExtensionContext) {
    this.config = new ConfigHandler(context.secrets);
    this.activity = new ActivityHandler();
    this.uri = context.extensionUri;
    const assetsFolder =  vscode.Uri.joinPath(this.uri, "assets");
    this.assets = {
      base: assetsFolder,
      hueIcons: new Icons(assetsFolder),
    };
  }

  dispose() {}

  public async setup(): Promise<void> {
    this.activity.on("afterActivity", () => this.saveConfig());

    //Migration of config
    this.activity.on("onBridgedAdded", async (parent, bridge) => {
      if (await migrateConfig(bridge)) {
        this.saveConfig();
      }
    });


    const config = await this.config.get<BridgeConfig[]>(BRIDGE_CONFIG_KEY);

    this.activity.setConfig(config ?? []);
  }

  public async saveConfig() {
    const config = this.activity.getConfig();
    await this.config.store(BRIDGE_CONFIG_KEY, config);
  }
}
