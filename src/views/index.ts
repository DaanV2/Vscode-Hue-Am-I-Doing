import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { BridgesTreeView } from "./activity-bridges-tree";

export function registerViews(context: vscode.ExtensionContext, controller: ExtensionController): void {
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("hue-am-i-doing-bridges-view", new BridgesTreeView(controller))
  );
}
