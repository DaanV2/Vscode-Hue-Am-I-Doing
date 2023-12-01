import { BaseElement } from "./util/base-element";
import { BridgeHandler } from "../handlers";
import { BridgeReference } from "../hue/data";
import { Colors } from "../constants/colors";
import { Gamut, LightStateRequest, SceneConfig, RGB } from "@daanv2/hue";
import { ICommand } from "./util/command-controller";
import { ViewControllerContext } from "./util/view-controller";
import * as math from "../math";

type Mode = "color" | "temperature";

export interface ColorConfigElementContext {
  bridge: {
    id: string;
    references: BridgeReference;
    data: BridgeHandler;
  };
}

export class ColorConfigElement extends BaseElement<ViewControllerContext<ColorConfigElementContext>> {
  public data: LightStateRequest;
  public mode: Mode;
  public scenes: SceneConfig[];

  constructor(view: ViewControllerContext<ColorConfigElementContext>, data: LightStateRequest | undefined) {
    super(view);

    this.data = data ?? {
      on: {
        on: true,
      },
      dimming: Colors.GOLD.dimming,
      color: Colors.GOLD.color,
    };
  }

  public dispose(): void {}

  public incoming(item: ICommand): void {
    switch (item.element) {
      case "color":
        const rgb = RGB.fromHex(item.value);
        const color = Gamut.fromRGB(rgb);

        this.data = {
          on: this.data.on,
          dimming: color.dimming,
          color: color.color,
        };

        super.callUpdate("color");
        break;

      case "dimming":
        this.data.dimming.brightness = math.clamp(item.value, 0, 100);
        super.callUpdate("dimming");
        break;

      case "enable":
        if (!this.data.on) {
          this.data.on = { on: true };
        }

        this.data.on.on = item.value === true || item.value === "true";
        super.callUpdate("enable");
        break;
    }
  }

  public render() {
    let color: string;
    const data = this.data;

    if (LightStateRequest.isXY(data)) {
      const rgb = Gamut.toRGB(data.color.xy.x, data.color.xy.y, data.dimming.brightness);
      color = RGB.toHex(rgb);
    }

    return `
      <tr hidden>
        <td>
          <label for="lamp-enabled" class="input-label">On/Off</label>
        </td>
        <td></td>
        <td>
          <input id="lamp-enabled" ${super.defaultAttributes()} type="radio" class="lamp-enable" value="true" ${this.data.on?.on ? "checked" : ""}/>
        </td>
      </tr>
      <tr>
        <td>
          <label for="lamp-disabled" class="input-label">Color</label>
        </td>
        <td></td>
        <td>
        <input id="color-picker" ${super.defaultAttributes()} type="color" class="color-picker-lamp" value="${color}"/>
        </td>
      </tr>
      <tr>
        <td>
          <label for="lamp-disabled" class="input-label">Dimming</label>
        </td>
        <td></td>
        <td>
          <input id="dimming" ${super.defaultAttributes()} type="range" class="lamp-dimming"
            min="0" max="100" value="${this.data.dimming.brightness}"/>
        </td>
      </tr>`;
  }

  public static script() {
    return `
    // console.log("ColorConfigElement script loaded");
    //Color picker script

    // On/Off
    var enable = document.getElementsByClassName("lamp-enable");
    for (var i = 0; i < enable.length; i++) {
      enable[i].addEventListener("click", function(event) {
        const commandId = this.getAttribute("elemid");
        const value = event.target.value;
        vscode?.postMessage({element:"enable", commandId, value});
      });
    }

    // Color
    var color = document.getElementsByClassName("color-picker-lamp");
    for (var i = 0; i < color.length; i++) {
      color[i].addEventListener("change", function(event) {
        const commandId = this.getAttribute("elemid");
        const value = event.target.value;
        vscode?.postMessage({element:"color", commandId, value});
      });
    }

    // Dimming
    var dimming = document.getElementsByClassName("lamp-dimming");
    for (var i = 0; i < dimming.length; i++) {
      dimming[i].addEventListener("input", function(event) {
        const commandId = this.getAttribute("elemid");
        const value = event.target.value;
        vscode?.postMessage({element:"dimming", commandId, value});
      });
    }`;
  }

  public static style() {
    return `
    .color-picker-container {
      display: flex;
      flex-direction: column;
      padding-left: 10px;
    }

    .color-picker-lamp {
      padding: 0;
      border: none;
      background: none;
      outline: none;
    }

    .lamp-dimming {
      width: 100%;
      background: none;
    }`;

  }
}
