import * as Comlink from "comlink";
import { Observable, Subscription } from "rxjs";
import type { RegistryContract } from "./contract";
import type { Operations, ProxyMarkedFunction, WorkerContract } from "./model";

interface ClientRep {
  clientId: string;
  subscriptions: Subscription;
}

const createClientRep = (clientId: string): ClientRep => ({
  clientId,
  subscriptions: new Subscription(),
});

type ClientRepMap = Map<string, ClientRep>;

export type WorkerContext = {
  subscribe: <T>(
    source$: Observable<T>,
    clientId: string,
    onNext: (value: T) => void,
    onError: (error: unknown) => void,
    onComplete: () => void,
  ) => ProxyMarkedFunction<() => void>;
  clients: ClientRepMap;
};

const subscribe =
  (clients: ClientRepMap) =>
  <T>(
    source$: Observable<T>,
    clientId: string,
    onNext: (value: T) => void,
    onError: (error: unknown) => void,
    onComplete: () => void,
  ): ProxyMarkedFunction<() => void> => {
    const client = clients.get(clientId);

    if (!client) {
      throw new ReferenceError(`Unknown client ${clientId}`);
    }

    const subscription = source$.subscribe({
      next: onNext,
      error: onError,
      complete: onComplete,
    });
    client.subscriptions.add(subscription);

    return Comlink.proxy(() => {
      subscription.unsubscribe();
      client.subscriptions.remove(subscription);
    });
  };

export const createWorkerFactory =
  (clients: ClientRepMap = new Map()) =>
  <T extends Operations>(
    factory: (context: WorkerContext) => WorkerContract<T>,
  ): WorkerContract<T> =>
    factory({
      subscribe: subscribe(clients),
      clients,
    });

export type WorkerFactory<T extends Operations> = (
  context: WorkerContext,
) => WorkerContract<T>;

export const registryWorkerFactory: WorkerFactory<RegistryContract> = (
  context,
) => {
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

export const createWorker = <T extends Operations>(
  factory: WorkerFactory<T>,
): WorkerContract<T> & WorkerContract<RegistryContract> => {
  const create = createWorkerFactory();
  return { ...create(factory), ...create(registryWorkerFactory) };
};
