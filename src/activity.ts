import * as vscode from "vscode";
import { ActivitiesConfig } from "./types/bridgeConfig";
import { ExtensionController } from "./extension";
import { ConfigureBridgeCommand } from "./commands/configure-bridge";
import { sleep } from "./util";

export type Activity = keyof ActivitiesConfig;
type Events = (listener: (e: any) => any) => any;

export class ActivityMonitor {
  private readonly ext: ExtensionController;
  private _state: Activity = "onNothing";
  private _statusBarItem: vscode.StatusBarItem;
  private _abortSignal: AbortController | undefined;
  private _activityScore: number = 0;
  private _ticker: NodeJS.Timeout;
  private _diagnostics: number;

  constructor(extension: ExtensionController) {
    this._activityScore = 0;
    this._diagnostics = 0;

    this.ext = extension;
    this._statusBarItem = vscode.window.createStatusBarItem(
      "hue-i-am-doing-activity-monitor-view",
      vscode.StatusBarAlignment.Left,
      0
    );

    this._statusBarItem.name = "Hue Activity Monitor";
    this._statusBarItem.accessibilityInformation = {
      label: "Hue Activity Monitor",
      role: "monitoring",
    };
    this._statusBarItem.command = {
      command: ConfigureBridgeCommand.id,
      title: "Configure Hue Bridges",
      tooltip: "Configure your hue bridge settings",
    };
    this._statusBarItem.show();

    this._ticker = setInterval(() => {
      if (this._activityScore > 5) {
        this.addActivityScore(-5);
      } else if (this._activityScore < 0) {
        this.addActivityScore(1);
      }
    }, 1000);

    this.setState("onNothing");
  }

  dispose(): void {
    this._statusBarItem.dispose();
    this._abortSignal?.abort();
    clearInterval(this._ticker);
  }

  setState(state: Activity): void {
    if (this._state === state) {
      return;
    }

    console.info("Performing activity: " + state);
    if (this._abortSignal) {
      this._abortSignal.abort();
    }

    this._abortSignal = new AbortController();
    const signal = this._abortSignal.signal;
    const old = this._state;
    this._state = state;

    switch (state) {
      case "onBad":
        this._statusBarItem.text = "💡 Bad Time";
        this._statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
        this._statusBarItem.tooltip = "You're having a bad time, huh?";
        break;
      case "onNothing":
        this._statusBarItem.text = "💡 Chillin";
        this._statusBarItem.backgroundColor = undefined;
        this._statusBarItem.tooltip = "Just chillin";
        break;
      case "onOops":
        this._statusBarItem.text = "💡 Oopsie";
        this._statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
        this._statusBarItem.tooltip = "Oopsie, something went wrong";
        break;
      case "onVibin":
        this._statusBarItem.text = "💡 Vibin";
        this._statusBarItem.backgroundColor = undefined;
        this._statusBarItem.tooltip = "Just vibin and coding";
        break;
    }

    this.ext.activity
      .performAction(state, signal)
      .then(() => {
        console.info("Activity performed: " + state);
      })
      .catch((err) => {
        console.error("Activity failed: " + state + ` - ${JSON.stringify(err)}`);
      })
      .finally(() => {
        if (state !== "onOops" || signal.aborted) {
          return;
        }
        sleep(5000).then(() =>{
          if (signal.aborted) {
            return;
          }

          this.setState(old);
        });
      });
  }

  addActivityScore(score: number, name?: string): void {
    //Clamp the score between -100 and 500
    this._activityScore += score;
    if (this._activityScore < -100) {
      this._activityScore = -100;
    } else if (this._activityScore > 500) {
      this._activityScore = 500;
    }

    if (name !== undefined) {
      console.log(`Activity ${name} => ${score} => ${this._activityScore}`);
    }

    if (this._activityScore > 100) {
      this.setState("onVibin");
    } else if (this._activityScore < 0) {
      this.setState("onBad");
    } else {
      this.setState("onNothing");
    }
  }

