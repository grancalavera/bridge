import * as Comlink from "comlink";
import type { RegistryContract } from "./contract";
import {
  subscriptions,
  wrapWorkerPort,
  type Operations,
  type Subscription,
  type SubscriptionKey,
  type SubscriptionInput,
} from "./model";

export interface CreateClientOptions {
  sharedWorker: SharedWorker;
  clientId?: string;
}

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

export const createClient = <T extends Operations>({
  sharedWorker,
  clientId = crypto.randomUUID(),
}: CreateClientOptions): readonly [
  T,
  <K extends SubscriptionKey<T>>(
    key: K,
    input?: SubscriptionInput<T, K>,
  ) => import("rxjs").Observable<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T[K] extends Subscription<infer Update, any> ? Update : never
  >,
] => {
  const { port } = sharedWorker;
  registerClient(port, clientId);
  const client = deriveClient<T>(port, clientId);
  return [client, subscriptions(client)] as const;
};
