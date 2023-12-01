import * as vscode from "vscode";
import { WebviewPanel } from "vscode";
import { BaseWebview } from "./webview";
import { ExtensionController } from "../extension";
import { BridgeReference } from "../hue/data";
import { BridgeHandler } from "../handlers";
import { ActivityElement } from "./activity-element";
import { ViewControllerContext } from "./util/view-controller";

interface ConfigureBridgeViewContext {
  bridge: {
    id: string;
    references: BridgeReference;
    data: BridgeHandler;
  };
}

interface Activities {
  onVibin: ActivityElement;
  onBad: ActivityElement;
  onNothing: ActivityElement;
  onOops: ActivityElement;
}

export class ConfigureBridgeView extends BaseWebview {
  public readonly view: ViewControllerContext<ConfigureBridgeViewContext>;
  public activities: Activities;

  constructor(controller: ExtensionController, bridgeData: BridgeHandler, bridgeReferences: BridgeReference) {
    super("configure-bridge", "Configure Bridge", controller);

    const context = {
      bridge: {
        id: bridgeData.app.bridge.bridgeId,
        references: bridgeReferences,
        data: bridgeData,
      },
    };
    this.view = new ViewControllerContext(controller, context);

    this.activities = {
      onVibin: new ActivityElement(this.view, bridgeData.config.actions.onVibin, "On Vibin"),
      onBad: new ActivityElement(this.view, bridgeData.config.actions.onBad, "On Bad"),
      onNothing: new ActivityElement(this.view, bridgeData.config.actions.onNothing, "On Nothing"),
      onOops: new ActivityElement(this.view, bridgeData.config.actions.onOops, "On Oopsies"),
    };

    this.view.onUpdated.on(()=> {
      this.update(this._panel);
    });
  }

  setup(panel: WebviewPanel): void {
    panel.webview.onDidReceiveMessage((message) => {
      this.view.commands.incoming(message);
    });
  }

  update(panel: WebviewPanel): void {
    panel.webview.html = this.render(panel.webview);
  }

  dispose() {
    this.save();
    super.dispose();
  }

  save() {
    const data = this.view.context.bridge.data;
    data.config.actions.onBad = this.activities.onBad.toConfig();
    data.config.actions.onVibin = this.activities.onVibin.toConfig();
    data.config.actions.onNothing = this.activities.onNothing.toConfig();
    data.config.actions.onOops = this.activities.onOops.toConfig();

    this.controller.saveConfig();
  }

  render(webview: vscode.Webview) {
    // Local path to main script run in the webview
    const bridge = this.view.context.bridge;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${
        this.nonce
      }'; img-src ${webview.cspSource} https:; script-src 'nonce-${
      this.nonce
    }';">      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Configure Bridge</title>
    </head>
    <body>
      <style nonce="${this.nonce}">
        ${ActivityElement.style()}
        .top {
          display: flex;
          flex-direction: row;
        }
        .separator {
          border-top: 1px dotted #ffffff;
        }
        .bridge-table {
          border-collapse: collapse;
          width: 100%;
        }
        .property {
          font-weight: bold;
        }
        select {
          background-color: transparent;
          color: var(--vscode-editor-foreground);
        }
        option {
          background-color: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }
      </style>
      <div>
        <div class="top">
          <div class="headers">
            <h1>Configure Bridges</h1>
            <table class="bridge-table">
              <tr>
                <th></th>
                <th></th>
                <th></th>
              </tr>
              <tr>
                <td class="property">Bridge</td>
                <td>  </td>
                <td>${bridge.data.config.name}</td>
              </tr>
              <tr>
                <td class="property">Bridge Id</td>
                <td>  </td>
                <td>${bridge.data.app.bridge.bridgeId}</td>
              </tr>
              <tr>
                <td class="property">Last seen</td>
                <td>  </td>
                <td>${formatDateTime(bridge.data.config.lastSeen)}</td>
              <tr>
              </tr>
                <td class="property">State</td>
                <td>  </td>
                <td>${bridge.data.config.state}</td>
              </tr>
            </table>
          </div>
        </div>
        <hr class="separator" />
        <div class="activities">
          ${this.activities.onVibin.render()}
          ${this.activities.onNothing.render()}
          ${this.activities.onBad.render()}
          ${this.activities.onOops.render()}
        </div>
      </div>
      <script nonce="${this.nonce}">
        (function() {
          var vscode = acquireVsCodeApi();

          ${ActivityElement.script()}
        }())
      </script>
    </body>
    </html>`;
  }

  static async display(controller: ExtensionController, bridgeId: string) {
    const bridgeData = controller.activity.getBridge(bridgeId);
    if (!bridgeData) {
      throw new Error(`Failed to find bridge with id ${bridgeId}`);
    }

    const bridgeConfig = await bridgeData.getReference();
    const view = new ConfigureBridgeView(controller, bridgeData, bridgeConfig);
    view.show();

    return view;
  }
}


function formatDateTime(date: string) {
  const d = new Date(date);
  return d.toLocaleString();
}