  registerEvents(subscriptions: vscode.Disposable[]): void {
    const add = (amount: number, name?: string) => {
      return this.addActivityScore.bind(this, amount, name ?? "Unknown");
    };

    const terminalChange = (terminal) => {
      //If there is no exit code, then it's probably just a new terminal
      if (terminal.exitStatus?.code ?? 0 !== 0) {
        this.setState("onOops");
        this.addActivityScore(-50, "Failed Terminal");
      }
    };

    subscriptions.push(
      //Debugging add 10
      vscode.debug.onDidChangeActiveDebugSession(add(10, "Change Active Debug Session")),
      vscode.debug.onDidChangeBreakpoints(add(10, "Did Change Breakpoints")),
      vscode.debug.onDidReceiveDebugSessionCustomEvent(add(10, "Did Receive Debug Session Custom Event")),
      vscode.debug.onDidStartDebugSession(add(25, "Did Start Debug Session")),
      vscode.debug.onDidTerminateDebugSession(add(25, "Did Terminate Debug Session")),

      //Env
      vscode.env.onDidChangeLogLevel(add(50, "Change Log Level")),
      vscode.env.onDidChangeTelemetryEnabled(add(50, "Change Telemetry Enabled")),

      //Extensions
      vscode.extensions.onDidChange(add(50, "Change Extensions")),

      //Languages
      vscode.languages.onDidChangeDiagnostics((diag) => {
        let sum = 0;
        diag.uris.forEach((uri) => {
          sum += vscode.languages.getDiagnostics(uri).length;
        });

        const diff = sum - this._diagnostics;
        this.addActivityScore(diff * -5, "Change Diagnostics");

        this._diagnostics = sum;
      }),

      //Tasks
      vscode.tasks.onDidStartTaskProcess(add(25)),
      vscode.tasks.onDidEndTaskProcess((t) => {
        if (t.exitCode !== 0) {
          this.setState("onOops");
          this.addActivityScore(-50, "Failed Task");
        } else {
          this.addActivityScore(25, "Completed Task");
        }
      }),

      // Terminal
      vscode.window.onDidOpenTerminal(add(50, "Open Terminal")),
      vscode.window.onDidChangeActiveTerminal(add(5, "Change Active Terminal")),
      vscode.window.onDidCloseTerminal(terminalChange),
      vscode.window.onDidChangeTerminalState(terminalChange),

      //Text Editor
      vscode.window.onDidChangeTextEditorSelection((e) => {
        const sum = e.selections.length;
        this.addActivityScore(sum * 1, "Change Text Editor Selection");
      }),
      vscode.window.onDidChangeTextEditorViewColumn((e) => {
        const value = 3 + e.viewColumn;
        this.addActivityScore(value * 10, "Change Text Editor View Column");
      }),
      vscode.window.onDidChangeTextEditorVisibleRanges(add(1, "Change Text Editor Visible Ranges")),

      //Notebook Editor
      vscode.window.onDidChangeNotebookEditorSelection((e) => {
        const sum = e.selections.length;
        this.addActivityScore(sum * 5, "Change Notebook Editor Selection");
      }),
      vscode.window.onDidChangeWindowState((e) => {
        if (e.focused) {
          this.addActivityScore(50, "Focused");
          return;
        }

        if (this._activityScore >= 50) {
          this.addActivityScore(-50, "Unfocused");
        }
      }),
      vscode.window.onDidChangeNotebookEditorVisibleRanges(add(1, "Change Notebook Editor Visible Ranges")),

      // Text Document
      vscode.workspace.onDidChangeTextDocument(add(1, "Change Text Document")),
      vscode.workspace.onDidOpenTextDocument(add(15, "Open Text Document")),
      vscode.workspace.onDidCloseTextDocument(add(15, "Close Text Document")),
      vscode.workspace.onDidCreateFiles((e) => this.addActivityScore(e.files.length * 25, "Create Files")),
      vscode.workspace.onDidRenameFiles((e) => this.addActivityScore(e.files.length * 20, "Rename Files")),
      vscode.workspace.onDidDeleteFiles((e) => this.addActivityScore(e.files.length * 15, "Delete Files")),
      vscode.workspace.onDidSaveTextDocument(add(15, "Save Text Document"))
    );
  }
}
