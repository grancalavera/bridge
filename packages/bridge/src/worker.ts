import * as Comlink from "comlink";
import { Observable, Subscription, type ObservableNotification } from "rxjs";
import { materialize } from "rxjs/operators";
import type { RegistryContract } from "./contract";
import type { Operations, ProxyMarkedFunction, WorkerContract } from "./model";

interface ClientRep {
  clientId: string;
  subscriptions: Subscription;
}

/** Creates a new {@link ClientRep} with an empty subscription container. */
const createClientRep = (clientId: string): ClientRep => ({
  clientId,
  subscriptions: new Subscription(),
});

type ClientRepMap = Map<string, ClientRep>;

/**
 * Context passed to worker factory functions.
 *
 * Provides a shared `clients` map and a `subscribe` helper so that
 * factories can register subscriptions that are automatically tracked
 * and cleaned up per client.
 */
export type WorkerContext = {
  subscribe: <T>(
    source$: Observable<T>,
    clientId: string,
    onNotification: (n: ObservableNotification<T>) => void,
  ) => ProxyMarkedFunction<() => void>;
  clients: ClientRepMap;
};

/**
 * Creates a `subscribe` function bound to the shared clients map.
 *
 * The returned function subscribes to `source$`, materializes notifications,
 * and forwards them to `onNotification`. The subscription is tracked under
 * the given client so it is automatically cleaned up when the client
 * disconnects.
 *
 * @returns A Comlink-proxied unsubscribe function the caller can invoke to
 *          cancel the subscription early.
 */
const subscribe =
  (clients: ClientRepMap) =>
  <T>(
    source$: Observable<T>,
    clientId: string,
    onNotification: (n: ObservableNotification<T>) => void,
  ): ProxyMarkedFunction<() => void> => {
    const client = clients.get(clientId);

    if (!client) {
      throw new ReferenceError(`Unknown client ${clientId}`);
    }

    const subscription = source$.pipe(materialize()).subscribe(onNotification);
    client.subscriptions.add(subscription);

    return Comlink.proxy(() => {
      subscription.unsubscribe();
      client.subscriptions.remove(subscription);
    });
  };

/**
 * Creates a reusable worker factory backed by a shared clients map.
 *
 * Each call to the returned function invokes `factory` with a
 * {@link WorkerContext} that shares the same `clients` map and `subscribe`
 * helper, so multiple factories can cooperate over a single set of clients.
 *
 * @param clients - Optional pre-existing clients map. A new map is created
 *                  when omitted.
 */
export const createWorkerFactory =
  (clients: ClientRepMap = new Map()) =>
  <T extends Operations>(
    factory: (context: WorkerContext) => WorkerContract<T>,
  ): WorkerContract<T> =>
    factory({
      subscribe: subscribe(clients),
      clients,
    });

/**
 * A factory function that receives a {@link WorkerContext} and returns a
 * worker contract implementing the operations defined by `T`.
 *
 * If `T` includes `registerClient`, the type resolves to `never` because
 * `registerClient` is a reserved operation key managed by the library.
 */
export type WorkerFactory<T extends Operations> =
  "registerClient" extends keyof T
    ? never
    : (context: WorkerContext) => WorkerContract<T>;

/**
 * An unconstrained worker factory type used internally. Unlike
 * {@link WorkerFactory}, this type does not reject `registerClient` —
 * it is used by {@link composeFactories} and for the built-in
 * {@link registryWorkerFactory}.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyWorkerFactory = (context: WorkerContext) => Record<string, any>;

/**
 * Built-in factory that implements the client registry.
 *
 * Provides `registerClient`, which adds the client to the shared clients map
 * and acquires a `navigator.locks` Web Lock keyed by `clientId`. When the
 * tab closes and the lock is released, all of the client's subscriptions are
 * unsubscribed and the client is removed from the map.
 */
export const registryWorkerFactory: (
  context: WorkerContext,
) => WorkerContract<RegistryContract> = (context) => {
  const { clients } = context;
  return {
    async registerClient(clientId) {
      if (clients.has(clientId)) {
        return;
      }

      clients.set(clientId, createClientRep(clientId));

      navigator.locks.request(clientId, async () => {
        const client = clients.get(clientId);
        if (!client) {
          console.warn(`Attempted to unregister unknown client ${clientId}`);
          return;
        }
        client.subscriptions.unsubscribe();
        clients.delete(clientId);
      });
    },
  };
};
