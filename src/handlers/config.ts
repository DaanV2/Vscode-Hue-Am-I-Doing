import * as vscode from "vscode";

export class ConfigHandler {
  private secrets: vscode.SecretStorage;

  constructor(secrets: vscode.SecretStorage) {
    this.secrets = secrets;
  }

  /** Get a config from the secret storage
   * @param key The key to get the config from
   * @returns The config or undefined if it doesn't exist*/
  public async get<T>(key: string): Promise<T | undefined> {
    console.debug(`Loading config ${key}`);

    return this.secrets.get(key).then((out) => {
      if (out) {
        try {
          return JSON.parse(out) as T;
        } catch (e) {}
      }

      return undefined;
    });
  }

  /** Store a config in the secret storage
   * @param key The key to store the config under
   * @param config The config to store
   * @returns A promise that resolves when the config is stored*/
  public async store<T>(key: string, config: T): Promise<void> {
    console.debug(`Storing config ${key}`);

    return this.secrets.store(key, JSON.stringify(config));
  }
}
