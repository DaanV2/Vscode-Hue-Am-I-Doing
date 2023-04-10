import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { NewBridgeView } from "../views/new-bridge";

export namespace NewBridgeCommand {
  export const id = "hue-am-i-doing.new-bridge";

  export function getCommand(context: vscode.ExtensionContext, controller: ExtensionController) {
    return function() {
      const view = new NewBridgeView(controller);
      return view.show();
    };
  }
}


