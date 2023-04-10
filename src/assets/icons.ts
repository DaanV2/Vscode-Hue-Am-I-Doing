import * as vscode from "vscode";

export class Icons {
  public readonly icon: vscode.Uri;

  constructor(baseUri: vscode.Uri) {
    const resources = vscode.Uri.joinPath(baseUri, "resources");

    this.icon = vscode.Uri.joinPath(resources, "icon.svg");
  }
}
