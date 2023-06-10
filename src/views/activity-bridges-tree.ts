import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { BridgeStates } from "../types/bridgeConfig";

export interface BridgeItem {
  bridge: string;
  state: BridgeStates;
}

export class BridgesTreeView implements vscode.TreeDataProvider<BridgeItem> {
  private readonly ext: ExtensionController;

  constructor(ext: ExtensionController) {
    this.ext = ext;
  }

  onDidChangeTreeData?: vscode.Event<void | BridgeItem | BridgeItem[] | null | undefined> | undefined;

  getTreeItem(element: BridgeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    const { bridge, state } = element;

    let strState = "❔";

    switch (state) {
      case "connected":
        strState = "🟢";
        break;
      case "error":
      case "not-connected":
        strState = "🔴";
        break;
      case "unauthorized":
        strState = "♻️";
    }

    const item = new vscode.TreeItem(`${strState} ${bridge}`, vscode.TreeItemCollapsibleState.None);
    item.accessibilityInformation = {
      label: `Bridge ${bridge} with status: ${state}`,
    };
    item.tooltip = `The bridge ${bridge} with status: ${state}`;

    return item;
  }

  getChildren(element?: BridgeItem | undefined): vscode.ProviderResult<BridgeItem[]> {
    if (element) {
      return undefined;
    }

    return this.ext.activity.apps.map((a) => {
      return {
        bridge: a.config.name ?? a.config.bridgeId,
        state: a.config.state,
        id: a.config.bridgeId,
        internalipaddress: a.config.ip,
        port: 443,
      };
    });
  }

  getParent?(element: BridgeItem): vscode.ProviderResult<BridgeItem> {
    if (element) {
      return undefined;
    }
  }
}
