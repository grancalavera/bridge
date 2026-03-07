import * as Comlink from "comlink";

// eslint-disable-next-line no-undef
declare const self: SharedWorkerGlobalScope;

/**
 * Initialises the SharedWorker runtime by listening for incoming connections
 * and exposing the given worker object on each port via Comlink.
 *
 * @param worker - The worker object to expose to connecting clients.
 */
export const createSharedWorkerRuntime = (worker: unknown) => {
  self.addEventListener("connect", (event) => {
    const port = event.ports[0];
    Comlink.expose(worker, port);
  });
};
