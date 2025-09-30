import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import type { Operations, ProxyMarkedFunction, WorkerContract } from "./model";
import * as Comlink from "comlink";
import type { RegistryContract } from "./contract";

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
  notify: <T>(source$: Subject<T> | BehaviorSubject<T>, value: T) => T;
  subscribe: <T>(
    source$: Observable<T>,
    clientId: string,
    onNext: (value: T) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
  ) => ProxyMarkedFunction<() => void>;
  clients: ClientRepMap;
};

const notify = <T>(source$: Subject<T> | BehaviorSubject<T>, value: T): T => {
  if (source$.observed) {
    source$.next(value);
  }
  return value;
};

const subscribe =
  (clients: ClientRepMap) =>
  <T>(
    source$: Observable<T>,
    clientId: string,
    onNext: (value: T) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
  ): ProxyMarkedFunction<() => void> => {
    const client = clients.get(clientId);

    if (!client) {
      throw new ReferenceError(`Unknown client ${client}`);
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
      notify,
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
) => {
  const create = createWorkerFactory();
  return { ...create(factory), ...create(registryWorkerFactory) };
};
