import * as Comlink from "comlink";
import { Observable, Subject, type ObservableNotification } from "rxjs";
import { dematerialize } from "rxjs/operators";
import type { RegistryContract } from "./contract";
import type {
  Operations,
  SubscriptionInput,
  SubscriptionKey,
  WorkerContract,
} from "./model";

/**
 * Creates a subscription helper for the given client proxy.
 *
 * Returns a function that, given a subscription key and optional input,
 * produces an RxJS Observable that bridges the worker's materialized
 * notification stream back into a live Observable on the client side.
 *
 * @param client - The client proxy whose subscription operations to wrap.
 */
export const subscriptions = <T extends Operations>(client: T) => {
  function subscribe<K extends SubscriptionKey<T>>(
    key: K,
    ...args: SubscriptionInput<T, K> extends void
      ? []
      : [input: SubscriptionInput<T, K>]
  ) {
    type U = T[K] extends (
      onNotification: (
        notification: ObservableNotification<infer Update>,
      ) => void,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => Promise<() => void>
      ? Update
      : never;

    return new Observable<U>((subscriber) => {
      const subscription = client[key] as unknown as (
        onNotification: (notification: ObservableNotification<U>) => void,
        ...args: SubscriptionInput<T, K> extends void
          ? []
          : [input: SubscriptionInput<T, K>]
      ) => Promise<() => void>;

      const notifications$ = new Subject<ObservableNotification<U>>();
      const sub = notifications$.pipe(dematerialize()).subscribe(subscriber);
      const onNotification = (n: ObservableNotification<U>) =>
        notifications$.next(n);

      const unsubscribePromise = subscription(onNotification, ...args);

      return () => {
        sub.unsubscribe();
        notifications$.complete();
        unsubscribePromise.then((f) => f());
      };
    });
  }
  return subscribe;
};

/** Options for {@link createClient}. */
export interface CreateClientOptions {
  /** The SharedWorker instance to connect to. */
  sharedWorker: SharedWorker;
  /** Optional client identifier. A random UUID is generated when omitted. */
  clientId?: string;
}

/**
 * Registers a client with the SharedWorker.
 *
 * Acquires a `navigator.locks` Web Lock keyed by `clientId` and calls
 * `registerClient` on the worker through the given port. The lock is held
 * with an unresolved promise so it persists for the lifetime of the tab,
 * allowing the worker to detect when the tab closes.
 */
const registerClient = async (
  port: MessagePort,
  clientId: string,
): Promise<void> => {
  const registration = Promise.withResolvers<void>();

  navigator.locks.request(clientId, async () => {
    const proxy = Comlink.wrap<WorkerContract<RegistryContract>>(port);
    await proxy.registerClient(clientId);
    registration.resolve();
    return new Promise(() => {});
  });

  return registration.promise;
};

/**
 * Creates a proxy around the worker that auto-prepends `clientId` to every
 * method call. Function arguments are wrapped with `Comlink.proxy` so
 * callbacks (e.g. subscription notification handlers) can cross the
 * worker boundary.
 *
 * Every proxied call awaits `ready` before reaching the worker, ensuring
 * client registration completes before any operation is forwarded. This
 * prevents a race where the worker receives calls from a client it hasn't
 * registered yet. After the first resolution `await ready` is a no-op.
 */
const deriveClient = <T extends Operations>(
  port: MessagePort,
  clientId: string,
  ready: Promise<void>,
): T => {
  const workerProxy = Comlink.wrap<WorkerContract<T>>(port);
  const clientProxy = new Proxy(workerProxy, {
    get(target, propertyKey, receiver) {
      const property = Reflect.get(target, propertyKey, receiver);

      if (typeof property !== "function") return property;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (...args: any[]) => {
        // Gate on registration: no call reaches the worker until the client is registered.
        await ready;
        const processedArgs = args.map((arg) =>
          typeof arg === "function" ? Comlink.proxy(arg) : arg,
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (property as any)(...[clientId, ...processedArgs]);
      };
    },
  }) as T;

  return clientProxy;
};

/**
 * Connects to a SharedWorker and returns a typed client proxy paired with a
 * subscription helper.
 *
 * Generates a random `clientId` (or uses the one provided), registers the
 * client with the worker, and returns a tuple of:
 * 1. A proxy that forwards every call to the worker with `clientId`
 *    prepended automatically.
 * 2. A `subscriptions` function for creating RxJS Observables from the
 *    worker's subscription-based operations.
 */
export const createClient = <T extends Operations>({
  sharedWorker,
  clientId = crypto.randomUUID(),
}: CreateClientOptions): readonly [
  T,
  <K extends SubscriptionKey<T>>(
    key: K,
    ...args: SubscriptionInput<T, K> extends void
      ? []
      : [input: SubscriptionInput<T, K>]
  ) => Observable<
    T[K] extends (
      onNotification: (
        notification: ObservableNotification<infer Update>,
      ) => void,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => Promise<() => void>
      ? Update
      : never
  >,
] => {
  const { port } = sharedWorker;
  const ready = registerClient(port, clientId);
  const client = deriveClient<T>(port, clientId, ready);
  return [client, subscriptions(client)] as const;
};
