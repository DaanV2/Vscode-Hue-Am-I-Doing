import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { ConfigureBridgeView } from "../views/configure-bridge";
import { ConfigureSelectBridgeView } from "../views/configure-select-bridge";
import { BRIDGE_CONFIG_KEY } from "../types/bridgeConfig";

interface BridgeContainer {
  id: string;
  bridge: string;
}

export namespace ClearAllDataCommand {
  export const id = "hue-am-i-doing.clear-all-data";

  export function getCommand(_context: vscode.ExtensionContext, controller: ExtensionController) {
    return async function () {
      const ids = controller.activity.apps.map((app) => app.config.bridgeId);
      ids.forEach((id) => controller.activity.deleteBridge(id));

      vscode.window.showInformationMessage("Deleted all data");
    };
  }
}
