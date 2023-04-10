import * as vscode from "vscode";
import { Discovery, DiscoveryBridgeData, HttpError } from "@daanv2/hue";
import { ExtensionController } from "../extension";

export class DiscoveryHandler {
  private controller: ExtensionController;

  constructor(controller: ExtensionController) {
    this.controller = controller;
  }

  async getBridges(): Promise<DiscoveryBridgeData[]> {
    return Discovery.getBridgesOnNetwork().catch((err) => {
      handleErr(err);
      return [];
    });
  }
}

function handleErr(err: any) {
  if (err instanceof HttpError) {
    vscode.window.showErrorMessage(
      `An error ocurred during the discovery of bridges:\n\t${err.name}\n\t${err.message}\n\t${err.status}: ${err.statusText}`
    );
    return;
  }

  if (err instanceof Error) {
    vscode.window.showErrorMessage(`An error ocurred during the discovery of bridges:\n\t${err.message}`);
    return;
  }

  vscode.window.showErrorMessage(`An unknown error ocurred during the discovery of bridges:\n\n${JSON.stringify(err)}`);
}
