type EventCallback = (...args: any) => void;
type EventsContainer<T> = { [P in EventName<T>]: T[P] };
type EventName<T> = keyof T;

export class Event<T extends EventCallback> {
  private handlers: T[];

  constructor() {
    this.handlers = [];
  }

  public on(handler: T) {
    this.handlers.push(handler);
  }

  public call(...args: Parameters<T>) {
    this.handlers.forEach((handler) => handler.call(null, ...args as Parameters<T>[]));
  }
}

export class Events<T extends EventsContainer<T>> {
  private events: Record<EventName<T>, Event<T[EventName<T>]>>;

  constructor() {
    this.events = {} as Record<EventName<T>, Event<T[EventName<T>]>>;
  }

  public clearEvents<K extends EventName<T>>(name?: K) {
    if (name) {
      this.events[name] = new Event<T[K]>();
    } else {
      this.events = {} as Record<EventName<T>, Event<T[EventName<T>]>>;
    }
  }

  public on<K extends EventName<T>>(name: K, handler: T[K]) {
    if (!this.events[name]) {
      this.events[name] = new Event<T[K]>();
    }

    this.events[name].on(handler);
  }

  public call<K extends EventName<T>>(name: K, ...args: Parameters<T[K]>) {
    if (this.events[name]) {
      this.events[name].call(...args);
    }
  }
}
