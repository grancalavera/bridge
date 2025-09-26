import * as Comlink from "comlink";
import type { RegistryContract } from "./contract";
import { wrapWorkerPort, type Operations } from "./model";

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

export const createClient = async <T extends Operations>({
  sharedWorker: { port },
  clientId = crypto.randomUUID(),
}: CreateClientOptions): Promise<T> => {
  await registerClient(port, clientId);
  return deriveClient<T>(port, clientId);
};
