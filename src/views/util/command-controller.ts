export interface ICommand {
  commandId: string;
  element: string;
  value: any;
}

export interface ICommandExecute {
  commandId: string;
  incoming(item: ICommand): void;
}

export class CommandController {
  private _commands: Map<string, ICommandExecute>;

  constructor() {
    this._commands = new Map();
  }

  public register<T extends ICommandExecute>(item: T): T {
    const id = `command-${this._commands.size}`;
    item.commandId = id;
    this._commands.set(id, item);

    return item;
  }

  public incoming<T extends ICommand>(item: T): void {
    const command = this._commands.get(item.commandId);
    if (command) {
      return command.incoming(item);
    }
  }
}
