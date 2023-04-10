import * as vscode from "vscode";
import { ExtensionController } from "./extension";
import { registerCommands } from "./commands";
import { registerViews } from "./views";
import { ActivityMonitor } from "./activity";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.info("Extension 'hue-am-i-doing' is loading");

  const controller = new ExtensionController(context);
  context.subscriptions.push(controller);

  controller.setup().then(() => setupExtension(context, controller));
}

function setupExtension(context: vscode.ExtensionContext, controller: ExtensionController) {
  registerViews(context, controller);
  registerCommands(context, controller);

  const monitor = new ActivityMonitor(controller);
  context.subscriptions.push(monitor);
  monitor.registerEvents(context.subscriptions);
}

// This method is called when your extension is deactivated
export function deactivate() {}
