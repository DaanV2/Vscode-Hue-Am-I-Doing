import { ViewController } from "./view-controller";

export abstract class BaseElement<T extends ViewController> {
  public readonly view: T;
  public readonly commandId: string;

  constructor(view: T) {
    this.view = view;
    view.register(this);
  }

  /**
   * Dispose the element
   */
  public abstract dispose(): void;

  /**
   * Incoming command from the view
   * @param item The command
   */
  public abstract incoming(item: any): void;

  public defaultAttributes() {
    return `elemid=${this.commandId}`;
  }

  /**
   * Call the update event
   * @param element
   */
  public callUpdate(element: string): void {
    this.view.onUpdated.call(this.commandId, element);
  }

  public callUpdateAfter<T>(item: PromiseLike<T>, element: string): void {
    item.then(() => this.callUpdate(element));
  }
}
