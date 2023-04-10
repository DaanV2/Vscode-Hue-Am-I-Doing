import { Application, LightStateRequest, Reference } from "@daanv2/hue";
export const BRIDGE_CONFIG_KEY = "hue-am-i-doing-config";

export type BridgeStates = "not-connected" | "connected" | "rate-limited" | "error" | "unauthorized";

export interface BridgeConfig {
  actions: ActivitiesConfig;
  appId: string;
  appKey: string;
  bridgeId: string;
  ip: string;
  lastSeen: string;
  state: BridgeStates;
}

export interface ActivitiesConfig {
  onOops?: ActivityConfig;
  onVibin?: ActivityConfig;
  onNothing?: ActivityConfig;
  onBad?: ActivityConfig;
}

export interface ActivityConfig {
  enabled: boolean;
  name: string;
  action: ActionConfig;
}

export interface ActionConfig {
  reference: Reference;
  timeline: LightStateRequest[];
}

export namespace BridgeConfig {
  export function create(app: Application): BridgeConfig {
    return {
      appId: app.appId,
      appKey: app.appKey,
      bridgeId: app.bridge.bridgeId,
      ip: app.bridge.bridgeIp,
      lastSeen: new Date().toISOString(),
      state: "connected",
      actions: {},
    };
  }
}
