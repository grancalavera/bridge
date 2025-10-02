import * as Comlink from "comlink";

// eslint-disable-next-line no-undef
declare const self: SharedWorkerGlobalScope;

export const createSharedWorkerRuntime = (worker: unknown) => {
  self.addEventListener("connect", (event) => {
    const port = event.ports[0];
    Comlink.expose(worker, port);
  });
};
