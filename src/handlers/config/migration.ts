import { BridgeHandler } from "../bridge";

/**
 * Preform migration of the config to the new format
 * @param bridge The bridge to migrate
 * @returns True if the config was migrated, false otherwise
 */
export async function migrateConfig(bridge: BridgeHandler) : Promise<boolean> {
  let result = false;

  //Get the name
  if (bridge.config.name === undefined) {
    const config = await bridge.app.getConfig();
    bridge.config.name = config.name;
    result = true;
  }

  return result;
}
