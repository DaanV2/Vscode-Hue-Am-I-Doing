import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { SetupBridgeView } from "../views/setup-bridge";
import { DiscoveryBridgeData } from "@daanv2/hue";

export namespace SetupBridgeCommand {
  export const id = "hue-am-i-doing.setup-bridge";

  export function getCommand(context: vscode.ExtensionContext, controller: ExtensionController) {
    return function (bridgeData: DiscoveryBridgeData) {
      if (bridgeData === undefined) {
        vscode.window.showErrorMessage("No bridge data provided");
        return;
      }

      //Type check the bridge data
      if (
        typeof bridgeData.id !== "string" ||
        typeof bridgeData.internalipaddress !== "string" ||
        typeof bridgeData.port !== "number"
      ) {
        vscode.window.showErrorMessage("Invalid bridge data provided");
        return;
      }

      const view = new SetupBridgeView(controller, bridgeData);
      return view.show();
    };
  }
}
