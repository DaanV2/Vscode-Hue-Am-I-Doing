import { Colors } from "../constants/colors";
import { BridgeReference, PropertyTypes } from "../hue/data";
import { ActionConfig, ActivityConfig } from "../types/bridgeConfig";
import { GroupConfig, Reference } from "@daanv2/hue";
import { ViewControllerContext } from "./util/view-controller";
import { BridgeHandler } from "../handlers";
import { BaseElement } from "./util/base-element";
import { ColorConfigElement } from "./color-config-element";

export interface ActivityElementCommand {
  element: string;
  value: any;
}

type ReferenceType = "light" | "zone" | "room";

export interface ActivityElementContext {
  bridge: {
    id: string;
    references: BridgeReference;
    data: BridgeHandler;
  };
}

export class ActivityElement extends BaseElement<ViewControllerContext<ActivityElementContext>> {
  private _enabled: boolean;
  private _name: string;
  private _type: ReferenceType;
  public action: ActionConfig;
  public color: ColorConfigElement;

  constructor(view: ViewControllerContext<ActivityElementContext>, base: ActivityConfig | undefined, name: string) {
    super(view);
    this._enabled = base?.enabled ?? false;
    this._name = base?.name ?? name;

    if (base?.action) {
      this.action = base.action;
    } else {
      this.action = {
        timeline: [],
        reference: Reference.from(
          view.context.bridge.references.lights[0] ?? {
            id: "",
            type: "light",
          }
        ),
      };
    }

    if (this.action.timeline.length === 0) {
      const d = {
        on: { on: true },
        dimming: Colors.GOLD.dimming,
        color: Colors.GOLD.color,
      };
      this.action.timeline.push(d);
    }

    this._type = this.determineTypeByReference(this.action.reference);
    this.color = new ColorConfigElement(view, this.action.timeline[0]);
  }

  public dispose(): void {}

  public incoming(command: ActivityElementCommand): void {
    switch (command.element) {
      case "enable":
        this.enabled = command.value;
        break;
      case "name":
        this.name = command.value;
        break;
      case "type":
        this.action.reference = Reference.extract(this.getReferences(command.value)[0]);
        this.type = command.value;
        break;

      case "action-reference":
        const items = this.getReferences();
        for (const item of items) {
          if (item.id === command.value) {
            this.action.reference = Reference.extract(item);
            super.callUpdate("action-reference");
            break;
          }
        }

        break;

      case "test":
        this.view.context.bridge.data.performAction(this.toConfig());
        break;
    }
  }

  public get enabled() {
    return this._enabled;
  }

  public set enabled(value) {
    this._enabled = value;
    super.callUpdate("enabled");
  }

  public get name() {
    return this._name;
  }

  public set name(value) {
    this._name = value;
    super.callUpdate("name");
  }

  public get type() {
    return this._type;
  }

  public set type(value) {
    this._type = value;
    super.callUpdate("type");
  }

  public getReferences(type?: ReferenceType) {
    switch (type ?? this._type) {
      default:
      case "light":
        return this.view.context.bridge.references.lights;
      case "room":
        return this.view.context.bridge.references.rooms;
      case "zone":
        return this.view.context.bridge.references.zones;
    }
  }

  public determineTypeByReference(reference: Reference): ReferenceType {
    //Search rooms & zones for the group
    if (reference.rtype === "grouped_light") {
      for (const room of this.view.context.bridge.references.rooms) {
        if (GroupConfig.hasGroup(room, this.action.reference)) {
          return "room";
        }
      }

      for (const zone of this.view.context.bridge.references.zones) {
        if (GroupConfig.hasGroup(zone, this.action.reference)) {
          return "zone";
        }
      }
    }

    return "light";
  }

  public toConfig(): ActivityConfig {
    const color = this.color.data;

    return {
      enabled: this.enabled,
      name: this.name,
      action: {
        reference: this.action.reference,
        timeline: [color],
      },
    };
  }

