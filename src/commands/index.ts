import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { NewBridgeCommand } from "./new-bridge";
import { SetupBridgeCommand } from "./setup-bridge";
import { ConfigureBridgeCommand } from "./configure-bridge";

interface Command {
  id: string;
  getCommand: (context: vscode.ExtensionContext, controller: ExtensionController) => (...args: any[]) => any;
}

export function registerCommands(context: vscode.ExtensionContext, controller: ExtensionController): void {
  registerCommand(context, controller, NewBridgeCommand);
  registerCommand(context, controller, SetupBridgeCommand);
  registerCommand(context, controller, ConfigureBridgeCommand);
}

function registerCommand(context: vscode.ExtensionContext, controller: ExtensionController, command: Command): void {
  context.subscriptions.push(vscode.commands.registerCommand(command.id, command.getCommand(context, controller)));
}
