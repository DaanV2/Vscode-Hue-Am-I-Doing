import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { NewBridgeCommand } from "./new-bridge";
import { SetupBridgeCommand } from "./setup-bridge";
import { ConfigureBridgeCommand } from "./configure-bridge";
import { ClearAllDataCommand } from "./clear-all-data";
import { DeleteBridgeCommand } from "./delete-bridge";

interface Command {
  id: string;
  getCommand: (context: vscode.ExtensionContext, controller: ExtensionController) => (...args: any[]) => any;
}

export function registerCommands(context: vscode.ExtensionContext, controller: ExtensionController): void {
  registerCommand(context, controller, ClearAllDataCommand);
  registerCommand(context, controller, ConfigureBridgeCommand);
  registerCommand(context, controller, DeleteBridgeCommand);
  registerCommand(context, controller, NewBridgeCommand);
  registerCommand(context, controller, SetupBridgeCommand);
}

function registerCommand(context: vscode.ExtensionContext, controller: ExtensionController, command: Command): void {
  context.subscriptions.push(vscode.commands.registerCommand(command.id, command.getCommand(context, controller)));
}
