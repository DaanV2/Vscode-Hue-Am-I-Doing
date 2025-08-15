import * as vscode from "vscode";
import { ExtensionController } from "../extension";

interface BridgeContainer {
  id: string;
  bridge: string;
}

export namespace DeleteBridgeCommand {
  export const id = "hue-am-i-doing.delete-bridge";

  export function getCommand(_context: vscode.ExtensionContext, controller: ExtensionController) {
    return async function (bridgeId: string | BridgeContainer | undefined) {
      if (bridgeId === undefined) throw new Error("expected a bridgeId or bridge config");
      if (typeof bridgeId === "object") {
        bridgeId = bridgeId.id;
      }

      const choice = await vscode.window.showWarningMessage(
        "Are you sure you want to delete: " + bridgeId,
        {
          modal: true,
          detail: "Are you sure you want to delete: " + bridgeId,
        },
        "Delete"
      );

      switch (choice) {
        case "Delete":
          await controller.activity.deleteBridge(id);
          vscode.window.showInformationMessage("Delete bridge: " + bridgeId);
          return;
      }
    };
  }
}