  public render() {
    return `
    <div ${this.defaultAttributes()} class="activity-element">
      <h3>${this.name}</h3>
      <button ${this.defaultAttributes()} class="test-button">Test</button>
      <div class="form-group" id="activity-${this.name}">
        <label for="enable-button" class="input-label">Enable activity</label>
        <input ${this.defaultAttributes()} type="checkbox" class="enable-button" ${this.enabled ? "checked" : ""}/>
        <div class="settings" ${this.enabled ? "" : "hidden"}>
          <label for="Select object type" class="input-label">Type of object</label>
          <select ${this.defaultAttributes()} class="select-type-reference">
            <option value="light" ${this._type === "light" ? "selected" : ""}>Lamps</option>
            <option value="room" ${this._type === "room" ? "selected" : ""}>Rooms</option>
            <option value="zone" ${this._type === "zone" ? "selected" : ""}>Zones</option>
          </select>

          ${this.lampSettings()}
          ${this.roomSettings()}
          ${this.zoneSettings()}
        </div>
      </div>
    </div>
    <hr class="separator" />`;
  }

  public lampSettings() {
    return `<div class="settings light" ${this._type === "light" ? "" : "hidden"}>
      ${this.referenceSettings(this.view.context.bridge.references.lights, "light")}
      </div>`;
  }

  public roomSettings() {
    return `<div class="settings room" ${this._type === "room" ? "" : "hidden"}>
      ${this.referenceSettings(this.view.context.bridge.references.rooms, "room")}
    </div>`;
  }

  public zoneSettings() {
    return `<div class="settings zone" ${this._type === "zone" ? "" : "hidden"}>
      ${this.referenceSettings(this.view.context.bridge.references.zones, "zone")}
    </div>`;
  }

  public referenceSettings(references: PropertyTypes[], type: string) {
    const selected = this.action.reference;

    return `
    <div class="horizontal-flex">
      <div>
        <label for="select object type" class="input-label">Select ${type}</label>
        <select ${this.defaultAttributes()} class="select-reference" type="${type}">
          ${references
            .map(
              (r) =>
                `<option value="${r.id}" ${hasReference(r, selected.rid) ? "selected" : ""}>${r.metadata.name}</option>`
            )
            .join("")}
        </select>
      </div
      <div class="color-config">
        ${this.color.render()}
      </div>
    </div>`;
  }

  public static script() {
    return `
    ${ColorConfigElement.script()}

    console.log("ActivityElement script loaded");

    // Activity Element Script

    // Get each enabled checkbox
    var buttons = document.getElementsByClassName("enable-button");
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("input", function() {
        const commandId = this.getAttribute("elemid");
        vscode?.postMessage({commandId, element:"enable", value: this.checked});
      });
    }

    //On select change
    var selects = document.getElementsByClassName("select-type-reference");
    for (let i = 0; i < selects.length; i++) {
      selects[i].addEventListener("change", function() {
        const commandId = this.getAttribute("elemid");
        vscode?.postMessage({commandId, element:"type", value: this.value});
      });
    };

    //On reference change
    var selects = document.getElementsByClassName("select-reference");
    for (let i = 0; i < selects.length; i++) {
      selects[i].addEventListener("change", function() {
        const commandId = this.getAttribute("elemid");
        const type = this.getAttribute("type");
        const value = this.value;
        vscode?.postMessage({element:"action-reference", commandId, type, value});
      });
    }

    //Test button
    var buttons = document.getElementsByClassName("test-button");
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function() {
        const commandId = this.getAttribute("elemid");
        vscode?.postMessage({commandId, element:"test"});
      });
    }`;
  }

  public static style() {
    return `
    ${ColorConfigElement.style()}

    .horizontal-flex {
      display: flex;
      flex-direction: row;
    }

    .settings {
      margin-left: 20px;
      transition: max-height 0.2s ease-out;
    }

    .settings.hidden {
      max-height: 0;
      overflow: hidden;
    }

    .input-label {
      margin-right: 10px;
    }
    `;
  }
}

function hasReference(ref: PropertyTypes, expectedId: string) {
  const r = Reference.extract(ref);
  return r && r.rid === expectedId;
}
