import { Application, Bridge } from "@daanv2/hue";
import { BridgeConfig } from "./types/bridgeConfig";
import { BridgeHandler } from "./handlers/bridge";

export namespace State {
  let config: BridgeConfig[] = [];
  let apps: BridgeHandler[] = [];

  export function getConfig() {
    return config;
  }


}
