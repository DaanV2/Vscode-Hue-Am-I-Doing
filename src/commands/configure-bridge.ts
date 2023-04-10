import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { ConfigureBridgeView } from "../views/configure-bridge";
import { ConfigureSelectBridgeView } from "../views/configure-select-bridge";

interface BridgeContainer {
  bridge: string;
}

export namespace ConfigureBridgeCommand {
  export const id = "hue-am-i-doing.configure-bridge";

  export function getCommand(_context: vscode.ExtensionContext, controller: ExtensionController) {
    return function (bridgeId: string | BridgeContainer | undefined) {
      if (bridgeId === undefined) {
        const view = new ConfigureSelectBridgeView(controller);
        return view.show();
      }

      if (typeof bridgeId === "object") {
        bridgeId = bridgeId.bridge;
      }

      return ConfigureBridgeView.display(controller, bridgeId);
    };
  }
}
