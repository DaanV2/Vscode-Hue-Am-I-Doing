import { Application, ClipError, HttpError, LightStateRequest, Reference } from "@daanv2/hue";
import { ActivityConfig, BridgeConfig } from "../types/bridgeConfig";
import { sleep } from "../util";
import { BridgeReference } from "../hue/data";

interface BridgeResult {
  errors: ClipError[];
  data: any[];
}

export class BridgeHandler {
  config: BridgeConfig;
  app: Application;

  constructor(config: BridgeConfig, app: Application) {
    this.config = config;
    this.app = app;
  }

  async performAction(action: ActivityConfig | undefined, abort?: AbortSignal): Promise<boolean> {
    if (!action || action.enabled === false) {
      return true;
    }
    console.debug("Performing action", action.name);

    const { reference, timeline } = action.action;
    for (const step of timeline) {
      if (abort?.aborted) {
        break;
      }

      const p = this.performStep(reference, step);
      const r = await this.handleRequest(p);
      if (!r) {
        return false;
      }

      await sleep(1000);
    }

    return true;
  }

  async performStep(ref: Reference, step: LightStateRequest): Promise<BridgeResult> {
    switch (ref.rtype) {
      case "grouped_light":
        return this.app.setGroupedLight(ref.rid, step);

      case "light":
        return this.app.setLight(ref.rid, step);
    }

    return {
      errors: [
        {
          address: "",
          description: `Unknown reference type: ${ref.rtype}`,
          type: 0,
        },
      ],
      data: [],
    };
  }

  async handleRequest(p: Promise<BridgeResult>): Promise<boolean> {
    return p
      .then((v) => {
        if (v.errors.length > 0) {
          throw new Error(v.errors.join("\n"));
        }
      })
      .then(() => {
        this.config.state = "connected";
        this.config.lastSeen = new Date().toISOString();
        return true;
      })
      .catch((err) => {
        this.processError(err);
        return false;
      });
  }

  async getReference(): Promise<BridgeReference> {
    return BridgeReference.getData(this.app)
      .then((v) => {
        this.config.state = "connected";
        return v;
      })
      .catch((err) => {
        this.processError(err);
        throw err;
      });
  }

  processError(error: any): void {
    console.warn("Received error on state change", this.config.bridgeId, error);
    this.config.state = "error";

    if (error instanceof HttpError) {
      // Bridge errors
      if (error.status >= 500) {
        return;
      }
      if (error.status >= 200 && error.status < 400) {
        this.config.state = "connected";
        return;
      }

      switch (error.status) {
        case 429:
          this.config.state = "rate-limited";
          return;
        case 404:
          this.config.state = "not-connected";
          return;
        case 403:
        case 401:
          this.config.state = "unauthorized";
          return;
      }
    } else {
      if (error.message?.includes("ECONNREFUSED")) {
        this.config.state = "unauthorized";
      }
    }
  }
}
