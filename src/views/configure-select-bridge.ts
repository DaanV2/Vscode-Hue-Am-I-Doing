import * as vscode from "vscode";
import { WebviewPanel } from "vscode";
import { BaseWebview } from "./webview";
import { ExtensionController } from "../extension";
import { ConfigureBridgeView } from "./configure-bridge";
import { BridgeHandler } from "../handlers";

export class ConfigureSelectBridgeView extends BaseWebview {
  public readonly controller: ExtensionController;
  public bridges: BridgeHandler[];

  constructor(controller: ExtensionController) {
    super("configure-select-bridge", "Select bridge for configuration", controller);
    this.controller = controller;

    this.bridges = this.controller.activity.apps;
  }

  update(panel: WebviewPanel): void {
    panel.webview.html = this.render(panel.webview);
  }

  setup(panel: WebviewPanel): void {
    panel.webview.onDidReceiveMessage((message) => {
      if (message.command === "select" && message.bridgeId) {
        ConfigureBridgeView.display(this.controller, message.bridgeId);
        this.dispose();
      }

      return;
    });
  }

  public render(webview: vscode.Webview) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${
        this.nonce
      }'; img-src ${webview.cspSource} https:; script-src 'nonce-${this.nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Configure Bridge</title>
    </head>
    <body>
      <style nonce="${this.nonce}">
        .bridge:hover {
          cursor: pointer;
          background-color: #eee;
        }
      </style>
      <div>
        <h1>Configure Bridges</h1>
        <h2>Select Bridges</h1>

        <ul>
          ${this.bridges.map((b) => `<li class="bridge" bridge="${b.app.bridge.bridgeId}">${b.app.bridge.bridgeId} - ${b.config.name}</li>`).join("")}
        </ul>
      </div>

      <script nonce="${this.nonce}">
        (function() {
          var vscode = acquireVsCodeApi();

          // Get each button and add a click event listener
          var buttons = document.getElementsByClassName("bridge");
          for (var i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            button.addEventListener("click", function() {
              const bridgeId = this.getAttribute("bridge");
              vscode?.postMessage({command:'select',bridgeId});
            });
          }
        }())
      </script>
    </body>
    </html>`;
  }
}
