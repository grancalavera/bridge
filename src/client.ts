import * as Comlink from "comlink";
import type { ObservableNotification, Observable } from "rxjs";
import type { RegistryContract } from "./contract";
import {
  subscriptions,
  wrapWorkerPort,
  type Operations,
  type SubscriptionKey,
  type SubscriptionInput,
} from "./model";

export interface CreateClientOptions {
  sharedWorker: SharedWorker;
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
    const proxy = wrapWorkerPort<RegistryContract>(port);
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
 */
const deriveClient = <T extends Operations>(
  port: MessagePort,
  clientId: string,
): T => {
  const workerProxy = wrapWorkerPort<T>(port);
  const clientProxy = new Proxy(workerProxy, {
    get(target, propertyKey, receiver) {
      const property = Reflect.get(target, propertyKey, receiver);

      if (typeof property !== "function") return property;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (...args: any[]) => {
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
  registerClient(port, clientId);
  const client = deriveClient<T>(port, clientId);
  return [client, subscriptions(client)] as const;
};
