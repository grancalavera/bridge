import * as Comlink from "comlink";
import {
  createWorkerFactory,
  registryWorkerFactory,
  type AnyWorkerFactory,
} from "./worker";

// eslint-disable-next-line no-undef
declare const self: SharedWorkerGlobalScope;

/**
 * Composes one or more worker factories into a single worker object.
 *
 * Creates a single shared clients map, invokes each factory with the same
 * {@link WorkerContext}, validates that no factory defines reserved or
 * duplicate operation keys, and attaches the built-in client registry.
 *
 * @internal Exported for testing only.
 */
export const composeFactories = (...factories: AnyWorkerFactory[]) => {
  const create = createWorkerFactory();
  const merged: Record<string, unknown> = {};

  for (const factory of factories) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contract = create(factory as any) as Record<string, unknown>;
    for (const key of Object.keys(contract)) {
      if (key === "registerClient") {
        throw new Error('"registerClient" is a reserved operation key');
      }
      if (key in merged) {
        throw new Error(
          `Duplicate operation key "${key}" across composed factories`,
        );
      }
      merged[key] = contract[key];
    }
  }

  const registry = create(registryWorkerFactory);
  return { ...merged, ...registry } as Record<string, unknown>;
};

/**
 * Initialises the SharedWorker runtime by composing one or more worker
 * factories into a single worker object and exposing it via Comlink on
 * each incoming port.
 *
 * Each factory receives the same shared {@link WorkerContext} so all
 * operations share a single clients map and subscription lifecycle.
 *
 * @param factories - One or more {@link WorkerFactory} functions to compose.
 */
export const createSharedWorkerRuntime = (...factories: AnyWorkerFactory[]) => {
  const worker = composeFactories(...factories);

  self.addEventListener("connect", (event) => {
    const port = event.ports[0];
    Comlink.expose(worker, port);
  });
};
