import * as vscode from "vscode";
import * as crypto from "crypto";
import { ExtensionController } from "../extension";

export abstract class BaseWebview {
  /** Leads to the `/assets` folder */
  public readonly assetsFolder: vscode.Uri;
  public readonly controller: ExtensionController;
  public readonly nonce: string;
  protected _panel: vscode.WebviewPanel | undefined;
  public readonly id: string;
  public readonly title: string;

  constructor(id: string, title: string, controller: ExtensionController) {
    this.controller = controller;
    this.id = id;
    this.title = title;

    // Generate a nonce to base64 encode the script
    this.nonce = crypto.randomBytes(16).toString("base64");
    this.assetsFolder = this.controller.assets.base;
  }

  dispose(): void {
    if (this._panel) {
      this._panel.dispose();
      this._panel = undefined;
    }
  }

  show(): Promise<void> {
    this._panel = vscode.window.createWebviewPanel(this.id, this.title, vscode.ViewColumn.Active, {
      enableScripts: true,
      localResourceRoots: [this.assetsFolder],
    });

    this._panel.onDidDispose(() => {
      this.dispose();
    });

    this.setup(this._panel);
    this.update(this._panel);

    return new Promise<void>((resolve) => {
      this._panel?.onDidDispose(() => {
        this._panel = undefined;
        resolve();
      });
    });
  }

  close() : void {
    this._panel?.dispose();
  }

  abstract update(panel: vscode.WebviewPanel): void;

  abstract setup(panel: vscode.WebviewPanel): void;
}
