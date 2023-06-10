import * as vscode from "vscode";
import { WebviewPanel } from "vscode";
import { BaseWebview } from "./webview";
import { ExtensionController } from "../extension";
import { Application, Bridge, ClipError, CreateDeveloperResponse, DiscoveryBridgeData, HttpError } from "@daanv2/hue";
import { BridgeConfig } from "../types/bridgeConfig";
import { ConfigureBridgeCommand } from "../commands/configure-bridge";

export class SetupBridgeView extends BaseWebview {
  public readonly data: DiscoveryBridgeData;
  public readonly bridge: Bridge;
  public app: Application;
  private interval: NodeJS.Timeout | undefined;
  private message: string;

  constructor(controller: ExtensionController, data: DiscoveryBridgeData) {
    super("hue-am-i-doing.setup-bridge", "Setup Bridge", controller);

    this.data = data;
    this.bridge = new Bridge(data.id, data.internalipaddress);
    this.app = new Application(this.bridge, "hue-am-i-doing");
    this.message = "";
  }

  override dispose(): void {
    this.stopLoop();
    super.dispose();
  }

  setup(panel: WebviewPanel): void {
    //Loop until the bridge is registered
    this.interval = setTimeout(async () => {
      let state = false;

      while (!state) {
        state = await this.loop();

        this.update(panel);
      }
    }, 1000);
  }

  private async loop(): Promise<boolean> {
    try {
      const data = await this.bridge.registerDeveloper("hue-am-i-doing#vscode");

      this.message = "";
      if (Array.isArray(data)) {
        for (const item of data) {
          if (CreateDeveloperResponse.is(item)) {
            return this.bridgeSetup(item.success.username).then(() => true);
          } else if (item) {
            this.message += `${item.error.type}: ${item.error.description}\n`;
          }
        }
      }
    } catch (e) {
      if (e instanceof HttpError) {
        this.message = `${e.name}: ${e.message}\n${e.status}: ${e.statusText}`;
      } else if (e instanceof Error) {
        this.message = e.message;
      } else {
        this.message = "Unknown error: " + JSON.stringify(e);
      }
    }

    return false;
  }

  update(panel: WebviewPanel): void {
    panel.webview.html = this.getSetupWebviewContent(panel.webview);
  }

  private stopLoop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  // Called when the bridge is registered
  private async bridgeSetup(appKey: string): Promise<boolean> {
    this.message = "Bridge setup connected!";

    //Grabbing key and id
    try {
      this.app = new Application(this.bridge, appKey);

      const config = BridgeConfig.create(this.app);

      const bridgeConfig = await this.app.getConfig();
      config.name = bridgeConfig.name;

      this.controller.activity.addConfig(config);

      vscode.commands.executeCommand(ConfigureBridgeCommand.id, config.bridgeId);
      this.dispose();
    }
    catch (e) {
      this.message = e.message;
      vscode.window.showErrorMessage("Failed to setup bridge: " + e.message);
      console.info("Failed to setup bridge: ", e);
      return false;
    }
  }

  getSetupWebviewContent(webview: vscode.Webview) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${this.nonce}'; img-src ${webview.cspSource} https:; script-src 'nonce-${this.nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Setup Bridge</title>
    </head>
    <body>
      <style nonce="${this.nonce}">
        .separator {
          border-top: 1px dotted #ffffff;
        }
      </style>
      <div>
        <h1>Setup Bridge</h1>
        <hr class="separator">
        <div style="display: flex; flex-direction: row;">
          <p>Press the button on your bridge to continue</p>
        </div>
        <p>${this.message}</p>
      </div>

      <script nonce="${this.nonce}">
      var vscode;
        (function() {
          vscode = acquireVsCodeApi();
        }())
      </script>
    </body>
    </html>`;
  }
}
