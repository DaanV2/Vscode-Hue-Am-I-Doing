import * as vscode from "vscode";
import { Event } from "../../events/events";
import { ExtensionController } from "../../extension";
import { CommandController, ICommandExecute } from "./command-controller";

interface ViewBase extends ICommandExecute {
  dispose(): void;
}

export class ViewController {
  public readonly controller: ExtensionController;
  public readonly commands: CommandController;
  public readonly onUpdated: Event<(id: string, element: string) => void>;
  public readonly disposables: vscode.Disposable[];

  constructor(controller: ExtensionController) {
    this.controller = controller;
    this.commands = new CommandController();
    this.onUpdated = new Event<(id: string, element: string) => void>();
    this.disposables = [];
  }

  public dispose() {
    this.disposables.forEach((disposable) => disposable.dispose());
  }

  public register(item: Partial<ViewBase>): this {
    if (typeof item.dispose === "function") {
      this.disposables.push(item as vscode.Disposable);
    }

    if (typeof item.incoming === "function") {
      item = this.commands.register(item as ICommandExecute);
    }

    return this;
  }
}

export class ViewControllerContext<T> extends ViewController {
  public readonly context: T;

  constructor(controller: ExtensionController, context: T) {
    super(controller);
    this.context = context;
  }
}
