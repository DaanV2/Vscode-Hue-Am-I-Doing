import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { BaseWebview } from "./webview";
import { DiscoveryBridgeData } from "@daanv2/hue";
import { DiscoveryHandler } from "../handlers/discovery";
import { SetupBridgeCommand } from "../commands/setup-bridge";

export class NewBridgeView extends BaseWebview {
  private bridges: DiscoveryBridgeData[];
  private discovery: DiscoveryHandler;

  constructor(controller: ExtensionController) {
    super("hue-am-i-doing.new-bridge", "New Bridge", controller);

    this.bridges = [];
    this.discovery = new DiscoveryHandler(controller);
  }

  setup(panel: vscode.WebviewPanel): void {
    this.discovery.getBridges().then((bridges) => {
      this.bridges = bridges;
      this.update(panel);
    });

    panel.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "setup":
          return this.setupBridge(message.bridge);
      }
    });
  }

  update(panel: vscode.WebviewPanel): void {
    panel.webview.html = this.getWebviewContent(panel.webview);
  }

  setupBridge(bridgeId: string) {
    const bridge = this.bridges.find((bridge) => bridge.id === bridgeId);
    if (!bridge) {
      return;
    }

    vscode.commands.executeCommand(SetupBridgeCommand.id, bridge);
    this.dispose();
  }

  getWebviewContent(webview: vscode.Webview) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${
        this.nonce
      }'; img-src ${webview.cspSource} https:; script-src 'nonce-${this.nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Bridge</title>
    </head>
    <body>
      <style nonce="${this.nonce}">
        .separator {
          border-top: 1px dotted #ffffff;
        }
        .bridge-button {
          border-color: #ffffff;
          border-radius: 2px;
          border-style: solid;
          border-width: thin;
          padding: 2px 4px;
        }
        .bridge {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          padding: 4px 0;
        }
        .bridge-id {
          padding: 0px 8px;
        }
        .bridge:hover {
          background-color: #f0f0f0;
        }
      </style>
      <div>
        <h1>New Bridge</h1>
        <hr class="separator">
        ${this.bridges.length === 0 ? "<p>Discovering bridges...</p>" : ""}
        <ul id="bridges">
          ${this.bridges.map((bridge) => this.getBridgeContent(bridge)).join("")}
        </ul>
      </div>

      <script nonce="${this.nonce}">
        var vscode;
        (function() {
          vscode = acquireVsCodeApi();
        }())

        // Get each button and add a click event listener
        var buttons = document.getElementsByClassName("bridge-button");
        for (var i = 0; i < buttons.length; i++) {
          const button = buttons[i];
          button.addEventListener("click", function() {
            const bridgeId = this.getAttribute("bridge");
            console.log("Setup bridge", bridgeId);
            vscode?.postMessage({command: 'setup',bridge: bridgeId});
          });
        }
      </script>
    </body>
    </html>`;
  }

  getBridgeContent(bridge: DiscoveryBridgeData) {
    return `<li id="${bridge.id}" class="bridge">
      <span class="bridge-id">${bridge.id}</span>
      <span class="bridge-button" bridge="${bridge.id}">Setup</span>
    </li>`;
  }
}
