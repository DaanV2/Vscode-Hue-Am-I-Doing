import { Application, GroupConfig, LightConfig, RoomConfig, SceneConfig, ZoneConfig } from "@daanv2/hue";

export interface BridgeReference {
  lights: LightConfig[];
  groups: GroupConfig[];
  rooms: RoomConfig[];
  zones: ZoneConfig[];
  scenes: SceneConfig[];
}

export type Identifiable = { id: string; type: string };
export type PropertyTypes = LightConfig | RoomConfig | ZoneConfig;

export namespace BridgeReference {
  export function create(): BridgeReference {
    return {
      lights: [],
      rooms: [],
      zones: [],
      groups: [],
      scenes: [],
    };
  }

  export async function getData(app: Application): Promise<BridgeReference> {
    const result = create();

    const lights = await app.getLight();
    result.lights = lights.data;
    if (lights.errors.length > 0) {
      throw new Error("Failed to get lights");
    }

    const rooms = await app.getRoom();
    result.rooms = rooms.data;
    if (rooms.errors.length > 0) {
      throw new Error("Failed to get rooms");
    }

    const zones = await app.getZone();
    result.zones = zones.data;
    if (zones.errors.length > 0) {
      throw new Error("Failed to get zones");
    }

    const groups = await app.getGroupedLight();
    result.groups = groups.data;
    if (groups.errors.length > 0) {
      throw new Error("Failed to get groups");
    }

    const scenes = await app.getScene();
    result.scenes = scenes.data;
    if (scenes.errors.length > 0) {
      throw new Error("Failed to get scenes");
    }

    return result;
  }
}
