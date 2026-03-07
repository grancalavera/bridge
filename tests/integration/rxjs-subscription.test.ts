import { describe, it, expect, beforeAll } from "vitest";
import type { ObservableNotification } from "rxjs";

describe("RxJS Subscription Lifecycle", () => {
  beforeAll(async () => {
    const { subscriptions } = await import("../../dist/index.js");

    expect(subscriptions).toBeDefined();
  });

  it("should import subscriptions helper from dist/index.js", async () => {
    const { subscriptions } = await import("../../dist/index.js");

    expect(subscriptions).toBeDefined();
    expect(typeof subscriptions).toBe("function");
  });

  it("should create observable from subscription function", async () => {
    const { subscriptions } = await import("../../dist/index.js");

    type TestContract = {
      testSubscription: (
        onNotification: (notification: ObservableNotification<string>) => void,
      ) => Promise<() => void>;
    };

    const mockClient: TestContract = {
      testSubscription: async (onNotification) => {
        setTimeout(() => {
          onNotification({ kind: "N", value: "test-value-1" });
          onNotification({ kind: "N", value: "test-value-2" });
          onNotification({ kind: "C" });
        }, 0);

        return () => {};
      },
    };

    const subscribe = subscriptions(mockClient);
    const observable = subscribe("testSubscription" as keyof TestContract);

    expect(observable).toBeDefined();
    expect(typeof observable.subscribe).toBe("function");

    const values: string[] = [];

    await new Promise<void>((resolve) => {
      observable.subscribe({
        next: (value) => values.push(value),
        error: () => {},
        complete: () => resolve(),
      });
    });

    expect(values).toEqual(["test-value-1", "test-value-2"]);
  });

  it("should handle subscription errors", async () => {
    const { subscriptions } = await import("../../dist/index.js");

    type TestContract = {
      errorSubscription: (
        onNotification: (notification: ObservableNotification<string>) => void,
      ) => Promise<() => void>;
    };

    const mockClient: TestContract = {
      errorSubscription: async (onNotification) => {
        setTimeout(() => {
          onNotification({ kind: "E", error: new Error("test-error") });
        }, 0);

        return () => {};
      },
    };

    const subscribe = subscriptions(mockClient);
    const observable = subscribe("errorSubscription" as keyof TestContract);

    let errorCaught = false;

    await new Promise<void>((resolve) => {
      observable.subscribe({
        next: () => {},
        error: (error) => {
          errorCaught = true;
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe("test-error");
          resolve();
        },
        complete: () => {},
      });
    });

    expect(errorCaught).toBe(true);
  });

  it("should handle subscription unsubscribe", async () => {
    const { subscriptions } = await import("../../dist/index.js");

    let unsubscribeCalled = false;

    type TestContract = {
      longSubscription: (
        onNotification: (notification: ObservableNotification<number>) => void,
      ) => Promise<() => void>;
    };

    const mockClient: TestContract = {
      longSubscription: async (onNotification) => {
        const interval = setInterval(() => {
          onNotification({ kind: "N", value: Date.now() });
        }, 10);

        return () => {
          clearInterval(interval);
          unsubscribeCalled = true;
        };
      },
    };

    const subscribe = subscriptions(mockClient);
    const observable = subscribe("longSubscription" as keyof TestContract);

    const subscription = observable.subscribe({
      next: () => {},
      error: () => {},
      complete: () => {},
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    subscription.unsubscribe();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(unsubscribeCalled).toBe(true);
  });
});
