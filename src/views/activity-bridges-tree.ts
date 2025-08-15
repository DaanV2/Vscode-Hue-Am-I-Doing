import * as vscode from "vscode";
import { ExtensionController } from "../extension";
import { BridgeStates } from "../types/bridgeConfig";

export interface BridgeItem {
  bridge: string;
  state: BridgeStates;
}

export class BridgesTreeView implements vscode.TreeDataProvider<BridgeItem> {
  private readonly ext: ExtensionController;
  private readonly _onDidChangeTreeData: vscode.EventEmitter<void | BridgeItem | BridgeItem[] | null | undefined>;

  constructor(ext: ExtensionController) {
    this.ext = ext;

    this._onDidChangeTreeData = new vscode.EventEmitter();

    this.ext.activity.on("afterBridgedDeleted", () => this._onDidChangeTreeData.fire());
    this.ext.activity.on("onBridgedAdded", () => this._onDidChangeTreeData.fire())
  }

  get onDidChangeTreeData() {
    return this._onDidChangeTreeData.event;
  }

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
