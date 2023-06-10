import { Events } from "../../src/events/events";


interface TestEventHooks {
  test1(arg1: string, arg2: number): void;
  test2(arg1: string, arg2: number): void;
}


describe("Event Handler", () => {
  test("If a handler is registered, it should be called when the event is called", () => {
    const events = new Events<TestEventHooks>();
    const handler = jest.fn();

    events.on("test1", handler);
    events.call("test1", "test", 1);

    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith("test", 1);
  });

  test("If a multiple handlers are registered, they should all be called when the event is called", () => {
    const events = new Events<TestEventHooks>();
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    events.on("test1", handler1);
    events.on("test1", handler2);
    events.call("test1", "test", 1);

    expect(handler1).toBeCalledTimes(1);
    expect(handler1).toBeCalledWith("test", 1);

    expect(handler2).toBeCalledTimes(1);
    expect(handler2).toBeCalledWith("test", 1);
  });

  test("If multiple events over multiple handlers are registered, they should all be called when the event is called", () => {
    const events = new Events<TestEventHooks>();
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    events.on("test1", handler1);
    events.on("test2", handler2);
    events.call("test1", "test", 1);
    events.call("test2", "test", 1);

    expect(handler1).toBeCalledTimes(1);
    expect(handler1).toBeCalledWith("test", 1);

    expect(handler2).toBeCalledTimes(1);
    expect(handler2).toBeCalledWith("test", 1);
  });

  test("If events are cleared, they should not be called when the event is called", () => {
    const events = new Events<TestEventHooks>();
    const handler = jest.fn();

    events.on("test1", handler);
    events.clearEvents();
    events.call("test1", "test", 1);

    expect(handler).toBeCalledTimes(0);
  });

  test("If specific event is cleared, it should not be called when the event is called", () => {
    const events = new Events<TestEventHooks>();
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    events.on("test1", handler1);
    events.on("test2", handler2);
    events.clearEvents("test1");
    events.call("test1", "test", 1);
    events.call("test2", "test", 1);

    expect(handler1).toBeCalledTimes(0);

    expect(handler2).toBeCalledTimes(1);
    expect(handler2).toBeCalledWith("test", 1);
  });
});
