import { describe, it, expect, beforeAll } from "vitest";

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
        onNext: (value: string) => void,
        onError: (error: unknown) => void,
        onComplete: () => void,
      ) => Promise<() => void>;
    };

    const mockClient: TestContract = {
      testSubscription: async (onNext, _onError, onComplete) => {
        setTimeout(() => {
          onNext("test-value-1");
          onNext("test-value-2");
          onComplete();
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
        onNext: (value: string) => void,
        onError: (error: unknown) => void,
        onComplete: () => void,
      ) => Promise<() => void>;
    };

    const mockClient: TestContract = {
      errorSubscription: async (_onNext, onError, _onComplete) => {
        setTimeout(() => {
          onError(new Error("test-error"));
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
        onNext: (value: number) => void,
        onError: (error: unknown) => void,
        onComplete: () => void,
      ) => Promise<() => void>;
    };

    const mockClient: TestContract = {
      longSubscription: async (onNext, _onError, _onComplete) => {
        const interval = setInterval(() => {
          onNext(Date.now());
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
